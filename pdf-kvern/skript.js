// State Management
let mergeFiles = [];
let splitFile = null;
let selectedPages = new Set();

// DOM Elements
const modeBtns = document.querySelectorAll('.mode-btn');
const views = document.querySelectorAll('.view-content');

// Merge Elements
const dropZoneMerge = document.getElementById('drop-zone-merge');
const fileInputMerge = document.getElementById('file-input-merge');
const fileListArea = document.getElementById('file-list-area');
const fileList = document.getElementById('file-list');
const fileTotalCount = document.getElementById('file-total-count');
const runMergeBtn = document.getElementById('run-merge');
const clearMergeBtn = document.getElementById('clear-merge');

// Split Elements
const dropZoneSplit = document.getElementById('drop-zone-split');
const fileInputSplit = document.getElementById('file-input-split');
const splitUploadArea = document.getElementById('split-upload-area');
const splitConfigArea = document.getElementById('split-config-area');
const thumbGrid = document.getElementById('thumb-grid');
const splitFilename = document.getElementById('split-filename');
const splitPageCount = document.getElementById('split-page-count');
const pagesInput = document.getElementById('pages-input');
const runSplitBtn = document.getElementById('run-split');
const resetSplitBtn = document.getElementById('reset-split');

// Initial setup
lucide.createIcons();

// Tab Switching
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        views.forEach(v => {
            v.classList.remove('active');
            if (v.id === `view-${mode}`) v.classList.add('active');
        });
        lucide.createIcons();
    });
});

// --- MERGE LOGIC ---
dropZoneMerge.addEventListener('click', () => fileInputMerge.click());
fileInputMerge.addEventListener('change', (e) => handleMergeFiles(e.target.files));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropZoneMerge.addEventListener(e, (ev) => { ev.preventDefault(); ev.stopPropagation(); }));
dropZoneMerge.addEventListener('dragover', () => dropZoneMerge.classList.add('hover'));
dropZoneMerge.addEventListener('dragleave', () => dropZoneMerge.classList.remove('hover'));
dropZoneMerge.addEventListener('drop', (e) => {
    dropZoneMerge.classList.remove('hover');
    handleMergeFiles(e.dataTransfer.files);
});

function handleMergeFiles(files) {
    for (const file of files) {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            mergeFiles.push(file);
        }
    }
    renderMergeList();
}

function renderMergeList() {
    if (mergeFiles.length > 0) {
        fileListArea.classList.remove('hidden');
        fileTotalCount.textContent = `${mergeFiles.length} filer valgt`;
        fileList.innerHTML = mergeFiles.map((file, index) => `
            <li>
                <div class="file-info-row" style="display:flex; align-items:center;">
                    <i data-lucide="file" style="width:16px; margin-right:8px;"></i>
                    <span>${file.name}</span>
                </div>
                <button class="btn-remove" onclick="removeMergeFile(${index})">
                    <i data-lucide="trash-2" style="width:18px;"></i>
                </button>
            </li>
        `).join('');
        lucide.createIcons();
    } else {
        fileListArea.classList.add('hidden');
    }
}

window.removeMergeFile = (index) => {
    mergeFiles.splice(index, 1);
    renderMergeList();
};

clearMergeBtn.addEventListener('click', () => {
    mergeFiles = [];
    renderMergeList();
});

