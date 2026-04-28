// Initialiser Lucide-ikon
lucide.createIcons();

// State
let excelFile = null;
let csvFile = null;
let emailsToRemove = new Set();
let csvDataRaw = "";

let finalOutputCsv = "";
let detectedDelimiter = ";";

// DOM Element
const dropExcel = document.getElementById('drop-excel');
const excelInput = document.getElementById('excel-input');
const excelStatus = document.getElementById('excel-status');

const dropCsv = document.getElementById('drop-csv');
const csvInput = document.getElementById('csv-input');
const csvStatus = document.getElementById('csv-status');

const processBtn = document.getElementById('process-btn');
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');

const statRemoved = document.getElementById('stat-removed');
const statKept = document.getElementById('stat-kept');
const examplesList = document.getElementById('examples-list');
const examplesNote = document.getElementById('examples-note');
const resetBtn = document.getElementById('reset-btn');
const downloadBtn = document.getElementById('download-btn');

// Events
dropExcel.addEventListener('click', () => excelInput.click());
dropCsv.addEventListener('click', () => csvInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropExcel.addEventListener(eventName, preventDefaults, false);
    dropCsv.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

dropExcel.addEventListener('dragover', () => dropExcel.classList.add('hover'));
dropExcel.addEventListener('dragleave', () => dropExcel.classList.remove('hover'));
dropExcel.addEventListener('drop', (e) => {
    dropExcel.classList.remove('hover');
    handleFile(e.dataTransfer.files[0], 'excel');
});

dropCsv.addEventListener('dragover', () => dropCsv.classList.add('hover'));
dropCsv.addEventListener('dragleave', () => dropCsv.classList.remove('hover'));
dropCsv.addEventListener('drop', (e) => {
    dropCsv.classList.remove('hover');
    handleFile(e.dataTransfer.files[0], 'csv');
});

excelInput.addEventListener('change', (e) => handleFile(e.target.files[0], 'excel'));
csvInput.addEventListener('change', (e) => handleFile(e.target.files[0], 'csv'));

processBtn.addEventListener('click', runProcess);
resetBtn.addEventListener('click', resetApp);
downloadBtn.addEventListener('click', downloadCsv);

function handleFile(file, type) {
    if (!file) return;
    
    if (type === 'excel') {
        excelFile = file;
        excelStatus.textContent = file.name;
        dropExcel.classList.add('has-file');
    } else if (type === 'csv') {
        csvFile = file;
        csvStatus.textContent = file.name;
        dropCsv.classList.add('has-file');
        
        // Last CSV-data inn i minnet
        const reader = new FileReader();
        reader.onload = (e) => {
            csvDataRaw = e.target.result;
            checkReady();
        };
        reader.readAsText(file);
    }
    checkReady();
}

function checkReady() {
    if (excelFile && csvFile && csvDataRaw) {
        processBtn.disabled = false;
    } else {
        processBtn.disabled = true;
    }
}

// Regex for å plukke ut e-postadresser
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

async function runProcess() {
    processBtn.disabled = true;
    processBtn.innerHTML = '<i data-lucide="loader-2" class="rotate-icon"></i> Kvernar data...';
    lucide.createIcons();

    try {
        // Steg 1: Hent ut e-postar frå Excel
        await extractEmailsFromExcel();

        // Steg 2: Sjekk CSV opp mot e-postane
        processCsvData();

    } catch (err) {
        alert("Ein feil oppstod: " + err.message);
        processBtn.disabled = false;
        processBtn.innerHTML = '<i data-lucide="play"></i> Vask listene';
        lucide.createIcons();
    }
}

function extractEmailsFromExcel() {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                emailsToRemove.clear();

                // Gå gjennom alle ark i excel-fila
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
                    
                    json.forEach(row => {
                        row.forEach(cell => {
                            if (typeof cell === 'string') {
                                const matches = cell.match(emailRegex);
                                if (matches) {
                                    matches.forEach(m => emailsToRemove.add(m.toLowerCase()));
                                }
                            }
                        });
                    });
                });
                
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(excelFile);
    });
}

function processCsvData() {
    Papa.parse(csvDataRaw, {
        header: false, // Parse som arrays slik at me ikkje er avhengige av spesifikke overskrifter
        skipEmptyLines: true,
        complete: function(results) {
            // Ta vare på separatoren som vart brukt i originalfila (t.d. semikolon)
            if (results.meta && results.meta.delimiter) {
                detectedDelimiter = results.meta.delimiter;
            }
            
            const rows = results.data;
            const outputRows = [];
            const foundExamples = [];
            let removedCount = 0;
            let keptCount = 0;

            // Enkel logikk: Viss nokon av cellene i rada inneheld ein e-post frå Excel-fila, slett rada.
            rows.forEach(row => {
                let shouldRemove = false;
                let removedEmail = "";

                for (let i = 0; i < row.length; i++) {
                    const cellStr = String(row[i]).toLowerCase();
                    const matches = cellStr.match(emailRegex);
                    if (matches) {
                        for (let email of matches) {
                            if (emailsToRemove.has(email)) {
                                shouldRemove = true;
                                removedEmail = email;
                                break;
                            }
                        }
                    }
                    if (shouldRemove) break;
                }

                if (shouldRemove) {
                    removedCount++;
                    if (foundExamples.length < 10) {
                        foundExamples.push(removedEmail);
                    }
                } else {
                    keptCount++;
                    outputRows.push(row);
                }
            });

            // Bygg ny CSV med same separator
            finalOutputCsv = Papa.unparse(outputRows, {
                delimiter: detectedDelimiter
            });

            // Oppdater UI
            statRemoved.textContent = removedCount;
            statKept.textContent = keptCount;

            examplesList.innerHTML = "";
            if (removedCount === 0) {
                examplesList.innerHTML = "<li>Fann ingen treff</li>";
                examplesNote.textContent = "";
            } else {
                foundExamples.forEach(email => {
                    const li = document.createElement("li");
                    li.textContent = email;
                    examplesList.appendChild(li);
                });
                if (removedCount > 10) {
                    examplesNote.textContent = `... og ${removedCount - 10} andre e-postadresser.`;
                } else {
                    examplesNote.textContent = "";
                }
            }

            // Vis resultat-seksjonen
            uploadSection.classList.remove('active');
            uploadSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
            resultSection.classList.add('active');
        }
    });
}

function downloadCsv() {
    if (!finalOutputCsv) return;
    
    // Legg til BOM for at Excel skal takle ÆØÅ rett om separator er semikolon
    const BOM = "\uFEFF";
    const csvContent = detectedDelimiter === ';' ? BOM + finalOutputCsv : finalOutputCsv;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const originalName = csvFile ? csvFile.name.replace(/\.[^/.]+$/, "") : "liste";
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${originalName}_vaska.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetApp() {
    excelFile = null;
    csvFile = null;
    emailsToRemove.clear();
    csvDataRaw = "";
    finalOutputCsv = "";

    excelInput.value = "";
    csvInput.value = "";
    
    excelStatus.textContent = "Ingenting vald";
    csvStatus.textContent = "Ingenting vald";
    
    dropExcel.classList.remove('has-file');
    dropCsv.classList.remove('has-file');
    
    processBtn.disabled = true;
    processBtn.innerHTML = '<i data-lucide="play"></i> Vask listene';
    
    resultSection.classList.remove('active');
    resultSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    uploadSection.classList.add('active');
    
    lucide.createIcons();
}
