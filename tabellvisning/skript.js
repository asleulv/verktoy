// State Management
let allData = [];
let filteredData = [];
let headers = [];
let currentPage = 1;
const rowsPerPage = 50;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const viewerSection = document.getElementById('viewer-section');
const tableHeader = document.getElementById('table-header');
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const rowCountBadge = document.getElementById('row-count');
const pageInfo = document.getElementById('page-info');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const resetBtn = document.getElementById('reset-btn');
const noResults = document.getElementById('no-results');

// Initial setup
lucide.createIcons();

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropZone.addEventListener(e, (ev) => { ev.preventDefault(); ev.stopPropagation(); }));
dropZone.addEventListener('dragover', () => dropZone.classList.add('hover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
searchInput.addEventListener('input', handleSearch);
prevPageBtn.addEventListener('click', () => changePage(-1));
nextPageBtn.addEventListener('click', () => changePage(1));
resetBtn.addEventListener('click', resetApp);

const statusMsg = document.getElementById('status-msg');

// Functions
function handleDrop(e) {
    dropZone.classList.remove('hover');
    processFile(e.dataTransfer.files[0]);
}

function handleFileSelect(e) {
    processFile(e.target.files[0]);
}

function processFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    
    // Threshold for "Large" is 20 MB for a single read
    const isLarge = file.size > 20 * 1024 * 1024;
    
    if (isLarge) {
        statusMsg.textContent = `Obs! Stor fil (${(file.size / (1024 * 1024)).toFixed(0)} MB). Viser berre starten.`;
        statusMsg.classList.remove('hidden');
        
        // Slice the first 5MB for a representative sample
        const blob = file.slice(0, 5 * 1024 * 1024);
        readAsPreview(blob, ext);
    } else {
        statusMsg.classList.add('hidden');
        readFull(file, ext);
    }
}

function readAsPreview(blob, ext) {
    const reader = new FileReader();
    reader.onload = (e) => {
        let content = e.target.result;
        // For CSV/JSON, we need to handle the potentially cut-off last line
        if (ext !== 'xlsx' && ext !== 'xls') {
            const lastNewline = content.lastIndexOf('\n');
            if (lastNewline > 0) content = content.substring(0, lastNewline);
        }
        handleContent(content, ext);
    };
    
    if (ext === 'xlsx' || ext === 'xls') {
        // Excel is binary, previewing a slice might break the format.
        // We'll warn the user we need to read the whole thing (or a bit)
        alert('Excel-filer må lesast i heilskap. Viss fila er over 100MB kan det ta litt tid.');
        readFull(blob, ext);
    } else {
        reader.readAsText(blob);
    }
}

function readFull(file, ext) {
    const reader = new FileReader();
    reader.onload = (e) => handleContent(e.target.result, ext);
    
    if (['xlsx', 'xls', 'ods'].includes(ext)) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function handleContent(content, ext) {
    try {
        // If content is binary (ArrayBuffer), it's definitely not JSON
        const isString = typeof content === 'string';
        const isJson = isString && (content.trim().startsWith('{') || content.trim().startsWith('['));
        
        if (isJson) {
            parseJSON(content);
        } else if (['csv', 'tsv', 'txt'].includes(ext)) {
            parseCSV(content);
        } else if (['xlsx', 'xls', 'ods'].includes(ext)) {
            parseExcel(content);
        } else if (isString) {
            // Fallback to CSV for strings
            parseCSV(content);
        } else {
            throw new Error('Ukjent filformat eller binærfil utanfor Excel-støtte.');
        }
    } catch (err) {
        console.error(err);
        alert('Feil ved lesing: ' + err.message);
    }
} 

function parseCSV(content) {
    Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => finalizeData(results.data, results.meta.fields)
    });
}

function parseJSON(content) {
    let json = JSON.parse(content);
    
    if (!Array.isArray(json)) {
        // If it's a single object, flatten it into key-value rows
        json = flattenObjectToRows(json);
    }
    
    // Collect all headers (properties) present in the objects
    const keys = new Set();
    json.forEach(item => {
        if (item && typeof item === 'object') {
            Object.keys(item).forEach(k => keys.add(k));
        }
    });
    
    finalizeData(json, Array.from(keys));
}

function flattenObjectToRows(obj, prefix = '') {
    let rows = [];
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            rows = rows.concat(flattenObjectToRows(value, fullKey));
        } else {
            rows.push({
                'Eigenskap': fullKey,
                'Verdi': (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value
            });
        }
    }
    return rows;
}

function parseExcel(content) {
    const wb = XLSX.read(content, { type: 'array' });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(firstSheet);
    const keys = json.length > 0 ? Object.keys(json[0]) : [];
    finalizeData(json, keys);
}

function finalizeData(data, foundHeaders) {
    allData = data;
    filteredData = [...data];
    headers = foundHeaders || [];
    currentPage = 1;
    
    if (headers.length === 0 && data.length > 0) {
        headers = Object.keys(data[0]);
    }

    renderHeaders();
    updateTable();
    showSection(viewerSection);
}

function renderHeaders() {
    tableHeader.innerHTML = headers.map(h => `<th>${h}</th>`).join('');
}

function updateTable() {
    rowCountBadge.textContent = filteredData.length;
    
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    pageInfo.textContent = `Side ${currentPage} av ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tableBody.innerHTML = '';
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        tableBody.innerHTML = pageData.map(row => {
            return `<tr>${headers.map(h => {
                const val = (row[h] !== undefined && row[h] !== null) ? row[h] : '';
                return `<td>${val}</td>`;
            }).join('')}</tr>`;
        }).join('');
    }
}

function handleSearch() {
    const query = searchInput.value.toLowerCase();
    if (!query) {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(row => {
            return headers.some(h => String(row[h]).toLowerCase().includes(query));
        });
    }
    currentPage = 1;
    updateTable();
}

function changePage(delta) {
    currentPage += delta;
    updateTable();
    document.getElementById('table-scroll').scrollTop = 0;
}

function showSection(section) {
    [uploadSection, viewerSection].forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    section.classList.remove('hidden');
    section.classList.add('active');
    lucide.createIcons();
}

function resetApp() {
    allData = [];
    filteredData = [];
    headers = [];
    searchInput.value = '';
    fileInput.value = '';
    showSection(uploadSection);
}
