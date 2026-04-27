// Progress OpenEdge ABL Helper Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    const searchInput = document.getElementById('cmd-search');
    const cmdList = document.getElementById('cmd-list');
    const categoryFilter = document.getElementById('category-filter');

    let activeCategory = 'Alle';

    // Extract unique categories
    const categories = ['Alle', ...new Set(ablCommands.map(cmd => cmd.cat))];

    // Render category buttons
    function renderCategories() {
        categoryFilter.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `cat-btn ${activeCategory === cat ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                activeCategory = cat;
                renderCategories();
                filterAndRender();
            });
            categoryFilter.appendChild(btn);
        });
    }

    const keywords = [
        'DEFINE', 'VARIABLE', 'AS', 'NO-UNDO', 'INIT', 'INPUT', 'PARAMETER', 'OUTPUT', 
        'FOR', 'EACH', 'WHERE', 'FIRST', 'LAST', 'FIND', 'ASSIGN', 'IF', 'THEN', 'ELSE', 
        'DO', 'END', 'WHILE', 'REPEAT', 'FUNCTION', 'PROCEDURE', 'RETURNS', 'BUFFER', 
        'TEMP-TABLE', 'QUERY', 'DATASET', 'CREATE', 'DELETE', 'RELEASE', 'VALID-HANDLE', 
        'AVAILABLE', 'CAN-FIND', 'AMBIGUOUS', 'LOCKED', 'EXCLUSIVE-LOCK', 'NO-LOCK', 
        'SHARE-LOCK', 'NO-ERROR', 'MESSAGE', 'DISPLAY', 'RUN', 'ENTRY', 'SUBSTITUTE', 
        'LOOKUP', 'NUM-ENTRIES', 'CAN-QUERY', 'CAN-DO', 'TRUE', 'FALSE', 'YES', 'NO', 
        'NULL', 'INTEGER', 'CHARACTER', 'LOGICAL', 'DECIMAL', 'DATE', 'DATETIME', 
        'DATETIME-TZ', 'INT64', 'HANDLE', 'ROWID', 'NEW', 'BY', 'DESCENDING'
    ];

    function highlightABL(code) {
        // 1. Handle strings (to avoid highlighting keywords inside strings)
        let strings = [];
        let placeholderCode = code.replace(/(["'])(?:(?!\1).)*\1/g, (match) => {
            strings.push(match);
            return `__STR${strings.length - 1}__`;
        });

        // 2. Uppercase and highlight keywords
        let highlighted = placeholderCode;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            highlighted = highlighted.replace(regex, `<span class="hl-kw">${kw.toUpperCase()}</span>`);
        });

        // 3. Highlight operators and symbols (optional)
        // highlighted = highlighted.replace(/(=|<>|>|<|>=|<=|\+|\-|\*|\/)/g, '<span class="hl-op">$1</span>');

        // 4. Restore strings and highlight them
        highlighted = highlighted.replace(/__STR(\d+)__/g, (match, index) => {
            return `<span class="hl-str">${strings[index]}</span>`;
        });

        return highlighted;
    }

    // Filter and render commands
    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filtered = ablCommands.filter(cmd => {
            const matchesSearch = cmd.name.toLowerCase().includes(searchTerm) || 
                                  cmd.desc.toLowerCase().includes(searchTerm) ||
                                  cmd.cat.toLowerCase().includes(searchTerm);
            const matchesCategory = activeCategory === 'Alle' || cmd.cat === activeCategory;
            
            return matchesSearch && matchesCategory;
        });

        renderList(filtered);
    }

    // Render the actual command list
    function renderList(commands) {
        cmdList.innerHTML = '';

        if (commands.length === 0) {
            cmdList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Ingen treff på "${searchInput.value}"</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        commands.forEach(cmd => {
            const item = document.createElement('div');
            item.className = 'cmd-item';
            
            const highlightedEx = highlightABL(cmd.ex.trim());

            item.innerHTML = `
                <div class="cmd-header">
                    <span class="cmd-name">${cmd.name}</span>
                    <span class="cmd-cat">${cmd.cat}</span>
                </div>
                <p class="cmd-desc">${cmd.desc}</p>
                <div class="cmd-ex"><code>${highlightedEx.replace(/\n/g, '<br>')}</code><button class="btn-copy-mini" title="Kopier eksempel">
                        <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `;


            // Add copy functionality
            const copyBtn = item.querySelector('.btn-copy-mini');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(cmd.ex).then(() => {
                    const icon = copyBtn.querySelector('i');
                    const originalIcon = icon.getAttribute('data-lucide');
                    copyBtn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; color: var(--success);"></i>';
                    lucide.createIcons();
                    setTimeout(() => {
                        copyBtn.innerHTML = `<i data-lucide="${originalIcon}" style="width: 16px; height: 16px;"></i>`;
                        lucide.createIcons();
                    }, 2000);
                });
            });

            cmdList.appendChild(item);
        });

        lucide.createIcons();
    }

    // Event listeners
    searchInput.addEventListener('input', filterAndRender);

    // Initial render
    renderCategories();
    filterAndRender();
});
