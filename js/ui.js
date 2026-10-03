/**
 * Plants vs. Math - UI & Menu Controller
 * Handles table selection buttons, difficulty/speed throttle synchronization,
 * sound toggles, and report card visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current selected tables (1-12)
    let selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // Populate Table Selector Grid (1 to 12)
    const grid = document.getElementById('tableSelectorGrid');
    if (grid) {
        grid.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const btn = document.createElement('button');
            btn.className = 'table-btn active';
            btn.textContent = `× ${i}`;
            btn.dataset.table = i;

            btn.addEventListener('click', () => {
                const tableNum = parseInt(btn.dataset.table, 10);
                if (selectedTables.includes(tableNum)) {
                    // Cannot deselect all
                    if (selectedTables.length > 1) {
                        selectedTables = selectedTables.filter(t => t !== tableNum);
                        btn.classList.remove('active');
                    }
                } else {
                    selectedTables.push(tableNum);
                    btn.classList.add('active');
                }
            });
            grid.appendChild(btn);
        }
    }

    // Helper to update table button classes from array
    function updateTableButtons() {
        document.querySelectorAll('.table-btn').forEach(btn => {
            const num = parseInt(btn.dataset.table, 10);
            if (selectedTables.includes(num)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Preset Buttons
    document.getElementById('presetAll')?.addEventListener('click', () => {
        selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        updateTableButtons();
    });

    document.getElementById('presetBeginner')?.addEventListener('click', () => {
        selectedTables = [1, 2, 5, 10];
        updateTableButtons();
    });

    document.getElementById('presetHard')?.addEventListener('click', () => {
        selectedTables = [6, 7, 8, 9, 12];
        updateTableButtons();
    });

    // Math Operations Selection: any combination of addition, subtraction, multiplication, division
    let selectedOperations = ['addition', 'subtraction', 'multiplication', 'division'];
    let sunMultiplesMode = false;

    function updateOperationsUI() {
        if (window.mathEngine) {
            window.mathEngine.setOperations(selectedOperations);
        }

        document.querySelectorAll('.op-btn').forEach(btn => {
            const op = btn.dataset.op;
            if (selectedOperations.includes(op)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Determine symbol for table buttons
        let symbol = '';
        const hasAdd = selectedOperations.includes('addition');
        const hasSub = selectedOperations.includes('subtraction');
        const hasMul = selectedOperations.includes('multiplication');
        const hasDiv = selectedOperations.includes('division');

        if (selectedOperations.length === 4) symbol = 'Math';
        else if (hasMul && hasDiv && !hasAdd && !hasSub) symbol = '×/÷';
        else if (hasAdd && hasSub && !hasMul && !hasDiv) symbol = '+/−';
        else if (hasAdd && !hasSub && !hasMul && !hasDiv) symbol = '+';
        else if (hasSub && !hasAdd && !hasMul && !hasDiv) symbol = '−';
        else if (hasMul && !hasAdd && !hasSub && !hasDiv) symbol = '×';
        else if (hasDiv && !hasAdd && !hasSub && !hasMul) symbol = '÷';
        else symbol = 'Fact';

        document.querySelectorAll('.table-btn').forEach(btn => {
            const num = btn.dataset.table;
            btn.textContent = `${symbol} ${num}`;
        });

        // Header Title
        const headerTitle = document.getElementById('headerGameTitle');
        if (headerTitle) {
            if (selectedOperations.length === 4) {
                headerTitle.textContent = 'Plants vs. Math: All Operations (+, −, ×, ÷)';
            } else if (hasMul && !hasDiv && !hasAdd && !hasSub) {
                headerTitle.textContent = 'Plants vs. Math: Times Tables';
            } else if (hasDiv && !hasMul && !hasAdd && !hasSub) {
                headerTitle.textContent = 'Plants vs. Math: Division Facts';
            } else if (hasAdd && hasSub && !hasMul && !hasDiv) {
                headerTitle.textContent = 'Plants vs. Math: Addition & Subtraction (1..20)';
            } else {
                headerTitle.textContent = 'Plants vs. Math: Arithmetic Defense';
            }
        }
    }

    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const op = btn.dataset.op;
            if (selectedOperations.includes(op)) {
                // Prevent deselecting all operations (must keep at least 1)
                if (selectedOperations.length > 1) {
                    selectedOperations = selectedOperations.filter(o => o !== op);
                }
            } else {
                selectedOperations.push(op);
            }
            updateOperationsUI();
        });
    });

    // Sun Drop Game Mode (Classic vs Multiples)
    function updateGameModeUI(mode) {
        sunMultiplesMode = (mode === 'multiples');
        if (window.game) {
            window.game.setSunMultiplesMode(sunMultiplesMode);
        }

        document.querySelectorAll('.gamemode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const desc = document.getElementById('modeDescription');
        if (desc) {
            if (sunMultiplesMode) {
                desc.innerHTML = '⭐ <strong>Multiples Mode:</strong> Each defeated zombie releases 2 numbered suns that float to the top! Click the valid multiple of 2–5 to earn sun. Wrong clicks lose a point (min 0)!';
            } else {
                desc.innerHTML = '🌻 <strong>Classic Mode:</strong> Defeated zombies drop standard sun orbs to buy Cherry Bombs.';
            }
        }
    }

    document.querySelectorAll('.gamemode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateGameModeUI(btn.dataset.mode);
        });
    });

    // Speed Sync Function: updates all sliders and labels across UI
    function syncSpeed(speed) {
        const val = parseFloat(speed);
        if (window.game) {
            window.game.setSpeed(val);
        }

        // Sliders
        const s1 = document.getElementById('speedSlider');
        const s2 = document.getElementById('hudSpeedSlider');
        const s3 = document.getElementById('pauseSpeedSlider');
        if (s1) s1.value = val;
        if (s2) s2.value = val;
        if (s3) s3.value = val;

        // Label in Pause modal
        const pauseDisplay = document.getElementById('pauseSpeedDisplay');
        if (pauseDisplay) pauseDisplay.textContent = `${val.toFixed(1)}x`;

        // Update active preset buttons
        document.querySelectorAll('.speed-preset-btn').forEach(b => {
            if (Math.abs(parseFloat(b.dataset.speed) - val) < 0.06) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    // Preset speed buttons in Start modal
    document.querySelectorAll('.speed-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            syncSpeed(speed);
        });
    });

    // HUD Speed Slider
    document.getElementById('hudSpeedSlider')?.addEventListener('input', (e) => {
        syncSpeed(e.target.value);
    });

    // Pause Speed Slider
    document.getElementById('pauseSpeedSlider')?.addEventListener('input', (e) => {
        syncSpeed(e.target.value);
    });

    // Main Speed Slider
    document.getElementById('speedSlider')?.addEventListener('input', (e) => {
        syncSpeed(e.target.value);
    });

    // Initial setup of operations and modes
    updateOperationsUI();
    updateGameModeUI('classic');

    // Start Game Button
    document.getElementById('startPlayBtn')?.addEventListener('click', () => {
        window.mathEngine.setOperations(selectedOperations);
        window.mathEngine.setTables(selectedTables);
        window.game.setSunMultiplesMode(sunMultiplesMode);
        window.game.startGame(1);
    });

    // Next Wave Button
    document.getElementById('nextWaveBtn')?.addEventListener('click', () => {
        const nextWave = (window.game.currentWave || 1) + 1;
        window.game.startGame(nextWave);
    });

    // Retry / Try Again Button
    document.getElementById('retryBtn')?.addEventListener('click', () => {
        window.game.startGame(1);
    });

    // Pause / Resume Buttons
    document.getElementById('pauseBtn')?.addEventListener('click', () => {
        window.game.togglePause();
    });

    document.getElementById('resumeBtn')?.addEventListener('click', () => {
        window.game.togglePause();
    });

    document.getElementById('restartBtn')?.addEventListener('click', () => {
        window.game.gameState = 'menu';
        window.soundEffects.stopBGM();
        document.getElementById('pauseModal').classList.add('hidden');
        document.getElementById('startModal').classList.remove('hidden');
    });

    // Mute Button Toggle
    const muteBtn = document.getElementById('muteBtn');
    muteBtn?.addEventListener('click', () => {
        const isMuted = window.soundEffects.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
        muteBtn.style.background = isMuted ? '#b71c1c' : '';
    });

    // Report Card Modal & Rendering
    function renderReportCard() {
        const grid = document.getElementById('reportCardGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const summary = window.mathEngine.getSummary();
        const stats = summary.tableAccuracy;

        for (let i = 1; i <= 12; i++) {
            const data = stats[i] || { correct: 0, total: 0 };
            const card = document.createElement('div');
            card.style.background = 'rgba(0, 0, 0, 0.4)';
            card.style.border = '2px solid #78909c';
            card.style.borderRadius = '10px';
            card.style.padding = '8px';
            card.style.textAlign = 'center';

            let pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : null;
            let statusColor = '#B0BEC5';
            let badgeText = 'Not Practiced';

            if (pct !== null) {
                badgeText = `${pct}% (${data.correct}/${data.total})`;
                if (pct >= 85) statusColor = '#4CAF50'; // Green
                else if (pct >= 65) statusColor = '#FFB300'; // Yellow
                else statusColor = '#E53935'; // Red
            }

            let opSym = 'Fact';
            if (selectedOperations.length === 1) {
                if (selectedOperations.includes('addition')) opSym = '+';
                else if (selectedOperations.includes('subtraction')) opSym = '−';
                else if (selectedOperations.includes('multiplication')) opSym = '×';
                else if (selectedOperations.includes('division')) opSym = '÷';
            } else if (selectedOperations.length === 2 && selectedOperations.includes('multiplication') && selectedOperations.includes('division')) {
                opSym = '×/÷';
            } else if (selectedOperations.length === 2 && selectedOperations.includes('addition') && selectedOperations.includes('subtraction')) {
                opSym = '+/−';
            } else if (selectedOperations.length === 4) {
                opSym = 'Math';
            }

            card.innerHTML = `
                <div style="font-size: 18px; font-weight: 900; color: #FFEB3B;">${opSym} ${i}</div>
                <div style="font-size: 13px; font-weight: bold; color: ${statusColor}; margin-top: 4px;">${badgeText}</div>
            `;
            grid.appendChild(card);
        }
    }

    document.getElementById('reportBtn')?.addEventListener('click', () => {
        renderReportCard();
        document.getElementById('reportModal').classList.remove('hidden');
    });

    document.getElementById('victoryReportBtn')?.addEventListener('click', () => {
        renderReportCard();
        document.getElementById('reportModal').classList.remove('hidden');
    });

    document.getElementById('closeReportBtn')?.addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('hidden');
    });
});
