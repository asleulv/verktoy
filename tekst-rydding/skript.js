const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const charIn = document.getElementById('char-count-in');
const wordIn = document.getElementById('word-count-in');
const charOut = document.getElementById('char-count-out');
const wordOut = document.getElementById('word-count-out');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const useSrcBtn = document.getElementById('use-src-btn');

// New DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
let targetFormat = 'markdown'; // default

// Initialize Lucide icons
lucide.createIcons();

// Initialize Turndown (HTML to MD)
const turndownService = (typeof TurndownService !== 'undefined') ? new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
}) : null;

// Event Listeners
inputText.addEventListener('input', () => {
    updateOutput();
});

// Magic Paste: Intercept Rich Text (HTML)
inputText.addEventListener('paste', (e) => {
    const html = e.clipboardData.getData('text/html');
    if (html && targetFormat === 'markdown') {
        e.preventDefault();
        // Convert the rich text directly to markdown
        const md = turndownService.turndown(html);
        
        // Insert at cursor position
        const start = inputText.selectionStart;
        const end = inputText.selectionEnd;
        const text = inputText.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        
        inputText.value = before + md + after;
        
        // Manual move of cursor to end of pasted text
        inputText.selectionStart = inputText.selectionEnd = start + md.length;
        
        updateOutput();
    }
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        targetFormat = btn.dataset.format;
        updateOutput();
    });
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    updateStats();
});

useSrcBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    inputText.value = outputText.value;
    updateOutput();
    inputText.scrollIntoView({ behavior: 'smooth' });
});

// Smart Logic
function updateOutput() {
    const raw = inputText.value || '';
    if (!raw) {
        outputText.value = '';
        updateStats();
        return;
    }

    let result = raw;
    const isHtml = /<[a-z][\s\S]*>/i.test(raw);
    const isMarkdown = /(^#\s|\*\*|__|\*|_|\[.*\]\(.*\))/m.test(raw);

    if (targetFormat === 'markdown') {
        if (isHtml) {
            result = turndownService.turndown(raw);
        }
        // If already MD or plain, leave as is
    } else if (targetFormat === 'html') {
        if (!isHtml) {
            // Assume it's MD or plain and convert to HTML
            result = marked.parse(raw);
        }
    } else if (targetFormat === 'plain') {
        const temp = document.createElement('div');
        temp.innerHTML = isHtml ? raw : marked.parse(raw);
        result = temp.textContent || temp.innerText || '';
    }

    outputText.value = result;
    updateStats();
}

function updateStats() {
    const textIn = inputText.value || '';
    const textOut = outputText.value || '';
    
    charIn.textContent = textIn.length;
    wordIn.textContent = textIn.trim() ? textIn.trim().split(/\s+/).length : 0;
    
    charOut.textContent = textOut.length;
    wordOut.textContent = textOut.trim() ? textOut.trim().split(/\s+/).length : 0;
}

// Additional Manual Actions
document.getElementById('btn-clean').addEventListener('click', () => applyAction('clean'));
document.getElementById('btn-super').addEventListener('click', () => applyAction('super'));
document.getElementById('btn-strip').addEventListener('click', () => applyAction('strip'));
document.getElementById('btn-upper').addEventListener('click', () => applyAction('upper'));
document.getElementById('btn-lower').addEventListener('click', () => applyAction('lower'));

function applyAction(type) {
    const raw = outputText.value || inputText.value;
    if (!raw) return;

    let result = '';
    switch (type) {
        case 'clean':
            result = raw.split('\n')
                        .map(line => line.trim().replace(/\s+/g, ' '))
                        .filter(line => line.length > 0)
                        .join('\n');
            break;
        case 'super':
            const tempSuper = document.createElement('div');
            tempSuper.innerHTML = raw;
            const stripped = tempSuper.textContent || tempSuper.innerText || '';
            result = stripped.split('\n')
                             .map(line => line.trim().replace(/\s+/g, ' '))
                             .filter(line => line.length > 0)
                             .join('\n');
            break;
        case 'strip':
            const tempStrip = document.createElement('div');
            tempStrip.innerHTML = raw;
            result = tempStrip.textContent || tempStrip.innerText || '';
            break;
        case 'upper':
            result = raw.toUpperCase();
            break;
        case 'lower':
            result = raw.toLowerCase();
            break;
    }

    outputText.value = result;
    updateStats();
}

async function copyToClipboard() {
    const text = outputText.value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-lucide="check"></i> Kopiert!';
        lucide.createIcons();
        setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            lucide.createIcons();
        }, 2000);
    } catch (err) {
        alert('Kunne ikkje kopiere.');
    }
}
