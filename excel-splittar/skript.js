// Initialiser Lucide-ikon
lucide.createIcons();

// State
let allRows = [];
let originalFileName = "dokument";
let originalExtension = "xlsx";

// DOM Element
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

const uploadSection = document.getElementById('upload-section');
const configSection = document.getElementById('config-section');
const successSection = document.getElementById('success-section');

const totalRowsEl = document.getElementById('total-rows');
const numSplitsInput = document.getElementById('num-splits');
const rowsPerFileEl = document.getElementById('rows-per-file');

const hasHeadersCheckbox = document.getElementById('has-headers');
const hasHeadersText = document.getElementById('has-headers-text');
const headerOptionsGroup = document.getElementById('header-options-group');
const headerBehaviorSelect = document.getElementById('header-behavior');

const processBtn = document.getElementById('process-btn');
const resetBtn = document.getElementById('reset-btn');
const startOverBtn = document.getElementById('start-over-btn');
const finalFileCount = document.getElementById('final-file-count');

// Events
dropZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

dropZone.addEventListener('dragover', () => dropZone.classList.add('hover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));
dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('hover');
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

numSplitsInput.addEventListener('input', calculateRowsPerFile);

hasHeadersCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        hasHeadersText.textContent = "Ja, første rad er overskrift";
        headerOptionsGroup.style.display = "flex";
    } else {
        hasHeadersText.textContent = "Nei, berre reine data";
        headerOptionsGroup.style.display = "none";
    }
});

processBtn.addEventListener('click', processAndDownload);
resetBtn.addEventListener('click', resetApp);
startOverBtn.addEventListener('click', resetApp);

// Logic
function handleFile(file) {
    if (!file) return;

    // Set filename state
    const parts = file.name.split('.');
    originalExtension = parts.pop().toLowerCase();
    originalFileName = parts.join('.');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Vi tek berre det første arket
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Konverter til array of arrays for å behalde rekkefølgja eksakt
            allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            
            if (allRows.length === 0) {
                alert("Fila er tom.");
                return;
            }

            // Gøym upload, vis config
            uploadSection.classList.remove('active');
            uploadSection.classList.add('hidden');
            
            configSection.classList.remove('hidden');
            configSection.classList.add('active');

            totalRowsEl.textContent = allRows.length;
            calculateRowsPerFile();
            
        } catch (err) {
            console.error(err);
            alert("Feil ved lesing av fil: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function calculateRowsPerFile() {
    if (allRows.length === 0) return;
    
    const numSplits = parseInt(numSplitsInput.value) || 2;
    let dataRowCount = allRows.length;
    
    if (hasHeadersCheckbox.checked && allRows.length > 0) {
        dataRowCount -= 1; // Trekk frå header
    }

    const approxRows = Math.ceil(dataRowCount / numSplits);
    rowsPerFileEl.textContent = approxRows;
}

async function processAndDownload() {
    processBtn.disabled = true;
    processBtn.innerHTML = '<i data-lucide="loader-2" class="rotate-icon"></i> Pakkar ZIP...';
    lucide.createIcons();

    try {
        const numSplits = parseInt(numSplitsInput.value) || 2;
        const hasHeaders = hasHeadersCheckbox.checked;
        const headerBehavior = headerBehaviorSelect.value;

        let headerRow = null;
        let dataRows = allRows;

        if (hasHeaders && allRows.length > 0) {
            headerRow = allRows[0];
            dataRows = allRows.slice(1);
        }

        const chunkSize = Math.ceil(dataRows.length / numSplits);
        
        // Initialiser JSZip
        const zip = new JSZip();

        for (let i = 0; i < numSplits; i++) {
            const start = i * chunkSize;
            const end = start + chunkSize;
            let chunk = dataRows.slice(start, end);
            
            if (chunk.length === 0) continue; // Unngå tomme filer på slutten viss reknestykket er skeivt

            // Kva gjer me med overskrifta?
            if (hasHeaders && headerRow) {
                if (headerBehavior === 'always') {
                    chunk.unshift(headerRow);
                } else if (headerBehavior === 'first' && i === 0) {
                    chunk.unshift(headerRow);
                }
                // 'never' = gjer ingenting
            }

            // Bygg Excel-fil
            const newWs = XLSX.utils.aoa_to_sheet(chunk);
            const newWb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWb, newWs, "Data");
            
            // Generer binær buffer
            const excelBuffer = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
            
            // Legg til i ZIP
            const fileNum = (i + 1).toString().padStart(2, '0');
            zip.file(`${originalFileName}_del${fileNum}.xlsx`, excelBuffer);
        }

        // Generer ferdig ZIP og last ned
        const zipContent = await zip.generateAsync({ type: "blob" });
        
        const url = URL.createObjectURL(zipContent);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${originalFileName}_splitta.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Vis suksess
        configSection.classList.remove('active');
        configSection.classList.add('hidden');
        
        successSection.classList.remove('hidden');
        successSection.classList.add('active');
        
        finalFileCount.textContent = numSplits;

    } catch (err) {
        alert("Ein feil oppstod: " + err.message);
    } finally {
        processBtn.disabled = false;
        processBtn.innerHTML = '<i data-lucide="scissors"></i> Splitt og pakk ZIP';
        lucide.createIcons();
    }
}

function resetApp() {
    allRows = [];
    fileInput.value = "";
    
    successSection.classList.remove('active');
    successSection.classList.add('hidden');
    configSection.classList.remove('active');
    configSection.classList.add('hidden');
    
    uploadSection.classList.remove('hidden');
    uploadSection.classList.add('active');
    
    lucide.createIcons();
}
