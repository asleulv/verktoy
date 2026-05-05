document.addEventListener('DOMContentLoaded', () => {
    const apiBtn = document.getElementById('fetch-btn');
    const apiUrlInput = document.getElementById('api-url');
    const parseBtn = document.getElementById('parse-btn');
    const jsonTextarea = document.getElementById('json-textarea');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const resultsSection = document.getElementById('results-section');
    const jsonViewer = document.getElementById('json-viewer');
    const loader = document.getElementById('loader');
    const searchInput = document.getElementById('json-search');
    const expandAllBtn = document.getElementById('expand-all');
    const collapseAllBtn = document.getElementById('collapse-all');
    const copyBtn = document.getElementById('copy-json');
    const errorToast = document.getElementById('error-toast');
    const errorMessage = document.getElementById('error-message');

    const viewTreeBtn = document.getElementById('view-tree');
    const viewTableBtn = document.getElementById('view-table');
    const viewSchemaBtn = document.getElementById('view-schema');

    let currentData = null;
    let currentView = 'schema'; // Default to schema as per user request for structure

    // --- Tab Logic ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // --- View Toggling ---
    viewTreeBtn.addEventListener('click', () => setView('tree'));
    viewTableBtn.addEventListener('click', () => setView('table'));
    viewSchemaBtn.addEventListener('click', () => setView('schema'));

    function setView(view) {
        currentView = view;
        viewTreeBtn.classList.toggle('active', view === 'tree');
        viewTableBtn.classList.toggle('active', view === 'table');
        viewSchemaBtn.classList.toggle('active', view === 'schema');
        if (currentData) renderCurrentView();
    }

    function renderCurrentView() {
        jsonViewer.innerHTML = '';
        if (currentView === 'tree') {
            renderTree(currentData);
            expandAllBtn.parentElement.classList.remove('hidden');
        } else if (currentView === 'table') {
            renderTable(currentData);
            expandAllBtn.parentElement.classList.add('hidden');
        } else {
            renderSchema(currentData);
            expandAllBtn.parentElement.classList.remove('hidden');
        }
    }

    // --- Fetch Logic ---
    apiBtn.addEventListener('click', async () => {
        const url = apiUrlInput.value.trim();
        if (!url) return showError('Skriv inn ei lenke først.');

        showLoader(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status: ${response.status} ${response.statusText}`);
            const data = await response.json();
            handleData(data);
        } catch (err) {
            showError(`Kunne ikkje hente data: ${err.message}. Merk at API-en må støtte CORS.`);
        } finally {
            showLoader(false);
        }
    });

    // --- Parse Logic ---
    parseBtn.addEventListener('click', () => {
        const text = jsonTextarea.value.trim();
        if (!text) return showError('Lim inn noko JSON først.');

        try {
            const data = JSON.parse(text);
            handleData(data);
        } catch (err) {
            showError(`Ugyldig JSON: ${err.message}`);
        }
    });

    // --- File Logic ---
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) readFile(file);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) readFile(file);
    });

    function readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                handleData(data);
            } catch (err) {
                showError('Kunne ikkje lese fila. Er det ei gyldig JSON-fil?');
            }
        };
        reader.readAsText(file);
    }

    // --- Core Data Handling ---
    function handleData(data) {
        currentData = data;
        resultsSection.classList.remove('hidden');
        renderCurrentView();
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function renderTree(data) {
        jsonViewer.innerHTML = '';
        const root = createNode(null, data, 'root', true);
        jsonViewer.appendChild(root);
        lucide.createIcons();
    }

    function createNode(key, value, path, isRoot = false, isSchema = false) {
        const container = document.createElement('div');
        container.className = 'json-node-wrapper';
        if (isSchema) container.classList.add('schema-mode');
        container.dataset.path = path;
        
        const line = document.createElement('div');
        line.className = 'json-line';

        const isExpandable = value !== null && typeof value === 'object';
        const isMap = isSchema && value && value.__isMap;
        
        if (isExpandable && !isMap) {
            const toggle = document.createElement('span');
            toggle.className = 'json-toggle';
            toggle.innerHTML = '<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>';
            line.appendChild(toggle);
            
            toggle.onclick = (e) => {
                e.stopPropagation();
                const isCollapsed = container.classList.toggle('json-collapsed');
                toggle.innerHTML = isCollapsed 
                    ? '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>'
                    : '<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>';
                lucide.createIcons();
            };
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'json-toggle';
            line.appendChild(spacer);
        }

        if (key !== null) {
            const keySpan = document.createElement('span');
            keySpan.className = key.startsWith('<') ? 'json-key-placeholder' : 'json-key';
            keySpan.textContent = key.endsWith(': ') ? key : `${key}: `;
            line.appendChild(keySpan);
        }

        const valueSpan = document.createElement('span');
        if (isMap) {
            valueSpan.className = 'json-value-schema';
            valueSpan.textContent = `Map<String, ${typeof value.valueSchema === 'string' ? value.valueSchema : 'Object'}>`;
        } else if (isExpandable) {
            valueSpan.className = 'json-bracket';
            valueSpan.textContent = Array.isArray(value) ? '[' : '{';
        } else {
            if (isSchema) {
                valueSpan.className = 'json-value-schema';
                valueSpan.textContent = value;
            } else {
                valueSpan.className = `json-value-${getValueType(value)}`;
                valueSpan.textContent = formatValue(value);
            }
        }
        line.appendChild(valueSpan);

        if (!isSchema) {
            const pathSpan = document.createElement('span');
            pathSpan.className = 'path-hint';
            pathSpan.textContent = ` // ${path}`;
            line.appendChild(pathSpan);
        }

        container.appendChild(line);

        if (isExpandable && !isMap) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'json-node';
            
            const entries = Object.entries(value);
            entries.forEach(([k, v], index) => {
                const childPath = Array.isArray(value) ? `${path}[${k}]` : `${path}.${k}`;
                const child = createNode(k, v, childPath, false, isSchema);
                if (index < entries.length - 1 && !isSchema) {
                    const comma = document.createElement('span');
                    comma.textContent = ',';
                    child.querySelector('.json-line').appendChild(comma);
                }
                childrenContainer.appendChild(child);
            });

            container.appendChild(childrenContainer);

            if (!isSchema || entries.length > 0) {
                const closingLine = document.createElement('div');
                closingLine.className = 'json-line';
                closingLine.style.marginLeft = '1.25rem';
                closingLine.innerHTML = `<span class="json-bracket">${Array.isArray(value) ? ']' : '}'}</span>`;
                container.appendChild(closingLine);
            }
        }

        return container;
    }

    function renderSchema(data) {
        const schema = generateSchema(data);
        jsonViewer.innerHTML = '';
        const root = createNode(null, schema, 'root', true, true);
        jsonViewer.appendChild(root);
        lucide.createIcons();
    }

    function generateSchema(data) {
        if (data === null) return 'Null';
        
        if (Array.isArray(data)) {
            if (data.length === 0) return [];
            const elementSchemas = data.map(item => generateSchema(item));
            const merged = mergeSchemas(elementSchemas);
            return [merged];
        }

        if (typeof data === 'object') {
            const entries = Object.entries(data);
            if (entries.length === 0) return {};

            // Map Detection: If many keys and they look like IDs/Codes OR have identical value schemas
            if (entries.length > 3) {
                const valueSchemas = entries.map(([k, v]) => JSON.stringify(generateSchema(v)));
                const allIdentical = valueSchemas.every(s => s === valueSchemas[0]);
                
                if (allIdentical) {
                    const sampleKey = entries[0][0];
                    const placeholder = isNaN(sampleKey) ? '<string>' : '<number>';
                    const schema = {};
                    schema[placeholder] = generateSchema(entries[0][1]);
                    return schema;
                }
            }

            const schema = {};
            entries.forEach(([k, v]) => {
                schema[k] = generateSchema(v);
            });
            return schema;
        }

        const type = typeof data;
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    function mergeSchemas(schemas) {
        if (schemas.length === 0) return 'Any';
        const first = schemas[0];
        
        if (typeof first !== 'object' || first === null) {
            // Return unique types found
            const types = new Set(schemas.filter(s => typeof s !== 'object'));
            return Array.from(types).join(' | ') || 'Object';
        }

        if (Array.isArray(first)) {
            const innerSchemas = schemas.flat().filter(s => s !== undefined);
            return [mergeSchemas(innerSchemas)];
        }

        const merged = {};
        schemas.forEach(s => {
            if (typeof s === 'object' && s !== null && !Array.isArray(s)) {
                Object.entries(s).forEach(([k, v]) => {
                    if (!merged[k]) {
                        merged[k] = v;
                    } else if (JSON.stringify(merged[k]) !== JSON.stringify(v)) {
                        // If different, we could merge further, but keep first for simplicity or join types
                        if (typeof merged[k] === 'string' && typeof v === 'string') {
                            if (!merged[k].includes(v)) merged[k] += ` | ${v}`;
                        }
                    }
                });
            }
        });
        return merged;
    }

    function renderTable(data) {
        if (data === null || typeof data !== 'object') {
            jsonViewer.innerHTML = '<p class="input-hint" style="text-align:center; padding: 2rem;">Ingen tabell-data å vise.</p>';
            return;
        }

        const container = document.createElement('div');
        container.className = 'json-table-container';

        const table = document.createElement('table');
        table.className = 'json-table';

        if (Array.isArray(data)) {
            const headers = new Set();
            data.forEach(item => {
                if (item && typeof item === 'object') {
                    Object.keys(item).forEach(key => headers.add(key));
                }
            });

            const headerList = Array.from(headers);
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = '<th>#</th>' + headerList.map(h => `<th>${h}</th>`).join('');
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            data.forEach((item, index) => {
                const row = document.createElement('tr');
                let cells = `<td>${index}</td>`;
                
                if (item && typeof item === 'object') {
                    headerList.forEach(h => {
                        const val = item[h];
                        const displayVal = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : formatValue(val);
                        cells += `<td title="${displayVal.replace(/"/g, '&quot;')}">${displayVal}</td>`;
                    });
                } else {
                    cells += `<td colspan="${headerList.length}">${formatValue(item)}</td>`;
                }
                
                row.innerHTML = cells;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
        } else {
            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>Nøkkel</th><th>Verdi</th></tr>';
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            Object.entries(data).forEach(([key, val]) => {
                const row = document.createElement('tr');
                const displayVal = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : formatValue(val);
                row.innerHTML = `<td><strong>${key}</strong></td><td title="${displayVal.replace(/"/g, '&quot;')}">${displayVal}</td>`;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
        }

        container.appendChild(table);
        jsonViewer.appendChild(container);
    }

    function getValueType(val) {
        if (val === null) return 'null';
        return typeof val;
    }

    function formatValue(val) {
        if (val === null) return 'null';
        if (typeof val === 'string') return `"${val}"`;
        return String(val);
    }

    // --- Search Logic ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (!term) {
            clearSearch();
            return;
        }

        if (currentView === 'tree') {
            const nodes = jsonViewer.querySelectorAll('.json-line');
            nodes.forEach(line => {
                const text = line.textContent.toLowerCase();
                const wrapper = line.closest('.json-node-wrapper');
                
                if (text.includes(term)) {
                    line.classList.add('highlight');
                    let parent = wrapper.parentElement;
                    while (parent && parent !== jsonViewer) {
                        if (parent.classList.contains('json-node')) {
                            parent.parentElement.classList.remove('json-collapsed');
                            const toggle = parent.parentElement.querySelector('.json-toggle');
                            if (toggle) toggle.innerHTML = '<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>';
                        }
                        parent = parent.parentElement;
                    }
                } else {
                    line.classList.remove('highlight');
                }
            });
            lucide.createIcons();
        } else {
            // Table search
            const rows = jsonViewer.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        }
    });

    function clearSearch() {
        jsonViewer.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        if (currentView === 'table') {
            jsonViewer.querySelectorAll('tbody tr').forEach(row => row.style.display = '');
        }
    }

    // --- Actions ---
    expandAllBtn.addEventListener('click', () => {
        jsonViewer.querySelectorAll('.json-collapsed').forEach(el => {
            el.classList.remove('json-collapsed');
            const toggle = el.querySelector('.json-toggle');
            if (toggle) toggle.innerHTML = '<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>';
        });
        lucide.createIcons();
    });

    collapseAllBtn.addEventListener('click', () => {
        const nodes = jsonViewer.querySelectorAll('.json-node-wrapper');
        nodes.forEach((node, i) => {
            if (i === 0) return; 
            if (node.querySelector('.json-node')) {
                node.classList.add('json-collapsed');
                const toggle = node.querySelector('.json-toggle');
                if (toggle) toggle.innerHTML = '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>';
            }
        });
        lucide.createIcons();
    });

    copyBtn.addEventListener('click', async () => {
        if (!currentData) return;
        
        let textToCopy = '';
        if (currentView === 'schema') {
            const schema = generateSchema(currentData);
            textToCopy = JSON.stringify(schema, null, 4);
        } else {
            textToCopy = JSON.stringify(currentData, null, 4);
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check"></i>';
            lucide.createIcons();
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                lucide.createIcons();
            }, 2000);
        } catch (err) {
            // Fallback for non-secure contexts or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                copyBtn.innerHTML = '<i data-lucide="check"></i>';
                lucide.createIcons();
            } catch (err) {
                showError('Kunne ikkje kopiere til utklippstavla.');
            }
            document.body.removeChild(textArea);
            setTimeout(() => {
                copyBtn.innerHTML = '<i data-lucide="copy"></i>';
                lucide.createIcons();
            }, 2000);
        }
    });

    // --- UI Helpers ---
    function showLoader(show) {
        loader.classList.toggle('hidden', !show);
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorToast.classList.remove('hidden');
        setTimeout(() => errorToast.classList.add('hidden'), 5000);
    }
});
