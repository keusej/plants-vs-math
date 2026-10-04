/**
 * Plants vs. Math - UI & Menu Controller
 * Handles table selection buttons, difficulty/speed throttle synchronization,
 * sound toggles, and report card visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current selected tables (1-12)
    let selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let selectedAddSubRange = 'within20'; // 'within10', 'within20', 'tens', 'within50', 'within100'

    function rebuildTableGrid(maxCount = 12, symbol = '×') {
        const grid = document.getElementById('tableSelectorGrid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 1; i <= maxCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'table-btn';
            if (selectedTables.includes(i)) {
                btn.classList.add('active');
            }
            btn.textContent = `${symbol} ${i}`;
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
                if (window.mathEngine) {
                    window.mathEngine.setTables(selectedTables);
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
        if (window.mathEngine) {
            window.mathEngine.setTables(selectedTables);
        }
    }

    // Preset Buttons
    document.getElementById('presetAll')?.addEventListener('click', () => {
        const hasMul = selectedOperations.includes('multiplication');
        const hasDiv = selectedOperations.includes('division');
        if (!hasMul && !hasDiv && selectedAddSubRange === 'within10') {
            selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else {
            selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
        updateTableButtons();
    });

    document.getElementById('presetBeginner')?.addEventListener('click', () => {
        const hasMul = selectedOperations.includes('multiplication');
        const hasDiv = selectedOperations.includes('division');
        if (!hasMul && !hasDiv) {
            selectedTables = [1, 2];
        } else {
            selectedTables = [1, 2, 5, 10];
        }
        updateTableButtons();
    });

    document.getElementById('presetHard')?.addEventListener('click', () => {
        const hasMul = selectedOperations.includes('multiplication');
        const hasDiv = selectedOperations.includes('division');
        if (!hasMul && !hasDiv) {
            selectedTables = [1, 2, 5, 10];
        } else {
            selectedTables = [6, 7, 8, 9, 12];
        }
        updateTableButtons();
    });

    // Skill Range Buttons (within10, within20, tens, within50, within100)
    document.querySelectorAll('.skill-range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAddSubRange = btn.dataset.range || 'within20';
            if (selectedAddSubRange === 'within10') {
                if (selectedTables.length > 2 && selectedTables.some(t => t > 10)) {
                    selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                }
            } else if (selectedAddSubRange === 'within20') {
                if (selectedTables.length > 2 && selectedTables.length < 12) {
                    selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                }
            }
            if (window.mathEngine) {
                window.mathEngine.setAddSubtractRange(selectedAddSubRange);
            }
            updateOperationsUI();
        });
    });

    // Math Operations Selection: any combination of addition, subtraction, multiplication, division
    let selectedOperations = ['addition', 'subtraction', 'multiplication', 'division'];
    let sunMultiplesMode = false;

    function updateOperationsUI() {
        if (window.mathEngine) {
            window.mathEngine.setOperations(selectedOperations);
            window.mathEngine.setAddSubtractRange(selectedAddSubRange);
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
        const isPureAddSub = (!hasMul && !hasDiv) && (hasAdd || hasSub);

        if (selectedOperations.length === 4) symbol = 'Math';
        else if (hasMul && hasDiv && !hasAdd && !hasSub) symbol = '×/÷';
        else if (hasAdd && hasSub && !hasMul && !hasDiv) symbol = '+/−';
        else if (hasAdd && !hasSub && !hasMul && !hasDiv) symbol = '+';
        else if (hasSub && !hasAdd && !hasMul && !hasDiv) symbol = '−';
        else if (hasMul && !hasAdd && !hasSub && !hasDiv) symbol = '×';
        else if (hasDiv && !hasAdd && !hasSub && !hasMul) symbol = '÷';
        else symbol = 'Fact';

        const tableSectionLabel = document.getElementById('tableSectionLabel');
        const addSubRangeGroup = document.getElementById('addSubRangeGroup');
        const tablePresetsContainer = document.getElementById('tablePresetsContainer');
        const tableSelectorGrid = document.getElementById('tableSelectorGrid');
        const rangeDescriptionHint = document.getElementById('rangeDescriptionHint');
        const presetAll = document.getElementById('presetAll');
        const presetBeginner = document.getElementById('presetBeginner');
        const presetHard = document.getElementById('presetHard');

        // Update range button active states
        document.querySelectorAll('.skill-range-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === selectedAddSubRange);
        });

        if (isPureAddSub) {
            // Adaptive Smart Menu for young learners & mental math
            if (tableSectionLabel) tableSectionLabel.textContent = 'Addition & Subtraction Skill Level';
            if (addSubRangeGroup) addSubRangeGroup.classList.remove('hidden');

            const rangeHints = {
                within10: '🌱 <strong>Within 10 (Intro):</strong> Perfect for Kindergarten & 1st Grade! Adding and subtracting with sums up to 10 (e.g. 4 + 3 = 7, 9 − 4 = 5).',
                within20: '🌿 <strong>Facts to 20 (Standard):</strong> 1st & 2nd Grade standard. Single-digit fact families and sums up to 20 (e.g. 8 + 7 = 15, 14 − 8 = 6).',
                tens: '🔟 <strong>Tens (10–90):</strong> Place-value confidence building! Practice round tens with zero clutter (e.g. 30 + 40 = 70, 80 − 30 = 50).',
                within50: '🌻 <strong>Up to 50:</strong> Intro to two-digit mental math & regrouping (e.g. 26 + 18 = 44, 42 − 17 = 25).',
                within100: '⚡ <strong>Up to 100:</strong> Advanced two-digit mental math challenge with regrouping (e.g. 48 + 37 = 85, 91 − 45 = 46).'
            };

            if (rangeDescriptionHint) {
                rangeDescriptionHint.innerHTML = rangeHints[selectedAddSubRange] || rangeHints.within20;
                rangeDescriptionHint.classList.remove('hidden');
            }

            if (selectedAddSubRange === 'within10') {
                if (tablePresetsContainer) tablePresetsContainer.classList.remove('hidden');
                if (presetAll) presetAll.textContent = 'All (1-10)';
                if (presetBeginner) presetBeginner.textContent = 'Just 1 & 2';
                if (presetHard) presetHard.textContent = 'Doubles / Easy (1, 2, 5)';
                if (tableSelectorGrid) tableSelectorGrid.classList.remove('hidden');
                rebuildTableGrid(10, symbol);
            } else if (selectedAddSubRange === 'within20') {
                if (tablePresetsContainer) tablePresetsContainer.classList.remove('hidden');
                if (presetAll) presetAll.textContent = 'All (1-12)';
                if (presetBeginner) presetBeginner.textContent = 'Just 1 & 2';
                if (presetHard) presetHard.textContent = 'Easy (1, 2, 5, 10)';
                if (tableSelectorGrid) tableSelectorGrid.classList.remove('hidden');
                rebuildTableGrid(12, symbol);
            } else {
                // 'tens', 'within50', 'within100' -> Hide grid to keep UI clean and uncluttered!
                if (tablePresetsContainer) tablePresetsContainer.classList.add('hidden');
                if (tableSelectorGrid) tableSelectorGrid.classList.add('hidden');
            }
        } else {
            // Multiplication / Division is active (Times Tables mode)
            if (tableSectionLabel) tableSectionLabel.textContent = 'Select Tables to Practice (1 to 12)';
            if (tablePresetsContainer) tablePresetsContainer.classList.remove('hidden');
            if (presetAll) presetAll.textContent = 'All (1-12)';
            if (presetBeginner) presetBeginner.textContent = 'Easy (1, 2, 5, 10)';
            if (presetHard) presetHard.textContent = 'Tricky (6, 7, 8, 9, 12)';
            if (tableSelectorGrid) tableSelectorGrid.classList.remove('hidden');
            rebuildTableGrid(12, symbol);

            if (hasAdd || hasSub) {
                // Mixed mode: show compact range selection for addition/subtraction difficulty
                if (addSubRangeGroup) addSubRangeGroup.classList.remove('hidden');
                if (rangeDescriptionHint) {
                    const rLabels = {
                        within10: 'Within 10',
                        within20: 'Facts to 20',
                        tens: 'Round Tens',
                        within50: 'Up to 50',
                        within100: 'Up to 100'
                    };
                    rangeDescriptionHint.innerHTML = `⭐ <strong>Mixed Practice:</strong> Times tables use the 1–12 grid below. Addition/subtraction uses <strong>${rLabels[selectedAddSubRange] || 'Facts to 20'}</strong>.`;
                    rangeDescriptionHint.classList.remove('hidden');
                }
            } else {
                if (addSubRangeGroup) addSubRangeGroup.classList.add('hidden');
                if (rangeDescriptionHint) rangeDescriptionHint.classList.add('hidden');
            }
        }

        // Header Title
        const headerTitle = document.getElementById('headerGameTitle');
        if (headerTitle) {
            if (selectedOperations.length === 4) {
                headerTitle.textContent = 'Plants vs. Math: All Operations (+, −, ×, ÷)';
            } else if (hasMul && !hasDiv && !hasAdd && !hasSub) {
                headerTitle.textContent = 'Plants vs. Math: Times Tables';
            } else if (hasDiv && !hasMul && !hasAdd && !hasSub) {
                headerTitle.textContent = 'Plants vs. Math: Division Facts';
            } else if (isPureAddSub) {
                const rangeTitles = {
                    within10: 'Within 10',
                    within20: 'Facts to 20',
                    tens: 'Tens (10..90)',
                    within50: 'Two-Digit to 50',
                    within100: 'Two-Digit to 100'
                };
                const rName = rangeTitles[selectedAddSubRange] || 'Facts to 20';
                if (hasAdd && hasSub) {
                    headerTitle.textContent = `Plants vs. Math: Add & Subtract (${rName})`;
                } else if (hasAdd) {
                    headerTitle.textContent = `Plants vs. Math: Addition (${rName})`;
                } else {
                    headerTitle.textContent = `Plants vs. Math: Subtraction (${rName})`;
                }
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

    // Starting Level Selector (Defaults to Level 1)
    let selectedStartingLevel = 1;
    const levelBtns = document.querySelectorAll('.level-btn');
    const levelDesc = document.getElementById('levelDescription');
    const levelDescriptions = {
        1: "🌱 <strong>Level 1:</strong> Gentle introduction with 4 standard walkers. Great for warming up!",
        2: "🚩 <strong>Level 2:</strong> Flag Zombie leads the assault, introducing Conehead Zombies!",
        3: "🛡️ <strong>Level 3:</strong> Faster assault with mixed Conehead squads and Flag bearer.",
        4: "🪣 <strong>Level 4:</strong> Heavy Buckethead Zombies arrive! Tough metal armor takes multiple hits.",
        5: "🧟 <strong>Level 5 (BOSS BATTLE):</strong> Giant Gargantuar Zombie stomps the lawn and hurls Imps!",
        6: "⚡ <strong>Level 6:</strong> Rapid mixed wave with swift spawns and high zombie density.",
        7: "🧟 <strong>Level 7:</strong> Armored brigade! Multiple Bucketheads and Coneheads marching in force.",
        8: "🔥 <strong>Level 8:</strong> Intense onslaught requiring fast math recall and heavy lawn defenses.",
        9: "💀 <strong>Level 9:</strong> Massive swarm of tough zombies storming every lawn lane!",
        10: "👑 <strong>Level 10 (MEGA BOSS):</strong> Dr. Zomboss in his giant Zombot Mech! Glowing headlight eyes, razor teeth, and crushing metal fists!"
    };

    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.blur();
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            levelBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStartingLevel = parseInt(btn.dataset.level, 10) || 1;
            if (levelDesc && levelDescriptions[selectedStartingLevel]) {
                levelDesc.innerHTML = levelDescriptions[selectedStartingLevel];
            }
        });
    });

    // Start Game Button
    const startBtn = document.getElementById('startPlayBtn');
    const onStart = () => {
        window.soundEffects.unlock();
        window.mathEngine.setOperations(selectedOperations);
        window.mathEngine.setAddSubtractRange(selectedAddSubRange);
        window.mathEngine.setTables(selectedTables);
        window.game.setSunMultiplesMode(sunMultiplesMode);
        window.game.startGame(selectedStartingLevel, true);
    };
    startBtn?.addEventListener('click', onStart);
    startBtn?.addEventListener('touchend', () => { window.soundEffects.unlock(); }, { passive: true });

    // Next Wave Button
    const nextBtn = document.getElementById('nextWaveBtn');
    const onNext = () => {
        window.soundEffects.unlock();
        const nextWave = (window.game.currentWave || 1) + 1;
        window.game.startGame(nextWave, false);
    };
    nextBtn?.addEventListener('click', onNext);
    nextBtn?.addEventListener('touchend', () => { window.soundEffects.unlock(); }, { passive: true });

    // Retry / Try Again Button
    const retryBtn = document.getElementById('retryBtn');
    const onRetry = () => {
        window.soundEffects.unlock();
        window.mathEngine.setOperations(selectedOperations);
        window.mathEngine.setAddSubtractRange(selectedAddSubRange);
        window.mathEngine.setTables(selectedTables);
        window.game.startGame(selectedStartingLevel || 1, true);
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
        fullscreenBtn.blur();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
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

    // Clear button focus when entering/exiting fullscreen so Enter key won't re-trigger it
    const clearFullscreenFocus = () => {
        fullscreenBtn?.blur();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    };
    document.addEventListener('fullscreenchange', clearFullscreenFocus);
    document.addEventListener('webkitfullscreenchange', clearFullscreenFocus);
    document.addEventListener('mozfullscreenchange', clearFullscreenFocus);
    document.addEventListener('msfullscreenchange', clearFullscreenFocus);

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
