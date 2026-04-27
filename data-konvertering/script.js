// State management
let rawData = null;
let headers = [];
let selectedHeaders = new Set();
let fileName = '';
let rowCount = 0;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const columnSection = document.getElementById('column-section');
const successSection = document.getElementById('success-section');
const columnGrid = document.getElementById('column-grid');
const convertBtn = document.getElementById('convert-btn');
const backBtn = document.getElementById('back-btn');
const resetBtn = document.getElementById('reset-btn');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const outputFormatSelect = document.getElementById('output-format');
const rowCountBadge = document.getElementById('row-count');

// Initialize Lucide icons
lucide.createIcons();

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

dropZone.addEventListener('dragover', () => dropZone.classList.add('hover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
convertBtn.addEventListener('click', handleConvert);
backBtn.addEventListener('click', () => showSection(uploadSection));
resetBtn.addEventListener('click', resetApp);
selectAllBtn.addEventListener('click', () => toggleAll(true));
deselectAllBtn.addEventListener('click', () => toggleAll(false));

// Handlers
function handleDrop(e) {
    dropZone.classList.remove('hover');
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file) processFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

function processFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    fileName = file.name.split('.').slice(0, -1).join('.');
    
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = e.target.result;
        
        try {
            if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
                parseCSV(data);
            } else if (extension === 'json') {
                parseJSON(data);
            } else if (['xlsx', 'xls', 'ods'].includes(extension)) {
                parseExcel(data);
            } else {
                alert('Filformatet er ikkje støtta ennå.');
            }
        } catch (err) {
            console.error(err);
            alert('Feil ved lesing av fil: ' + err.message);
        }
    };

    if (['xlsx', 'xls', 'ods'].includes(extension)) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

// Parsing Logic
function parseCSV(content) {
    Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            finalizeParsing(results.data, results.meta.fields);
        }
    });
}

function parseJSON(content) {
    let json = JSON.parse(content);
    // If it's an object with a data property that is an array, use that
    if (!Array.isArray(json)) {
        const potentialArray = Object.values(json).find(val => Array.isArray(val));
        if (potentialArray) json = potentialArray;
        else json = [json]; // Convert single object to array
    }
    
    const keys = new Set();
    json.forEach(item => {
        Object.keys(item).forEach(key => keys.add(key));
    });
    
    finalizeParsing(json, Array.from(keys));
}

function parseExcel(content) {
    const workbook = XLSX.read(content, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);
    
    const keys = new Set();
    if (json.length > 0) {
        Object.keys(json[0]).forEach(key => keys.add(key));
    }
    
    finalizeParsing(json, Array.from(keys));
}

function finalizeParsing(data, foundHeaders) {
    rawData = data;
    headers = foundHeaders;
    rowCount = data.length;
    rowCountBadge.textContent = rowCount;
    renderColumns();
    renderPreview();
    showSection(columnSection);
}

function renderColumns() {
    columnGrid.innerHTML = '';
    selectedHeaders.clear();
    
    headers.forEach(header => {
        selectedHeaders.add(header);
        const item = document.createElement('div');
        item.className = 'column-item selected';
        item.dataset.header = header;
        
        item.innerHTML = `
            <div class="column-checkbox">
                <i data-lucide="check"></i>
            </div>
            <span class="column-name" title="${header}">${header}</span>
        `;
        
        item.addEventListener('click', () => toggleHeader(header, item));
        columnGrid.appendChild(item);
    });
    
    lucide.createIcons();
}

function toggleHeader(header, element) {
    if (selectedHeaders.has(header)) {
        selectedHeaders.delete(header);
        element.classList.remove('selected');
    } else {
        selectedHeaders.add(header);
        element.classList.add('selected');
    }
    renderPreview();
}

function toggleAll(select) {
    const items = columnGrid.querySelectorAll('.column-item');
    items.forEach(item => {
        const header = item.dataset.header;
        if (select) {
            selectedHeaders.add(header);
            item.classList.add('selected');
        } else {
            selectedHeaders.delete(header);
            item.classList.remove('selected');
        }
    });
    renderPreview();
}

// Preview Logic
function renderPreview() {
    const previewTable = document.getElementById('preview-table');
    const selectedArray = Array.from(selectedHeaders);
    
    if (selectedArray.length === 0) {
        previewTable.innerHTML = '<tr><td style="padding: 2rem; text-align: center; color: var(--text-secondary);">Velg minst éi kolonne for å sjå ei forhandsvisning.</td></tr>';
        return;
    }

    let html = '<thead><tr>';
    selectedArray.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    const sample = rawData.slice(0, 5);
    sample.forEach(row => {
        html += '<tr>';
        selectedArray.forEach(header => {
            const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
            html += `<td>${val}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody>';
    previewTable.innerHTML = html;
}

// Convert & Download Logic
function handleConvert() {
    if (selectedHeaders.size === 0) {
        alert('Vennligst velg minst éi kolonne.');
        return;
    }

    const outputType = outputFormatSelect.value;
    const selectedArray = Array.from(selectedHeaders);
    const filteredData = rawData.map(row => {
        const newRow = {};
        selectedArray.forEach(header => {
            newRow[header] = row[header] !== undefined ? row[header] : null;
        });
        return newRow;
    });

    try {
        if (outputType === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(filteredData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data");
            XLSX.writeFile(wb, `${fileName}_konvertert.xlsx`);
        } else if (outputType === 'csv') {
            const csv = Papa.unparse(filteredData);
            downloadFile(csv, `${fileName}_konvertert.csv`, 'text/csv');
        } else if (outputType === 'json') {
            const json = JSON.stringify(filteredData, null, 2);
            downloadFile(json, `${fileName}_konvertert.json`, 'application/json');
        } else if (outputType === 'html') {
            const html = generateHTMLTable(filteredData);
            downloadFile(html, `${fileName}_konvertert.html`, 'text/html');
        }
        
        showSection(successSection);
    } catch (err) {
        console.error(err);
        alert('Feil ved konvertering: ' + err.message);
    }
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function generateHTMLTable(data) {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body { font-family: sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f4f4f4; }
        tr:nth-child(even) { background-color: #fafafa; }
    </style></head><body><h2>Eksportert Data</h2><table><thead><tr>`;
    
    // Header
    Object.keys(data[0]).forEach(key => {
        html += `<th>${key}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    // Rows
    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => {
            html += `<td>${val === null ? '' : val}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `</tbody></table></body></html>`;
    return html;
}

function showSection(section) {
    [uploadSection, columnSection, successSection].forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    section.classList.remove('hidden');
    section.classList.add('active');
    
    // Trigger icons again just in case
    lucide.createIcons();
}

function resetApp() {
    rawData = null;
    headers = [];
    selectedHeaders.clear();
    fileInput.value = '';
    showSection(uploadSection);
}
