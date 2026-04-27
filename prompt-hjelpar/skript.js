const inputs = ['persona', 'task', 'context', 'format'];
const checkboxes = ['step-by-step', 'be-critical', 'ask-first'];
const finalPrompt = document.getElementById('final-prompt');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const rawInput = document.getElementById('raw-input');
const upgradeBtn = document.getElementById('upgrade-btn');

// Initialize Lucide
lucide.createIcons();

// Attach to window
window.applyTemplate = applyTemplate;

// Event Listeners
inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', generatePrompt);
});

checkboxes.forEach(id => {
    document.getElementById(id).addEventListener('change', generatePrompt);
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);
upgradeBtn.addEventListener('click', upgradePrompt);

// Logic
function applyTemplate(type) {
    const data = {
        coder: {
            persona: "Du er ein erfaren kodespesialist og arkitekt. Du skriv rein, moderne og sikker kode.",
            task: "Analyser dette problemet og gi meg ei optimal løysing med forklaring.",
            context: "Dette er ein del av eit moderne web-prosjekt.",
            format: "Gi meg ferdig kode i blokker og bruk kommentarar for å forklare komplekse deler.",
            checks: ['step-by-step']
        },
        writer: {
            persona: "Du er ein profesjonell korrekturlesar og skribent som er ekspert på nynorsk.",
            task: "Gjer denne teksten meir engasjerande og profesjonell, utan å miste bodskapet.",
            context: "Teksten skal publiserast på ein blogg.",
            format: "Bruk eit tydeleg språk og fokusert innhald.",
            checks: ['step-by-step', 'be-critical']
        },
        summary: {
            persona: "Du er ein effektiv dataanalytiker som er god på å finne essensen i store mengder informasjon.",
            task: "Lag eit konsist sammendrag av det viktigaste i denne informasjonen.",
            context: "Dette skal brukast som eit kort notat.",
            format: "Bruk punktlister for dei viktigaste punkta.",
            checks: ['step-by-step']
        },
        brainstorm: {
            persona: "Du er ein kreativ strateg og idéutviklar kjent for å tenke 'utanfor boksen'.",
            task: "Kom med 10 unike og kreative idèar basert på dette temaet.",
            context: "Målet er å finne ein ny vinkling.",
            format: "List opp idèane og gi kvar ein kort grunngjeving.",
            checks: ['ask-first']
        }
    };

    const template = data[type];
    if (!template) return;

    document.getElementById('persona').value = template.persona;
    document.getElementById('task').value = template.task;
    document.getElementById('context').value = template.context;
    document.getElementById('format').value = template.format;
    
    checkboxes.forEach(id => {
        document.getElementById(id).checked = template.checks.includes(id);
    });

    generatePrompt();
}

function upgradePrompt() {
    const raw = rawInput.value.trim();
    if (!raw) return;

    // Default values
    let persona = "Du er ein hjelpsom assistent.";
    let task = raw;
    let context = "Standard kontekst.";
    let format = "Smarte punktlister og tydeleg språk.";
    let checks = ['step-by-step'];

    // Keyword detection
    const lRaw = raw.toLowerCase();
    
    if (lRaw.includes('code') || lRaw.includes('component') || lRaw.includes('api') || lRaw.includes('javascript') || lRaw.includes('css')) {
        persona = "Du er ein ekspert på frontend-utvikling og moderne web-teknologi.";
        task = `Implementer følgjande funksjonalitet: ${raw}`;
        context = "Prosjektet brukar moderne standardar og krev sikker, effektiv kode.";
    } else if (lRaw.includes('skriv') || lRaw.includes('write') || lRaw.includes('tekst') || lRaw.includes('nynorsk')) {
        persona = "Du er ein erfaren skribent med fokus på flyt og rettskriving.";
        task = `Skriv om eller forbetre følgjande: ${raw}`;
    } else if (lRaw.includes('sammendrag') || lRaw.includes('summary') || lRaw.includes('oppsummer')) {
        persona = "Du er ein assistent spesialisert på informasjons-kondensering.";
        task = `Lag eit tydeleg sammendrag av følgjande: ${raw}`;
    }

    // Populate
    document.getElementById('persona').value = persona;
    document.getElementById('task').value = task;
    document.getElementById('context').value = context;
    document.getElementById('format').value = format;
    
    checkboxes.forEach(id => {
        document.getElementById(id).checked = checks.includes(id);
    });

    generatePrompt();
    
    // Smooth scroll to builder
    document.querySelector('.builder-grid').scrollIntoView({ behavior: 'smooth' });
}

checkboxes.forEach(id => {
    document.getElementById(id).addEventListener('change', generatePrompt);
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// Logic
function generatePrompt() {
    const persona = document.getElementById('persona').value.trim();
    const task = document.getElementById('task').value.trim();
    const context = document.getElementById('context').value.trim();
    const format = document.getElementById('format').value.trim();

    const t_step = document.getElementById('step-by-step').checked;
    const t_crit = document.getElementById('be-critical').checked;
    const t_ask = document.getElementById('ask-first').checked;

    let prompt = '';

    if (persona) {
        prompt += `### ROLLE / PERSONA\n${persona}\n\n`;
    }

    if (task) {
        prompt += `### OPPGÅVE\n${task}\n\n`;
    }

    if (context) {
        prompt += `### KONTEKST\n${context}\n\n`;
    }

    if (format) {
        prompt += `### FORMAT OG VILKÅR\n${format}\n\n`;
    }

    // Add Tweaks
    let increments = [];
    if (t_step) increments.push("- Tenk steg for steg før du svarer for å sikre best mogleg logikk.");
    if (t_crit) increments.push("- Vær kritisk til dine egne antakingar og vurder fleire perspektiv.");
    if (t_ask) increments.push("- Dersom noko er uklart eller du manglar informasjon for å utføre oppgåva optimalt, vennligst spør meg før du genererer eit svar.");

    if (increments.length > 0) {
        prompt += `### TILLEGGSINSTRUKSUONAR\n${increments.join('\n')}\n\n`;
    }

    finalPrompt.value = prompt.trim();
}

async function copyToClipboard() {
    const text = finalPrompt.value;
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

function clearAll() {
    inputs.forEach(id => document.getElementById(id).value = '');
    checkboxes.forEach(id => document.getElementById(id).checked = false);
    generatePrompt();
}
