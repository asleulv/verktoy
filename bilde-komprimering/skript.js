// State management
let originalFile = null;
let originalImage = new Image();
let originalSize = 0;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const processSection = document.getElementById('process-section');
const qualityRange = document.getElementById('quality-range');
const qualityValDisplay = document.getElementById('quality-val');
const scaleRange = document.getElementById('scale-range');
const scaleValDisplay = document.getElementById('scale-val');
const outputFormatSelect = document.getElementById('output-format');
const originalPreview = document.getElementById('original-preview');
const compressedPreview = document.getElementById('compressed-preview');
const originalSizeDisplay = document.getElementById('original-size');
const compressedSizeDisplay = document.getElementById('compressed-size');
const sizeReductionBadge = document.getElementById('size-reduction');
const downloadBtn = document.getElementById('download-btn');
const backBtn = document.getElementById('back-btn');

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
qualityRange.addEventListener('input', updateCompression);
scaleRange.addEventListener('input', updateCompression);
outputFormatSelect.addEventListener('change', updateCompression);
backBtn.addEventListener('click', resetApp);

// Handlers
function handleDrop(e) {
    dropZone.classList.remove('hover');
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file && file.type.startsWith('image/')) processImage(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processImage(file);
}

function processImage(file) {
    originalFile = file;
    originalSize = file.size;
    originalSizeDisplay.textContent = formatBytes(originalSize);
    
    // Auto-select best format
    if (file.type === 'image/png') {
        outputFormatSelect.value = 'image/png';
    } else if (file.type === 'image/webp') {
        outputFormatSelect.value = 'image/webp';
    } else {
        outputFormatSelect.value = 'image/jpeg';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        originalPreview.src = e.target.result;
        originalImage.src = e.target.result;
        originalImage.onload = () => {
            updateCompression();
            showSection(processSection);
        };
    };
    reader.readAsDataURL(file);
}

function updateCompression() {
    const quality = qualityRange.value / 100;
    const scale = scaleRange.value / 100;
    const format = outputFormatSelect.value;
    
    // PNG is lossless, so the quality slider has no effect.
    if (format === 'image/png') {
        qualityRange.disabled = true;
        qualityRange.parentElement.style.opacity = '0.5';
    } else {
        qualityRange.disabled = false;
        qualityRange.parentElement.style.opacity = '1';
    }

    qualityValDisplay.textContent = qualityRange.value;
    scaleValDisplay.textContent = scaleRange.value;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, originalImage.width * scale);
    canvas.height = Math.max(1, originalImage.height * scale);
    
    const ctx = canvas.getContext('2d');
    
    if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        compressedPreview.src = url;
        
        const compressedSize = blob.size;
        compressedSizeDisplay.textContent = formatBytes(compressedSize);
        
        // Calculate reduction
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        if (reduction > 0) {
            sizeReductionBadge.textContent = `-${reduction}%`;
            sizeReductionBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            sizeReductionBadge.style.color = '#10b981';
            sizeReductionBadge.style.display = 'inline-block';
            compressedSizeDisplay.style.color = 'inherit';
            
            const hint = document.getElementById('size-hint');
            if (hint) hint.remove();
        } else {
            // Warning if larger
            const increase = (((compressedSize - originalSize) / originalSize) * 100).toFixed(1);
            sizeReductionBadge.textContent = `+${increase}%!`;
            sizeReductionBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            sizeReductionBadge.style.color = '#ef4444';
            sizeReductionBadge.style.display = 'inline-block';
            compressedSizeDisplay.style.color = '#ef4444';
            
            // Add a clear hint to the UI if it doesn't exist
            let hint = document.getElementById('size-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'size-hint';
                hint.style.cssText = 'color: #ef4444; font-size: 0.85rem; margin-top: 0.5rem; font-weight: 500;';
                compressedSizeDisplay.parentElement.appendChild(hint);
            }
            
            if (format === 'image/png') {
                hint.textContent = '💡 PNG gjer fila større. Prøv WebP eller JPEG.';
            } else {
                hint.textContent = '💡 Skru ned Kvalitet eller Storleik for å krympe fila.';
            }
        }

        // Setup Download
        downloadBtn.href = url;
        const extension = format.split('/')[1];
        const newFileName = originalFile.name.split('.').slice(0, -1).join('.') + `_komprimert.${extension}`;
        downloadBtn.download = newFileName;
        
    }, format, quality);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showSection(section) {
    [uploadSection, processSection].forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    section.classList.remove('hidden');
    section.classList.add('active');
    lucide.createIcons();
}

function resetApp() {
    originalFile = null;
    fileInput.value = '';
    qualityRange.value = 80;
    scaleRange.value = 100;
    showSection(uploadSection);
}
