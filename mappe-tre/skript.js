// State Management
let projectTree = null;
let fileCountVal = 0;
let dirCountVal = 0;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const summarySection = document.getElementById('summary-section');
const resultSection = document.getElementById('result-section');
const fileCount = document.getElementById('file-count');
const dirCount = document.getElementById('dir-count');
const statusText = document.getElementById('status-text');
const outputText = document.getElementById('output-text');
const treeDisplay = document.getElementById('tree-display');
const buildBtn = document.getElementById('build-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');

// Initialize Lucide
lucide.createIcons();

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropZone.addEventListener(e, (ev) => { ev.preventDefault(); ev.stopPropagation(); }));
dropZone.addEventListener('dragover', () => dropZone.classList.add('hover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);

buildBtn.addEventListener('click', generateTreeString);
copyBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    copyToClipboard(outputText.value);
});

downloadBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    downloadFile(outputText.value);
});

clearBtn.addEventListener('click', resetApp);

// Functions
async function handleDrop(e) {
    dropZone.classList.remove('hover');
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;
    
    resetApp();
    summarySection.classList.remove('hidden');
    statusText.textContent = "Analyserer mappestruktur...";
    
    // We only take the first dropped item as the root for a tree
    const rootEntry = items[0].webkitGetAsEntry();
    if (rootEntry) {
        projectTree = rootEntry;
        const stats = { files: 0, dirs: 0 };
        await scanStats(rootEntry, stats);
        fileCount.textContent = stats.files;
        dirCount.textContent = stats.dirs;
        statusText.textContent = "Struktur ferdig analysert. Klar til å teikne treet.";
        lucide.createIcons();
    }
}

async function handleFileSelect(e) {
    alert("Dette verktøyet fungerer best med mapper. Vennligst drag og dropp ei hel mappe.");
}

async function scanStats(entry, stats) {
    if (isIgnored(entry.name)) return;
    
    if (entry.isFile) {
        stats.files++;
    } else if (entry.isDirectory) {
        stats.dirs++;
        const reader = entry.createReader();
        const entries = await readEntries(reader);
        for (const child of entries) {
            await scanStats(child, stats);
        }
    }
}

function isIgnored(name) {
    const ignoreList = [
        'node_modules', '.git', 'venv', '.venv', '__pycache__', 
        '.cache', '.next', 'dist', 'build', '.pytest_cache', 
        '.DS_Store', 'package-lock.json', 'yarn.lock', '.env'
    ];
    return ignoreList.includes(name);
}

function readEntries(reader) {
    return new Promise(resolve => {
        let results = [];
        const read = () => {
            reader.readEntries(entries => {
                if (entries.length > 0) {
                    results = results.concat(entries);
                    read();
                } else {
                    resolve(results);
                }
            });
        };
        read();
    });
}

async function generateTreeString() {
    if (!projectTree) return;
    
    statusText.textContent = "Teiknar trev-visning...";
    const treeResult = await buildTree(projectTree, "");
    
    const finalResult = "Prosjekt-struktur (Tree):\n\n" + treeResult;
    outputText.value = finalResult;
    treeDisplay.textContent = finalResult;
    
    resultSection.classList.remove('hidden');
    statusText.textContent = "Treet er ferdig!";
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

async function buildTree(entry, indent, isLast = true) {
    if (isIgnored(entry.name)) return "";

    let result = indent + (isLast ? "└── " : "├── ") + entry.name + (entry.isDirectory ? "/" : "") + "\n";
    
    if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = (await readEntries(reader)).filter(e => !isIgnored(e.name));
        
        for (let i = 0; i < entries.length; i++) {
            const childIsLast = i === entries.length - 1;
            const newIndent = indent + (isLast ? "    " : "│   ");
            result += await buildTree(entries[i], newIndent, childIsLast);
        }
    }
    
    return result;
}

function downloadFile(text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prosjekt_tre_for_ai.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-lucide="check"></i> Kopiert tre-struktur!';
        lucide.createIcons();
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            lucide.createIcons();
        }, 2000);
    });
}

function resetApp() {
    projectTree = null;
    document.getElementById('file-count').textContent = '0';
    document.getElementById('dir-count').textContent = '0';
    outputText.value = '';
    treeDisplay.textContent = '';
    summarySection.classList.add('hidden');
    resultSection.classList.add('hidden');
}
