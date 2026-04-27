// Commands Data
const commands = [
    { name: 'ls', cat: 'Filsystem', desc: 'Listar ut innhaldet i ei mappe.', ex: 'ls -la' },
    { name: 'cd', cat: 'Filsystem', desc: 'Sift mappe / naviger.', ex: 'cd prosjekt/filer' },
    { name: 'pwd', cat: 'Filsystem', desc: 'Viser kor du er i mappestrukturen.', ex: 'pwd' },
    { name: 'mkdir', cat: 'Filsystem', desc: 'Lag ei ny mappe.', ex: 'mkdir ny-mappe' },
    { name: 'cp', cat: 'Filsystem', desc: 'Kopierer filer eller mapper.', ex: 'cp fil.txt kopi.txt' },
    { name: 'mv', cat: 'Filsystem', desc: 'Flyttar eller endrar namn på filer.', ex: 'mv gammal.txt ny.txt' },
    { name: 'rm', cat: 'Filsystem', desc: 'Slettar filer. Bruk -r for mapper.', ex: 'rm -rf mappe-namn' },
    { name: 'touch', cat: 'Filsystem', desc: 'Lag ei tom fil.', ex: 'touch ny-fil.txt' },
    { name: 'grep', cat: 'Søk / Tekst', desc: 'Søk etter tekst i filer eller output.', ex: 'grep "søkeord" fil.txt' },
    { name: 'find', cat: 'Søk / Tekst', desc: 'Søk etter filer i mapper.', ex: 'find . -name "*.js"' },
    { name: 'cat', cat: 'Søk / Tekst', desc: 'Viser innhaldet i ei fil på skjermen.', ex: 'cat fil.txt' },
    { name: 'nano / vim', cat: 'Redigering', desc: 'Enkle teksteditorar i terminalen.', ex: 'nano fil.txt' },
    { name: 'chmod', cat: 'Rettigheiter', desc: 'Endrar kven som kan lese/skrive filer.', ex: 'chmod 755 skript.sh' },
    { name: 'chown', cat: 'Rettigheiter', desc: 'Endrar kven som eig ei fil.', ex: 'chown brukar:gruppe fil.txt' },
    { name: 'sudo', cat: 'System', desc: 'Køyrer ein kommando som administratør.', ex: 'sudo apt update' },
    { name: 'ps', cat: 'System', desc: 'Viser alle prosessar som køyrer.', ex: 'ps aux' },
    { name: 'top / htop', cat: 'System', desc: 'Oppgåvehandsamar for terminalen.', ex: 'htop' },
    { name: 'df', cat: 'System', desc: 'Viser kor mykje diskplass du har.', ex: 'df -h' },
    { name: 'ssh', cat: 'Nettverk', desc: 'Kople seg på ein annan server sikkert.', ex: 'ssh brukar@server' },
    { name: 'curl', cat: 'Nettverk', desc: 'Hentar data frå nettadresser.', ex: 'curl -O https://fil.txt' },
    { name: 'tar', cat: 'Arkiv', desc: 'Pakkar saman eller ut mapper (.tar.gz).', ex: 'tar -xvf arkiv.tar.gz' },
    { name: 'history', cat: 'System', desc: 'Viser kva kommandoar du har køyrt før.', ex: 'history | grep ls' },
    { name: 'man', cat: 'Hjelp', desc: 'Manual for kommandoar.', ex: 'man grep' }
];

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const chmodCheckboxes = document.querySelectorAll('.chmod-group input');
const chmodNumeric = document.getElementById('chmod-numeric');
const chmodSymbolic = document.getElementById('chmod-symbolic');
const chmodCommand = document.getElementById('chmod-command');
const copyCmdBtn = document.getElementById('copy-cmd');
const cmdSearch = document.getElementById('cmd-search');
const cmdList = document.getElementById('cmd-list');

// Initial setup
lucide.createIcons();
renderCommands(commands);

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab-${tabId}`) content.classList.add('active');
        });
        
        lucide.createIcons();
    });
});

// CHMOD Logic
chmodCheckboxes.forEach(cb => {
    cb.addEventListener('change', calculateCHMOD);
});

function calculateCHMOD() {
    let owner = 0, group = 0, other = 0;
    let sym = "---------".split('');

    chmodCheckboxes.forEach(cb => {
        if (cb.checked) {
            const bit = parseInt(cb.dataset.bit);
            if (bit >= 100) owner += bit / 100;
            else if (bit >= 10) group += bit / 10;
            else other += bit;

            // Map bit to symbol index
            const map = {
                400: 0, 200: 1, 100: 2,
                40: 3, 20: 4, 10: 5,
                4: 6, 2: 7, 1: 8
            };
            const idx = map[bit];
            const chars = ['r', 'w', 'x', 'r', 'w', 'x', 'r', 'w', 'x'];
            sym[idx] = chars[idx];
        }
    });

    const numCode = `${owner}${group}${other}`;
    chmodNumeric.textContent = numCode;
    chmodSymbolic.textContent = sym.join('');
    chmodCommand.innerHTML = `chmod ${numCode} <span style="color: grey">filnamn</span>`;
}

copyCmdBtn.addEventListener('click', () => {
    const code = chmodNumeric.textContent;
    const fullCmd = `chmod ${code} filnamn`;
    navigator.clipboard.writeText(fullCmd).then(() => {
        const originalIcon = copyCmdBtn.innerHTML;
        copyCmdBtn.innerHTML = '<i data-lucide="check" style="color: var(--success)"></i>';
        lucide.createIcons();
        setTimeout(() => {
            copyCmdBtn.innerHTML = originalIcon;
            lucide.createIcons();
        }, 2000);
    });
});

// Commands Search Logic
cmdSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.desc.toLowerCase().includes(query) ||
        cmd.cat.toLowerCase().includes(query)
    );
    renderCommands(filtered);
});

function renderCommands(data) {
    if (data.length === 0) {
        cmdList.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">Ingen kommandoar matchar søket ditt.</div>';
        return;
    }

    cmdList.innerHTML = data.map(cmd => `
        <div class="cmd-item">
            <div class="cmd-header">
                <span class="cmd-name">${cmd.name}</span>
                <span class="cmd-cat">${cmd.cat}</span>
            </div>
            <div class="cmd-desc">${cmd.desc}</div>
            <div class="cmd-ex">${cmd.ex}</div>
        </div>
    `).join('');
}

// Initial calculation
calculateCHMOD();