runMergeBtn.addEventListener('click', async () => {
    if (mergeFiles.length < 2) {
        alert("Vennligst velg minst to PDF-filer for å slå dei saman.");
        return;
    }

    runMergeBtn.disabled = true;
    runMergeBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Kverner...';
    lucide.createIcons();

    try {
        const mergedPdf = await PDFLib.PDFDocument.create();
        for (const file of mergeFiles) {
            const bytes = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(bytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const bytes = await mergedPdf.save();
        downloadBlob(bytes, 'sammenflettet.pdf');
    } catch (err) {
        alert("Feil: " + err.message);
    } finally {
        runMergeBtn.disabled = false;
        runMergeBtn.innerHTML = '<i data-lucide="combine"></i> Lagra ny PDF';
    }
});

// --- SPLIT & PREVIEW LOGIC ---
dropZoneSplit.addEventListener('click', () => fileInputSplit.click());
fileInputSplit.addEventListener('change', (e) => handleSplitFile(e.target.files[0]));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropZoneSplit.addEventListener(e, (ev) => { ev.preventDefault(); ev.stopPropagation(); }));
dropZoneSplit.addEventListener('dragover', () => dropZoneSplit.classList.add('hover'));
dropZoneSplit.addEventListener('dragleave', () => dropZoneSplit.classList.remove('hover'));
dropZoneSplit.addEventListener('drop', (e) => {
    dropZoneSplit.classList.remove('hover');
    handleSplitFile(e.dataTransfer.files[0]);
});

async function handleSplitFile(file) {
    if (!file || !file.name.endsWith('.pdf')) return;
    
    splitFile = file;
    selectedPages.clear();
    pagesInput.value = '';
    splitFilename.textContent = file.name;
    
    splitUploadArea.classList.add('hidden');
    splitConfigArea.classList.remove('hidden');
    thumbGrid.innerHTML = '<div class="loading-thumbs">Tegner sider...</div>';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        splitPageCount.textContent = `${pdf.numPages} sider funne`;
        
        thumbGrid.innerHTML = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            renderThumbnail(pdf, i);
        }
    } catch (err) {
        alert("Feil: " + err.message);
    }
}

async function renderThumbnail(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });
    
    const div = document.createElement('div');
    div.className = 'thumb-item';
    div.dataset.page = pageNum;
    div.innerHTML = `<canvas></canvas><div class="thumb-num">${pageNum}</div>`;
    
    const canvas = div.querySelector('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    div.addEventListener('click', () => {
        if (selectedPages.has(pageNum)) {
            selectedPages.delete(pageNum);
            div.classList.remove('selected');
        } else {
            selectedPages.add(pageNum);
            div.classList.add('selected');
        }
        updatePageInput();
    });
    thumbGrid.appendChild(div);
}

function updatePageInput() {
    const sorted = [...selectedPages].sort((a,b) => a-b);
    if (sorted.length === 0) { pagesInput.value = ''; return; }
    
    let result = [];
    let start = sorted[0];
    let end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) end = sorted[i];
        else {
            result.push(start === end ? start : `${start}-${end}`);
            start = end = sorted[i];
        }
    }
    result.push(start === end ? start : `${start}-${end}`);
    pagesInput.value = result.join(', ');
}

pagesInput.addEventListener('input', () => {
    const total = parseInt(splitPageCount.textContent);
    const indices = parsePageRanges(pagesInput.value, total);
    selectedPages.clear();
    indices.forEach(i => selectedPages.add(i + 1));
    document.querySelectorAll('.thumb-item').forEach(thumb => {
        const p = parseInt(thumb.dataset.page);
        if (selectedPages.has(p)) thumb.classList.add('selected');
        else thumb.classList.remove('selected');
    });
});

runSplitBtn.addEventListener('click', async () => {
    if (!splitFile || selectedPages.size === 0) {
        alert("Finn sidene du vil ha ved å klikke på dei!");
        return;
    }

    runSplitBtn.disabled = true;
    runSplitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Kverner...';

    try {
        const bytes = await splitFile.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(bytes);
        const newPdf = await PDFLib.PDFDocument.create();
        const indices = [...selectedPages].sort((a,b) => a-b).map(p => p-1);
        const copiedPages = await newPdf.copyPages(pdf, indices);
        copiedPages.forEach(p => newPdf.addPage(p));
        const res = await newPdf.save();
        downloadBlob(res, 'kverna_utdrag.pdf');
    } catch (err) {
        alert("Feil: " + err.message);
    } finally {
        runSplitBtn.disabled = false;
        runSplitBtn.innerHTML = '<i data-lucide="save"></i> Lagra ny utgåve';
    }
});

resetSplitBtn.addEventListener('click', () => {
    splitConfigArea.classList.add('hidden');
    splitUploadArea.classList.remove('hidden');
    selectedPages.clear();
    thumbGrid.innerHTML = '';
});

function parsePageRanges(input, total) {
    const indices = [];
    const parts = input.split(/[\s,]+/);
    parts.forEach(part => {
        if (part.includes('-')) {
            const [s, e] = part.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(s) && !isNaN(e)) {
                for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
                    if (i >= 1 && i <= total) indices.push(i - 1);
                }
            }
        } else {
            const n = parseInt(part.trim());
            if (!isNaN(n) && n >= 1 && n <= total) indices.push(n - 1);
        }
    });
    return [...new Set(indices)].sort((a,b) => a - b);
}

function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
