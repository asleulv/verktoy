// Chords Logic
const notesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// DOM Elements
const inputText = document.getElementById('input-text');
const outputDisplay = document.getElementById('output-display');
const transposeRange = document.getElementById('transpose-range');
const semitoneVal = document.getElementById('semitone-val');
const btnUp = document.getElementById('step-up');
const btnDown = document.getElementById('step-down');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');

// Initialize Lucide
lucide.createIcons();

// Event Listeners
inputText.addEventListener('input', runTranspose);
transposeRange.addEventListener('input', (e) => {
    semitoneVal.textContent = e.target.value > 0 ? `+${e.target.value}` : e.target.value;
    runTranspose();
});

btnUp.addEventListener('click', () => {
    if (parseInt(transposeRange.value) < 11) {
        transposeRange.value = parseInt(transposeRange.value) + 1;
        transposeRange.dispatchEvent(new Event('input'));
    }
});

btnDown.addEventListener('click', () => {
    if (parseInt(transposeRange.value) > -11) {
        transposeRange.value = parseInt(transposeRange.value) - 1;
        transposeRange.dispatchEvent(new Event('input'));
    }
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputDisplay.textContent = '';
    transposeRange.value = 0;
    semitoneVal.textContent = '0';
});

// Main Logic
function runTranspose() {
    const rawText = inputText.value;
    if (!rawText) {
        outputDisplay.textContent = '';
        return;
    }

    const steps = parseInt(transposeRange.value);
    const lines = rawText.split('\n');
    
    const transposedLines = lines.map(line => {
        // Simple heuristic: if a line is mostly chords, treat it as a chord line
        if (isChordLine(line)) {
            return transposeLine(line, steps);
        }
        return line;
    });

    outputDisplay.textContent = transposedLines.join('\n');
}

function isChordLine(line) {
    if (!line.trim()) return false;
    
    // Check if the line consists mostly of characters found in chords
    // A chord regex: [A-G][b#]?(m|maj|min|dim|aug|sus|add|7|9|11|13)*(\/[A-G][b#]?)?
    const words = line.trim().split(/\s+/);
    let chordCount = 0;
    
    for (const word of words) {
        if (/^[A-G][b#]?(m|maj|min|dim|aug|sus|add|7|9|11|13|Δ|\+|alt)*(\/[A-G][b#]?)?$/.test(word)) {
            chordCount++;
        }
    }
    
    // If more than 50% of words are chords, it's a chord line
    return chordCount / words.length >= 0.4;
}

function transposeLine(line, steps) {
    // Regex identifies chords specifically, keeping spaces intact
    // This regex looks for [A-G] followed by possible accidentals and suffixes
    const chordRegex = /[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|Δ|\+|alt)*(?:\/[A-G][b#]?)?/g;
    
    return line.replace(chordRegex, (match) => {
        return transposeChord(match, steps);
    });
}

function transposeChord(chord, steps) {
    if (steps === 0) return chord;

    // Handle slash chords (e.g., C/E)
    if (chord.includes('/')) {
        const parts = chord.split('/');
        return transposeChord(parts[0], steps) + '/' + transposeChord(parts[1], steps);
    }

    // Identify Root and Suffix
    // Root is [A-G][b#]?
    const match = chord.match(/^([A-G][b#]?)(.*)/);
    if (!match) return chord;

    const root = match[1];
    const suffix = match[2];

    // Find index in chromatic scale
    let index = notesSharp.indexOf(root);
    if (index === -1) index = notesFlat.indexOf(root);
    if (index === -1) return chord; // Should not happen with valid regex

    let newIndex = (index + steps) % 12;
    if (newIndex < 0) newIndex += 12;

    // Decide whether to use # or b (heuristic: use sharps for positive steps, flats for negative)
    const newRoot = steps >= 0 ? notesSharp[newIndex] : notesFlat[newIndex];
    
    return newRoot + suffix;
}

async function copyToClipboard() {
    const text = outputDisplay.textContent;
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
        alert('Kunne ikkje kopiere til utklippstavla.');
    }
}
