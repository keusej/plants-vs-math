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
                desc.innerHTML = '🌻 <strong>Classic Mode:</strong> Defeated zombies drop standard sun orbs to buy powerful plant upgrades (Potato Mines, Double Repeaters, Super Peas, Cherry Bombs, and Super Hot Chili Peppers).';
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
    const startBtn = document.getElementById('startPlayBtn');
    const onStart = () => {
        window.soundEffects.unlock();
        window.mathEngine.setOperations(selectedOperations);
        window.mathEngine.setTables(selectedTables);
        window.game.setSunMultiplesMode(sunMultiplesMode);
        window.game.startGame(1);
    };
    startBtn?.addEventListener('click', onStart);
    startBtn?.addEventListener('touchend', () => { window.soundEffects.unlock(); }, { passive: true });

    // Next Wave Button
    const nextBtn = document.getElementById('nextWaveBtn');
    const onNext = () => {
        window.soundEffects.unlock();
        const nextWave = (window.game.currentWave || 1) + 1;
        window.game.startGame(nextWave);
    };
    nextBtn?.addEventListener('click', onNext);
    nextBtn?.addEventListener('touchend', () => { window.soundEffects.unlock(); }, { passive: true });

    // Retry / Try Again Button
    const retryBtn = document.getElementById('retryBtn');
    const onRetry = () => {
        window.soundEffects.unlock();
        window.game.startGame(1);
    };
    retryBtn?.addEventListener('click', onRetry);
    retryBtn?.addEventListener('touchend', () => { window.soundEffects.unlock(); }, { passive: true });

    // Pause / Resume Buttons
    document.getElementById('pauseBtn')?.addEventListener('click', () => {
        window.soundEffects.unlock();
        window.game.togglePause();
    });

    document.getElementById('resumeBtn')?.addEventListener('click', () => {
        window.soundEffects.unlock();
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
    const updateMuteUI = (isMuted) => {
        const icon = document.getElementById('muteIcon');
        if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
        const label = muteBtn?.querySelector('.btn-word-label');
        if (label) label.textContent = isMuted ? ' Muted' : ' Sound';
        if (muteBtn) muteBtn.style.background = isMuted ? '#b71c1c' : '';
    };
    muteBtn?.addEventListener('click', () => {
        window.soundEffects.unlock();
        const isMuted = window.soundEffects.toggleMute();
        updateMuteUI(isMuted);
    });
    muteBtn?.addEventListener('touchend', () => {
        window.soundEffects.unlock();
    }, { passive: true });

    // Speed HUD Tap to Cycle (great for mobile portrait)
    document.querySelector('.speed-control-hud')?.addEventListener('click', (e) => {
        if (e.target.id === 'hudSpeedSlider') return;
        const speeds = [0.5, 0.75, 1.0, 1.35];
        const current = window.game ? window.game.speedMultiplier : 0.5;
        let nextIdx = speeds.findIndex(s => Math.abs(s - current) < 0.05) + 1;
        if (nextIdx >= speeds.length || nextIdx < 0) nextIdx = 0;
        syncSpeed(speeds[nextIdx]);
    });

    // Report Card Modal & Rendering
    function renderReportCard() {
        const grid = document.getElementById('reportCardGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const summary = window.mathEngine.getSummary();

        // Populate High-Level Overall Statistics
        const accElem = document.getElementById('reportOverallAccuracy');
        const totElem = document.getElementById('reportOverallTotal');
        const strElem = document.getElementById('reportBestStreak');

        if (accElem) {
            if (summary.totalAnswered > 0) {
                accElem.textContent = `${summary.accuracy}%`;
                if (summary.accuracy >= 85) accElem.style.color = '#4CAF50';
                else if (summary.accuracy >= 65) accElem.style.color = '#FFB300';
                else accElem.style.color = '#FF5252';
            } else {
                accElem.textContent = '--';
                accElem.style.color = '#B0BEC5';
            }
        }
        if (totElem) {
            totElem.textContent = `${summary.correct} / ${summary.totalAnswered}`;
        }
        if (strElem) {
            strElem.textContent = `${summary.maxStreak}`;
        }

        const stats = summary.tableAccuracy;

        for (let i = 1; i <= 12; i++) {
            const data = stats[i] || { correct: 0, total: 0 };
            const card = document.createElement('div');
            card.className = 'report-fact-card';

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
                <div class="report-card-title">${opSym} ${i}</div>
                <div class="report-card-stat" style="color: ${statusColor};">${badgeText}</div>
            `;
            grid.appendChild(card);
        }
    }

    const openReportModal = () => {
        window.soundEffects?.unlock();
        renderReportCard();
        document.getElementById('reportModal')?.classList.remove('hidden');
    };

    document.getElementById('reportBtn')?.addEventListener('click', openReportModal);
    document.getElementById('victoryReportBtn')?.addEventListener('click', openReportModal);
    document.getElementById('gameOverReportBtn')?.addEventListener('click', openReportModal);
    document.getElementById('pauseReportBtn')?.addEventListener('click', openReportModal);

    document.getElementById('closeReportBtn')?.addEventListener('click', () => {
        document.getElementById('reportModal')?.classList.add('hidden');
    });

    // Safari Tips Modal Handlers
    const safariTipsModal = document.getElementById('safariTipsModal');
    const openSafariTips = () => {
        window.soundEffects?.unlock();
        safariTipsModal?.classList.remove('hidden');
    };
    const closeSafariTips = () => {
        safariTipsModal?.classList.add('hidden');
    };

    document.getElementById('startSafariHelpBtn')?.addEventListener('click', openSafariTips);
    document.getElementById('pauseSafariTipsBtn')?.addEventListener('click', openSafariTips);
    document.getElementById('closeSafariTipsBtn')?.addEventListener('click', closeSafariTips);

    // Header Fullscreen Button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn?.addEventListener('click', () => {
        window.soundEffects?.unlock();
        const doc = document;
        const docEl = doc.documentElement;
        const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        const exitFs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;

        const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (isFs) {
            if (exitFs) exitFs.call(doc);
        } else if (requestFs) {
            requestFs.call(docEl).catch(() => {
                openSafariTips();
            });
        } else {
            // iOS Safari on iPhone lacks Element.requestFullscreen API
            openSafariTips();
        }
    });

    // Check Updates / Reload Handlers (forces fresh cache for pinned Home Screen Web Apps)
    const reloadWithFreshCache = (e) => {
        window.soundEffects?.unlock();
        const btn = e?.currentTarget;
        if (btn) {
            btn.textContent = 'Checking for Updates... 🔄';
            btn.style.opacity = '0.75';
            btn.style.pointerEvents = 'none';
        }

        // Clear CacheStorage API if available
        if ('caches' in window) {
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
        }

        // Unregister any Service Workers if registered
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                for (let r of regs) r.unregister();
            }).catch(() => {});
        }

        const cleanUrl = window.location.origin + window.location.pathname;
        setTimeout(() => {
            window.location.replace(cleanUrl + '?t=' + Date.now());
        }, 150);
    };

    document.getElementById('startTopUpdateBtn')?.addEventListener('click', reloadWithFreshCache);
    document.getElementById('startUpdateBtn')?.addEventListener('click', reloadWithFreshCache);
    document.getElementById('startRefreshBtn')?.addEventListener('click', reloadWithFreshCache);
    document.getElementById('pauseRefreshBtn')?.addEventListener('click', reloadWithFreshCache);
});
