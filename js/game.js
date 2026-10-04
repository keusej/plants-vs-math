/**
 * Plants vs. Math - Game Core Engine
 * Manages game state, waves, lanes, collision detection, speed throttling, and HUD.
 */

class MathDefenseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Dimensions
        this.baseWidth = 960;
        this.baseHeight = 540;
        this.scale = 1;

        // Game Settings & State
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'victory', 'gameover'
        this.speedMultiplier = 1.0; // Difficulty throttle (0.4x - 2.5x)
        this.laneCount = 3;
        this.laneHeights = [];
        this.defenseX = 220; // Where zombies stop and attack plants
        this.mowerX = 100;
        this.houseX = 60; // Beyond this is game over if no mower

        // Entities
        this.peashooters = [];
        this.zombies = [];
        this.peas = [];
        this.pendingPeas = [];
        this.lawnmowers = [];
        this.particles = new ParticleSystem();

        // Wave Management
        this.currentWave = 1;
        this.totalWaves = 5;
        this.zombiesToSpawn = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3.5;
        this.waveTotalZombies = 0;
        this.waveKilledZombies = 0;

        // Player Stats & Health
        this.score = 0;
        this.sun = 0;
        this.suns = [];
        this.cherryBombs = [];
        this.chiliPeppers = [];
        this.potatoMines = [];
        this.selectedSeed = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOnCanvas = false;
        this.plantHealth = 100; // Shared defense health or per plant
        this.maxPlantHealth = 100;

        // Input
        this.currentInput = '';
        this.targetZombie = null;
        this.allMowersDeployed = false;
        this.waveHitsTaken = 0;
        // Multiples Mode Settings
        this.sunMultiplesMode = false;
        this.currentMultipleTarget = 2; // 2 -> 5

        // Timers & Loop
        this.lastTime = performance.now();
        this.screenShake = 0;
        this.sunflowerAngle = 0;

        this.initCanvas();
        this.setupEventListeners();
        this.setSpeed(0.5);
    }

    setSunMultiplesMode(enabled) {
        this.sunMultiplesMode = Boolean(enabled);
        const badge = document.getElementById('multiplesTargetHud');
        const numSpan = document.getElementById('targetMultipleNum');
        if (this.sunMultiplesMode) {
            if (numSpan) numSpan.textContent = this.currentMultipleTarget;
            if (badge) badge.classList.remove('hidden');
        } else {
            if (badge) badge.classList.add('hidden');
        }
    }

    initCanvas() {
        const resize = () => {
            const container = this.canvas.parentElement;
            if (!container) return;
            const containerW = container.clientWidth;
            const isLandscape = window.innerWidth > window.innerHeight;

            const header = document.querySelector('.game-header');
            const headerH = header ? header.offsetHeight : 30;

            // In landscape, strictly fit within available screen height (between header & bottom safe area)
            let maxH;
            if (isLandscape && window.innerHeight <= 700) {
                maxH = Math.max(160, window.innerHeight - headerH - 14);
            } else {
                maxH = window.innerHeight * 0.65;
            }

            // Fit 16:9 ratio within container width AND available height
            let h = maxH;
            let w = h * (this.baseWidth / this.baseHeight);

            if (w > containerW) {
                w = containerW;
                h = w * (this.baseHeight / this.baseWidth);
            }
            if (h > maxH) {
                h = maxH;
                w = h * (this.baseWidth / this.baseHeight);
            }

            w = Math.floor(w);
            h = Math.floor(h);

            this.canvas.width = this.baseWidth;
            this.canvas.height = this.baseHeight;
            this.scale = w / this.baseWidth;

            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;

            // Calculate lane centers
            const grassTop = 130;
            const grassBottom = this.baseHeight;
            const laneH = (grassBottom - grassTop) / this.laneCount;
            this.laneHeights = [];
            for (let i = 0; i < this.laneCount; i++) {
                this.laneHeights.push(grassTop + laneH * (i + 0.5));
            }
        };

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => {
            setTimeout(resize, 150);
            setTimeout(resize, 400);
        });
        resize();
    }

    setupEventListeners() {
        // Physical Keyboard Input
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;

            if (e.key >= '0' && e.key <= '9') {
                this.appendDigit(e.key);
            } else if (e.key === 'Backspace') {
                this.backspace();
            } else if (e.key === 'Enter') {
                this.submitAnswer();
            } else if (e.key === 'c' || e.key === 'C') {
                this.clearInput();
            } else if (e.key === 'Escape') {
                if (this.selectedSeed) {
                    this.selectedSeed = null;
                    this.updateHUD();
                } else {
                    this.togglePause();
                }
            }
        });

        // Mouse & Touch tracking on Canvas for placement previews
        const updateCoords = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.baseWidth / rect.width;
            const scaleY = this.baseHeight / rect.height;
            this.mouseX = (clientX - rect.left) * scaleX;
            this.mouseY = (clientY - rect.top) * scaleY;
            this.isMouseOnCanvas = true;
        };

        this.canvas.addEventListener('mousemove', (e) => {
            updateCoords(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length > 0) {
                updateCoords(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                updateCoords(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseOnCanvas = false;
        });

        this.canvas.addEventListener('touchend', () => {
            setTimeout(() => { this.isMouseOnCanvas = false; }, 350);
        }, { passive: true });

        // Mouse Click / Tap on Canvas: Collect Sun or Plant Defense
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState !== 'playing') return;

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.baseWidth / rect.width;
            const scaleY = this.baseHeight / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            // 1. Check if clicking on any floating SunOrb to collect it manually
            for (let i = this.suns.length - 1; i >= 0; i--) {
                const sun = this.suns[i];
                if (!sun.collected && !sun.dead && !sun.fading && sun.containsPoint(clickX, clickY)) {
                    if (sun.isMultiple) {
                        this.handleMultipleSunClick(sun);
                        return;
                    } else {
                        sun.collect();
                        return;
                    }
                }
            }

            // 2. If Potato Mine is selected, snap to lane cell and plant it!
            if (this.selectedSeed === 'potatomine') {
                if (this.sun >= 3) {
                    const grassTop = 130;
                    const grassBottom = this.baseHeight;
                    const totalLawnH = grassBottom - grassTop;
                    const laneH = totalLawnH / this.laneCount;
                    const colW = 75;
                    const startX = this.defenseX - 70; // 150

                    let col = Math.floor((clickX - startX) / colW);
                    col = Math.max(1, Math.min(9, col));
                    let row = Math.floor((clickY - grassTop) / laneH);
                    row = Math.max(0, Math.min(this.laneCount - 1, row));

                    const cellLeft = startX + col * colW;
                    const cellCenterX = cellLeft + colW / 2;
                    const cellCenterY = this.laneHeights[row] + 12;

                    // Prevent duplicate planting in the same cell
                    const alreadyOccupied = this.potatoMines.some(p => !p.dead && p.lane === row && Math.abs(p.x - cellCenterX) < 20);
                    if (alreadyOccupied) {
                        window.soundEffects.playWrong();
                        this.particles.addFloatingText('Cell Occupied! 🥔', cellCenterX, cellCenterY - 30, '#FF8A80', 20);
                        return;
                    }

                    this.sun -= 3;
                    const pm = new PotatoMine(cellCenterX, cellCenterY, row);
                    this.potatoMines.push(pm);
                    window.soundEffects.playPlant();
                    this.particles.addFloatingText('Potato Mine Planted! 🥔', cellCenterX, cellCenterY - 30, '#FFD54F', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    this.particles.addFloatingText('Need 3 Sun!', clickX, clickY - 30, '#FFD54F', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                }
                return;
            }

            // 2.5 If Repeater Double Shot Upgrade is selected, upgrade clicked Peashooter!
            if (this.selectedSeed === 'repeater') {
                if (this.sun >= 5) {
                    // Find which peashooter was clicked
                    let targetPeashooter = null;
                    for (let i = 0; i < this.laneCount; i++) {
                        const p = this.peashooters[i];
                        if (!p || p.dead) continue;
                        const dist = Math.hypot(clickX - p.x, clickY - p.y);
                        const inColumn = (clickX >= this.defenseX - 75 && clickX <= this.defenseX + 25 && Math.abs(clickY - p.y) < 45);
                        if (dist < 45 || inColumn) {
                            targetPeashooter = p;
                            break;
                        }
                    }

                    if (!targetPeashooter) {
                        window.soundEffects.playWrong();
                        this.particles.addFloatingText('Click a Peashooter! 🌱', clickX, clickY - 30, '#FFEB3B', 20);
                        return;
                    }

                    if (targetPeashooter.isDouble) {
                        window.soundEffects.playWrong();
                        this.particles.addFloatingText('Already Upgraded! 🟢🟢', targetPeashooter.x + 35, targetPeashooter.y - 30, '#FFD54F', 20);
                        return;
                    }

                    this.sun -= 5;
                    targetPeashooter.isDouble = true;
                    this.selectedSeed = null;
                    window.soundEffects.playUpgrade();
                    this.particles.addSplat(targetPeashooter.x, targetPeashooter.y, '#76FF03', 25);
                    this.particles.addFloatingText('DOUBLE SHOT! 🟢🟢', targetPeashooter.x + 35, targetPeashooter.y - 35, '#76FF03', 24);
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    this.particles.addFloatingText('Need 5 Sun!', clickX, clickY - 30, '#FFD54F', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                }
                return;
            }

            // 2.7 If Super Pea Barrage is selected, fire row barrage in clicked lane!
            if (this.selectedSeed === 'superpea') {
                if (this.sun >= 8) {
                    const grassTop = 130;
                    const totalLawnH = this.baseHeight - grassTop;
                    const laneH = totalLawnH / this.laneCount;
                    let targetLane = Math.floor((clickY - grassTop) / laneH);
                    targetLane = Math.max(0, Math.min(this.laneCount - 1, targetLane));

                    this.sun -= 8;
                    this.triggerSuperPeaBarrage(targetLane);
                    this.selectedSeed = null;
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    this.particles.addFloatingText('Need 8 Sun!', clickX, clickY - 30, '#FFD54F', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                }
                return;
            }

            // 3. If Cherry Bomb is selected, plant it on the lawn!
            if (this.selectedSeed === 'cherrybomb') {
                if (this.sun >= 8) {
                    this.sun -= 8;
                    const cb = new CherryBomb(clickX, clickY);
                    this.cherryBombs.push(cb);
                    window.soundEffects.playCherrySizzle();
                    this.particles.addFloatingText('Cherry Bomb Planted!', clickX, clickY - 30, '#FF5252', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    this.particles.addFloatingText('Need 8 Sun!', clickX, clickY - 30, '#FFD54F', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                }
                return;
            }

            // 4. If Super Hot Chili Pepper is selected, plant it on the lawn!
            if (this.selectedSeed === 'chilipepper') {
                if (this.sun >= 12) {
                    this.sun -= 12;
                    const cp = new ChiliPepper(clickX, clickY);
                    this.chiliPeppers.push(cp);
                    window.soundEffects.playChiliSizzle();
                    this.particles.addFloatingText('🌶️ Chili Pepper Planted!', clickX, clickY - 30, '#FF3D00', 22);
                    this.selectedSeed = null;
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    this.particles.addFloatingText('Need 12 Sun!', clickX, clickY - 30, '#FFD54F', 20);
                    this.selectedSeed = null;
                    this.updateHUD();
                }
                return;
            }
        });

        // Right-click cancels Seed placement
        this.canvas.addEventListener('contextmenu', (e) => {
            if (this.selectedSeed) {
                e.preventDefault();
                this.selectedSeed = null;
                this.updateHUD();
            }
        });

        // Potato Mine Seed Card click handler (Cost: 3 ☀️)
        const potatoCard = document.getElementById('potatoMineSeed');
        if (potatoCard) {
            potatoCard.addEventListener('click', () => {
                if (this.gameState !== 'playing') return;
                if (this.sun >= 3) {
                    this.selectedSeed = (this.selectedSeed === 'potatomine' ? null : 'potatomine');
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    potatoCard.classList.add('shake-card');
                    setTimeout(() => potatoCard.classList.remove('shake-card'), 400);
                    this.particles.addFloatingText(`Need 3 ☀️! (Have ${this.sun})`, 130, 60, '#FFD54F', 18);
                }
            });
        }

        // Repeater Double Shot Seed Card click handler (Cost: 5 ☀️)
        const repeaterCard = document.getElementById('repeaterSeed');
        if (repeaterCard) {
            repeaterCard.addEventListener('click', () => {
                if (this.gameState !== 'playing') return;
                if (this.sun >= 5) {
                    this.selectedSeed = (this.selectedSeed === 'repeater' ? null : 'repeater');
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    repeaterCard.classList.add('shake-card');
                    setTimeout(() => repeaterCard.classList.remove('shake-card'), 400);
                    this.particles.addFloatingText(`Need 5 ☀️! (Have ${this.sun})`, 130, 85, '#FFD54F', 18);
                }
            });
        }

        // Super Pea Barrage Seed Card click handler (Cost: 8 ☀️)
        const superPeaCard = document.getElementById('superPeaSeed');
        if (superPeaCard) {
            superPeaCard.addEventListener('click', () => {
                if (this.gameState !== 'playing') return;
                if (this.sun >= 8) {
                    this.selectedSeed = (this.selectedSeed === 'superpea' ? null : 'superpea');
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    superPeaCard.classList.add('shake-card');
                    setTimeout(() => superPeaCard.classList.remove('shake-card'), 400);
                    this.particles.addFloatingText(`Need 8 ☀️! (Have ${this.sun})`, 130, 85, '#FFD54F', 18);
                }
            });
        }

        // Cherry Bomb Seed Card click handler (Cost: 8 ☀️)
        const cherryCard = document.getElementById('cherryBombSeed');
        if (cherryCard) {
            cherryCard.addEventListener('click', () => {
                if (this.gameState !== 'playing') return;
                if (this.sun >= 8) {
                    this.selectedSeed = (this.selectedSeed === 'cherrybomb' ? null : 'cherrybomb');
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    cherryCard.classList.add('shake-card');
                    setTimeout(() => cherryCard.classList.remove('shake-card'), 400);
                    this.particles.addFloatingText(`Need 8 ☀️! (Have ${this.sun})`, 130, 110, '#FFD54F', 18);
                }
            });
        }

        // Super Hot Chili Pepper Seed Card click handler (Cost: 12 ☀️)
        const chiliCard = document.getElementById('chiliPepperSeed');
        if (chiliCard) {
            chiliCard.addEventListener('click', () => {
                if (this.gameState !== 'playing') return;
                if (this.sun >= 12) {
                    this.selectedSeed = (this.selectedSeed === 'chilipepper' ? null : 'chilipepper');
                    this.updateHUD();
                } else {
                    window.soundEffects.playWrong();
                    chiliCard.classList.add('shake-card');
                    setTimeout(() => chiliCard.classList.remove('shake-card'), 400);
                    this.particles.addFloatingText(`Need 12 ☀️! (Have ${this.sun})`, 130, 135, '#FFD54F', 18);
                }
            });
        }

        // Speed Throttle Slider
        const speedSlider = document.getElementById('speedSlider');
        const speedDisplay = document.getElementById('speedDisplay');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.setSpeed(parseFloat(e.target.value));
            });
        }

        // On-screen Numpad Keys
        document.querySelectorAll('.keypad-btn').forEach(btn => {
            btn.addEventListener('touchend', () => {
                window.soundEffects.unlock();
            }, { passive: true });
            btn.addEventListener('click', (e) => {
                window.soundEffects.unlock();
                // Subtle tactile haptic pulse on mobile devices
                if (window.navigator?.vibrate) {
                    try { window.navigator.vibrate(12); } catch (_) {}
                }
                const val = btn.getAttribute('data-val');
                if (val === 'enter') {
                    this.submitAnswer();
                } else if (val === 'clear') {
                    this.clearInput();
                } else if (val === 'backspace') {
                    this.backspace();
                } else if (val !== null) {
                    this.appendDigit(val);
                }
            });
        });

        // Hint Button
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.showHint();
            });
        }
    }

    setSpeed(speed) {
        this.speedMultiplier = Math.max(0.3, Math.min(1.8, speed));
        const slider = document.getElementById('speedSlider');
        const display = document.getElementById('speedDisplay');
        const hudBadge = document.getElementById('hudSpeedBadge');

        if (slider) slider.value = this.speedMultiplier.toFixed(2);
        let speedText = `${this.speedMultiplier.toFixed(2)}x`;
        let speedLabel = "Steady";

        if (this.speedMultiplier <= 0.55) speedLabel = "🐌 Snail Pace (Learning)";
        else if (this.speedMultiplier <= 0.85) speedLabel = "🚶 Steady Pace";
        else if (this.speedMultiplier <= 1.15) speedLabel = "🏃 Brisk Pace";
        else speedLabel = "⚡ Fast Pace (Challenge)";

        if (display) display.textContent = `${speedText} (${speedLabel})`;
        if (hudBadge) hudBadge.textContent = `${this.speedMultiplier.toFixed(2)}x`;
    }

    startGame(wave = 1) {
        window.soundEffects.init();
        this.gameState = 'playing';
        this.currentWave = wave;
        this.plantHealth = this.maxPlantHealth;
        if (wave === 1) {
            this.sun = 0;
            this.score = 0;
            this.potatoMines = [];
            window.mathEngine?.resetStats();
        } else {
            // Potato bombs persist between levels so they don't go away if placed!
            this.potatoMines = this.potatoMines.filter(pm => !pm.dead);
        }
        this.suns = [];
        this.cherryBombs = [];
        this.chiliPeppers = [];
        this.selectedSeed = null;
        this.allMowersDeployed = false;
        this.waveHitsTaken = 0;

        // Setup Entities
        this.peashooters = [];
        this.lawnmowers = [];
        this.zombies = [];
        this.peas = [];
        this.pendingPeas = [];

        for (let i = 0; i < this.laneCount; i++) {
            const laneY = this.laneHeights[i];
            this.peashooters.push(new Peashooter(this.defenseX - 35, laneY - 10, i));
            this.lawnmowers.push(new Lawnmower(this.mowerX, laneY - 10, i));
        }

        // Setup Wave
        this.setupWave(this.currentWave);

        // Fetch First Problem
        this.nextMathProblem();

        // UI updates
        this.updateHUD();
        document.getElementById('startModal').classList.add('hidden');
        document.getElementById('victoryModal').classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('pauseModal').classList.add('hidden');

        window.soundEffects.playWaveWarning();
        window.soundEffects.startBGM();

        // Announce Wave
        if (this.currentWave % 5 === 0) {
            const extra = this.sunMultiplesMode ? ` - MULTIPLES OF ${this.currentMultipleTarget}!` : '';
            this.announceWave(`⚠️ WAVE ${this.currentWave}: BOSS BATTLE!${extra}`);
        } else {
            const extra = this.sunMultiplesMode ? ` - Collect Multiples of ${this.currentMultipleTarget}! ⭐` : '! Defend the Lawn!';
            this.announceWave(`Wave ${this.currentWave}${extra}`);
        }
    }

    setupWave(waveNum) {
        this.zombiesToSpawn = [];
        this.waveKilledZombies = 0;

        // In Sun Multiples mode, select a random multiple of 2 -> 5 that changes on each level
        if (this.sunMultiplesMode) {
            const multiplesPool = [2, 3, 4, 5].filter(m => m !== this.currentMultipleTarget);
            this.currentMultipleTarget = multiplesPool[Math.floor(Math.random() * multiplesPool.length)] || (Math.floor(Math.random() * 4) + 2);
            const badge = document.getElementById('multiplesTargetHud');
            const numSpan = document.getElementById('targetMultipleNum');
            if (numSpan) numSpan.textContent = this.currentMultipleTarget;
            if (badge) badge.classList.remove('hidden');
        } else {
            const badge = document.getElementById('multiplesTargetHud');
            if (badge) badge.classList.add('hidden');
        }

        const isBossWave = (waveNum % 5 === 0);

        if (isBossWave) {
            // Boss Wave: A few scouts to build streak/sun, then the Gargantuar Boss!
            const queue = ['regular', 'conehead', 'regular', 'buckethead', 'boss'];
            this.zombiesToSpawn = queue;
            this.waveTotalZombies = queue.length;
            this.spawnInterval = 4.5;
            this.spawnTimer = 1.0;
            return;
        }

        let regularCount = 3 + waveNum;
        let coneCount = Math.max(0, waveNum - 1);
        let bucketCount = Math.max(0, waveNum - 3);
        let hasFlag = waveNum >= 2;

        const queue = [];
        if (hasFlag) queue.push('flag');
        for (let i = 0; i < regularCount; i++) queue.push('regular');
        for (let i = 0; i < coneCount; i++) queue.push('conehead');
        for (let i = 0; i < bucketCount; i++) queue.push('buckethead');

        // Shuffle queue (except flag zombie leads near start)
        for (let i = queue.length - 1; i > 1; i--) {
            const j = 1 + Math.floor(Math.random() * i);
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }

        this.zombiesToSpawn = queue;
        this.waveTotalZombies = queue.length;
        // Gentler spawn rate scaling so zombies don't swarm the player
        this.spawnInterval = Math.max(3.6, 5.4 - waveNum * 0.25);
        this.spawnTimer = 1.0; // First zombie spawns quickly
    }

    nextMathProblem() {
        const prob = window.mathEngine.nextProblem();
        this.currentInput = '';
        this.updateInputDisplay();

        const problemText = document.getElementById('problemDisplay');
        if (problemText) {
            let opSymbol = '&times;';
            if (prob.op === '÷') opSymbol = '&divide;';
            else if (prob.op === '+') opSymbol = '+';
            else if (prob.op === '−' || prob.op === '-') opSymbol = '&minus;';
            problemText.innerHTML = `${prob.a} <span class="math-op">${opSymbol}</span> ${prob.b} = <span class="math-target">?</span>`;
        }

        const hintContainer = document.getElementById('hintBox');
        if (hintContainer) {
            hintContainer.classList.add('hidden');
            hintContainer.textContent = '';
        }
    }

    appendDigit(digit) {
        if (this.currentInput.length >= 4) return;
        this.currentInput += digit;
        this.updateInputDisplay();
    }

    backspace() {
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1);
            this.updateInputDisplay();
        }
    }

    clearInput() {
        this.currentInput = '';
        this.updateInputDisplay();
    }

    updateInputDisplay() {
        const inputElem = document.getElementById('answerInput');
        if (inputElem) {
            inputElem.textContent = this.currentInput || '_';
        }
    }

    submitAnswer() {
        if (!this.currentInput || this.gameState !== 'playing') return;

        const result = window.mathEngine.checkAnswer(this.currentInput);
        const cardElem = document.getElementById('flashCardContainer');

        if (result.isCorrect) {
            // Correct answer!
            window.soundEffects.playCorrect(result.streak);
            this.score += 100 + result.streak * 20;

            // Determine Pea Type based on Streak!
            let peaType = 'regular';
            if (result.streak >= 10) {
                peaType = 'ice';
                this.particles.addFloatingText('❄️ ICE PEA!', this.defenseX + 80, this.laneHeights[1], '#00E5FF', 24);
            } else if (result.streak >= 5) {
                peaType = 'fire';
                this.particles.addFloatingText('🔥 FIRE PEA!', this.defenseX + 80, this.laneHeights[1], '#FF5722', 24);
            } else if (result.streak >= 3) {
                this.particles.addFloatingText('⚡ COMBO x' + result.streak, this.defenseX + 60, this.laneHeights[1], '#FFD54F', 20);
            }

            // Fire Pellet at target zombie or front lane
            this.firePea(peaType);

            // Card green flash
            if (cardElem) {
                cardElem.classList.add('flash-correct');
                setTimeout(() => cardElem.classList.remove('flash-correct'), 300);
            }

            // Immediately present next question
            this.nextMathProblem();
        } else {
            // Incorrect answer
            window.soundEffects.playWrong();
            if (cardElem) {
                cardElem.classList.add('flash-wrong');
                setTimeout(() => cardElem.classList.remove('flash-wrong'), 400);
            }
            this.particles.addFloatingText('Try Again!', this.defenseX + 80, this.laneHeights[1], '#FF5252', 20);
            this.currentInput = '';
            this.updateInputDisplay();
        }

        this.updateHUD();
    }

    firePea(peaType = 'regular') {
        // Find zombie closest to the defense line (primary target)
        this.updateTargetZombie();

        let targetLane = 1; // Default to center lane
        if (this.targetZombie && !this.peashooters[this.targetZombie.lane]?.dead) {
            targetLane = this.targetZombie.lane;
        } else {
            // Pick a lane with an active peashooter
            const aliveShooters = this.peashooters.filter(p => !p.dead);
            if (aliveShooters.length > 0) {
                targetLane = aliveShooters[Math.floor(Math.random() * aliveShooters.length)].lane;
            } else {
                targetLane = Math.floor(Math.random() * this.laneCount);
            }
        }

        // Trigger Peashooter animation
        const peashooter = this.peashooters[targetLane];
        if (peashooter && !peashooter.dead) {
            peashooter.shoot();
        }

        // Sound effect
        const isFire = peaType === 'fire';
        const isIce = peaType === 'ice';
        window.soundEffects.playShoot(isFire, isIce);

        // Spawn pea projectile
        const spawnX = this.defenseX - 5;
        const spawnY = this.laneHeights[targetLane] - 14;
        this.peas.push(new Pea(spawnX, spawnY, targetLane, peaType));

        // If this Peashooter is upgraded to Double Shot, fire a second pea shortly after!
        if (peashooter && peashooter.isDouble) {
            this.pendingPeas.push({
                delay: 0.09,
                lane: targetLane,
                type: peaType,
                spawnX: spawnX,
                spawnY: spawnY
            });
        }
    }

    updateTargetZombie() {
        let closest = null;
        let minX = Infinity;

        for (const z of this.zombies) {
            if (!z.isDead && z.x < minX) {
                minX = z.x;
                closest = z;
            }
        }
        this.targetZombie = closest;
    }

    showHint() {
        const hintText = window.mathEngine.getHint();
        const hintContainer = document.getElementById('hintBox');
        if (hintContainer) {
            hintContainer.textContent = hintText;
            hintContainer.classList.remove('hidden');
        }
    }

    removePlant(lane) {
        const peashooter = this.peashooters[lane];
        if (peashooter && !peashooter.dead) {
            peashooter.dead = true;
            if (this.particles) {
                this.particles.addSplat(peashooter.x, peashooter.y, '#4CAF50', 20);
                this.particles.addSplat(peashooter.x, peashooter.y - 10, '#81C784', 12);
            }
        }
    }

    triggerSuperPeaBarrage(targetLane) {
        const shooter = this.peashooters[targetLane];
        const spawnX = (shooter && !shooter.dead) ? (shooter.x + 35) : (this.defenseX - 35);
        const spawnY = this.laneHeights[targetLane] - 10;

        // Calculate living non-boss zombie HP in this row
        let neededPeas = 0;
        let hasBoss = false;
        for (const z of this.zombies) {
            if (!z.isDead && z.lane === targetLane) {
                if (z.isBoss) {
                    hasBoss = true;
                } else {
                    neededPeas += Math.max(1, z.hp);
                }
            }
        }

        // "shoots enough peas to kill all zombies on the row, for a boss it just shoots one pea worth of damage"
        if (hasBoss) {
            neededPeas += 1;
        }

        // Fire at least 8 rapid peas so it looks/sounds like an epic Gatling barrage
        const peaCount = Math.max(8, neededPeas);
        const barrageId = Date.now() + Math.random();

        if (shooter && !shooter.dead) {
            shooter.superGlow = 2.0;
        }

        this.particles.addSplat(spawnX, spawnY, '#76FF03', 25);
        this.particles.addFloatingText('🫛 SUPER PEA BARRAGE! 🟢', spawnX + 45, spawnY - 35, '#76FF03', 24);
        this.screenShake = 10;
        window.soundEffects.playUpgrade();

        // Queue machine-gun burst of peas (50ms interval between each shot)
        for (let k = 0; k < peaCount; k++) {
            this.pendingPeas.push({
                delay: 0.06 + k * 0.05,
                lane: targetLane,
                type: 'super',
                isSuperBarrage: true,
                barrageId: barrageId,
                spawnX: spawnX,
                spawnY: spawnY
            });
        }
    }

    getDefendedLanes() {
        const intact = [];
        for (let i = 0; i < this.laneCount; i++) {
            const mower = this.lawnmowers[i];
            if (mower && mower.state === 'idle') {
                intact.push(i);
            }
        }
        return intact;
    }

    spawnZombie() {
        if (this.zombiesToSpawn.length === 0) return;

        const type = this.zombiesToSpawn.shift();

        // Only send zombies down lanes whose lawnmowers are still intact!
        const intactLanes = this.getDefendedLanes();
        const candidateLanes = intactLanes.length > 0 ? intactLanes : Array.from({length: this.laneCount}, (_, i) => i);

        if (type === 'boss') {
            // Gargantuar Boss prefers center lane if intact, otherwise any intact lane
            let lane = candidateLanes.includes(1) ? 1 : candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
            const spawnX = this.baseWidth + 40;
            const spawnY = this.laneHeights[lane] - 10;
            const boss = new BossZombie(spawnX, spawnY, lane, 14);
            this.zombies.push(boss);

            window.soundEffects.playBossRoar();
            this.screenShake = 14;
            this.announceWave('⚠️ GARGANTUAR HAS ENTERED! ⚠️');
            this.particles.addFloatingText('⚡ GARGANTUAR! ⚡', spawnX - 30, spawnY - 60, '#FF1744', 32);
            return;
        }

        if (type === 'imp') {
            const lane = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
            const spawnX = this.baseWidth + 25 + Math.random() * 30;
            const spawnY = this.laneHeights[lane] - 10;
            const imp = new ImpZombie(spawnX, spawnY, lane, 38);
            this.zombies.push(imp);
            return;
        }

        // Pick candidate lane with fewest zombies
        const laneCounts = new Array(this.laneCount).fill(0);
        this.zombies.forEach(z => {
            if (!z.isDead) laneCounts[z.lane]++;
        });

        let chosenLane = candidateLanes[0];
        let minCount = Infinity;
        for (const laneIdx of candidateLanes) {
            if (laneCounts[laneIdx] < minCount) {
                minCount = laneCounts[laneIdx];
                chosenLane = laneIdx;
            }
        }

        const spawnX = this.baseWidth + 30 + Math.random() * 40;
        const spawnY = this.laneHeights[chosenLane] - 10;
        // Gentler base speed (26 px/s down from 30) for smoother difficulty scaling
        this.zombies.push(new Zombie(spawnX, spawnY, chosenLane, type, 26));

        if (Math.random() < 0.35) {
            window.soundEffects.playZombieGroan();
        }
    }

    announceWave(text) {
        const banner = document.getElementById('waveBanner');
        if (banner) {
            banner.textContent = text;
            banner.classList.remove('hidden');
            banner.classList.add('banner-pop');
            setTimeout(() => {
                banner.classList.remove('banner-pop');
                banner.classList.add('hidden');
            }, 2500);
        }
    }

    checkMowerStatus() {
        const allDeployed = this.lawnmowers.every(m => m.state !== 'idle');
        if (allDeployed && !this.allMowersDeployed) {
            this.allMowersDeployed = true;
            this.screenShake = 12;
            this.announceWave('⚠️ ALL LAWNMOWERS DEPLOYED! DEFENSES LOST! ⚠️');
            this.particles.addFloatingText('ALL MOWERS LOST! (NO WIN)', this.baseWidth / 2, 220, '#FF1744', 28);
        }
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        this.sunflowerAngle += dt * 2.5;

        // Spawn timer
        if (this.zombiesToSpawn.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnZombie();
                this.spawnTimer = this.spawnInterval + (Math.random() * 1.5 - 0.75);
            }
        }

        // Update Peashooters
        for (const p of this.peashooters) {
            p.update(dt);
        }

        // Update Pending Peashooter Double Shots
        if (this.pendingPeas && this.pendingPeas.length > 0) {
            for (let i = this.pendingPeas.length - 1; i >= 0; i--) {
                const pp = this.pendingPeas[i];
                pp.delay -= dt;
                if (pp.delay <= 0) {
                    this.pendingPeas.splice(i, 1);
                    const shooter = this.peashooters[pp.lane];
                    if (shooter && !shooter.dead) {
                        shooter.shoot();
                    }
                    if (pp.type === 'super') {
                        window.soundEffects.playSuperPeaShoot();
                    } else {
                        const isFire = pp.type === 'fire';
                        const isIce = pp.type === 'ice';
                        window.soundEffects.playShoot(isFire, isIce);
                    }
                    this.peas.push(new Pea(pp.spawnX, pp.spawnY, pp.lane, pp.type, pp.isSuperBarrage || false, pp.barrageId || null));
                }
            }
        }

        // Update Peas & Check Collisions
        for (let i = this.peas.length - 1; i >= 0; i--) {
            const pea = this.peas[i];
            pea.update(dt);

            // Off screen
            if (pea.x > this.baseWidth + 50) {
                this.peas.splice(i, 1);
                continue;
            }

            // Check collision with zombies in same lane: target front-most living zombie
            let targetZ = null;
            let minZX = Infinity;
            for (const z of this.zombies) {
                const hitRadius = z.isBoss ? 45 : 28;
                if (!z.isDead && z.lane === pea.lane && Math.abs(z.x - pea.x) < hitRadius) {
                    // If this is a Super Barrage pea and z is a Boss who already took 1 pea damage from this barrage:
                    if (pea.isSuperBarrage && z.isBoss && z.lastSuperBarrageId === pea.barrageId) {
                        continue; // Bypasses boss to hit remaining zombies behind him!
                    }
                    if (z.x < minZX) {
                        minZX = z.x;
                        targetZ = z;
                    }
                }
            }

            if (targetZ) {
                const z = targetZ;
                // If hitting a Boss with a super barrage, record barrageId so subsequent peas do not hurt Boss again
                if (pea.isSuperBarrage && z.isBoss) {
                    z.lastSuperBarrageId = pea.barrageId;
                }
                // Hit!
                const hitResult = z.takeHit(pea.damage, pea.type === 'ice');
                window.soundEffects.playHit(hitResult.droppedArmor);

                const splatColor = pea.type === 'super' ? '#76FF03' : (pea.type === 'fire' ? '#FF5722' : (pea.type === 'ice' ? '#00E5FF' : '#76FF03'));
                this.particles.addSplat(pea.x + 8, pea.y, splatColor, z.isBoss ? 20 : 12);

                if (hitResult.droppedArmor) {
                    this.particles.addArmorPop(z.x, z.y - 20, z.type === 'conehead' ? 'cone' : 'bucket');
                    this.particles.addFloatingText('Armor Popped!', z.x, z.y - 40, '#FFD54F', 18);
                }

                if (hitResult.killed) {
                    this.waveKilledZombies++;
                    if (z.isBoss) {
                        this.score += 1500;
                        this.screenShake = 16;
                        window.soundEffects.playVictory();
                        this.particles.addFloatingText('👑 BOSS DEFEATED! +1500', z.x, z.y - 50, '#FFD700', 30);
                        // Drop 3 Sun Orbs!
                        this.spawnSun(z.x - 30, z.y - 15);
                        this.spawnSun(z.x, z.y + 10);
                        this.spawnSun(z.x + 30, z.y - 15);
                    } else {
                        this.score += 250;
                        this.particles.addFloatingText('+250', z.x, z.y - 20, '#FFEB3B', 22);
                        this.spawnSun(z.x, z.y);
                    }
                }

                this.peas.splice(i, 1);
                continue;
            }
        }

        // Update Zombies
        let anyAttacking = false;
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            z.update(dt, this.speedMultiplier, this.defenseX);

            // Check if Gargantuar is launching an Imp!
            if (z.isBoss && z.impThrowPending) {
                z.impThrowPending = false;
                window.soundEffects.playImpThrow();
                this.screenShake = 8;
                // Imp launches into an intact lane (preferring adjacent if intact)
                const intactLanes = this.getDefendedLanes();
                let impLane;
                if (intactLanes.length > 0) {
                    const adjacentIntact = intactLanes.filter(l => Math.abs(l - z.lane) === 1);
                    if (adjacentIntact.length > 0) {
                        impLane = adjacentIntact[Math.floor(Math.random() * adjacentIntact.length)];
                    } else if (intactLanes.includes(z.lane)) {
                        impLane = z.lane;
                    } else {
                        impLane = intactLanes[0];
                    }
                } else {
                    impLane = z.lane === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1;
                }
                const impX = Math.max(this.defenseX + 80, z.x - 140);
                const impY = this.laneHeights[impLane] - 10;
                const imp = new ImpZombie(impX, impY, impLane, 36);
                this.zombies.push(imp);
                this.waveTotalZombies++;
                this.particles.addFloatingText('IMP LAUNCHED! 🚀', impX, impY - 30, '#FF9100', 22);
                this.particles.addSplat(impX, impY, '#FFEB3B', 16);
            }

            if (z.isDead && z.deathTimer > 0.8) {
                this.zombies.splice(i, 1);
                continue;
            }

            // Zombie reaches defense line and chomps / smashes!
            if (z.isAttacking && !z.isDead) {
                anyAttacking = true;
                const attackInterval = z.isBoss ? 1.5 : 1.2;
                if (z.attackTimer >= attackInterval) {
                    z.attackTimer = 0;
                    if (z.isBoss) {
                        window.soundEffects.playBossThud();
                        this.plantHealth -= 14;
                        this.screenShake = 12;
                    } else {
                        window.soundEffects.playChomp();
                        this.plantHealth -= 6;
                        this.screenShake = 6;
                    }
                    this.waveHitsTaken++;
                    this.totalHitsTaken++;

                    // Hit flash on peashooter
                    if (this.peashooters[z.lane] && !this.peashooters[z.lane].dead) {
                        this.peashooters[z.lane].hitFlash = 0.2;
                    }

                    if (this.plantHealth <= 0) {
                        this.plantHealth = 0;
                        // Trigger Lawnmower in that lane!
                        const mower = this.lawnmowers[z.lane];
                        if (mower && mower.trigger()) {
                            window.soundEffects.playLawnmower();
                            this.removePlant(z.lane);
                            this.plantHealth = 30; // Emergency recovery!
                            this.particles.addFloatingText('LAWNMOWER RESCUE!', this.mowerX + 100, z.y, '#FF1744', 26);
                            this.checkMowerStatus();
                        } else {
                            // No lawnmower left -> Game Over!
                            this.triggerGameOver('breach');
                            return;
                        }
                    }
                }
            }

            // Zombie breached defense line past mower: triggers mower or game over
            if (z.x <= this.mowerX && !z.isDead) {
                const mower = this.lawnmowers[z.lane];
                if (mower && mower.trigger()) {
                    window.soundEffects.playLawnmower();
                    this.removePlant(z.lane);
                    this.checkMowerStatus();
                } else if (z.x <= this.houseX) {
                    this.triggerGameOver('breach');
                    return;
                }
            }
        }

        // Update Lawnmowers
        for (const mower of this.lawnmowers) {
            mower.update(dt, this.baseWidth);

            if (mower.state === 'moving') {
                // When the lawnmower goes down a lane, have the plant for that lane go away too!
                this.removePlant(mower.lane);

                // Kill all zombies in this lane in contact
                for (const z of this.zombies) {
                    if (!z.isDead && z.lane === mower.lane && Math.abs(z.x - mower.x) < 40) {
                        const hitResult = z.takeHit(999, false, true);
                        if (hitResult.killed) {
                            this.waveKilledZombies++;
                            this.particles.addSplat(z.x, z.y, '#76FF03', 24);
                            if (z.isBoss) {
                                this.score += 1500;
                                this.particles.addFloatingText('CRUSHED! +1500', z.x, z.y - 30, '#F44336', 28);
                                this.spawnSun(z.x - 20, z.y);
                                this.spawnSun(z.x + 20, z.y);
                            } else {
                                this.particles.addFloatingText('SPLAT!', z.x, z.y - 20, '#F44336', 22);
                                this.spawnSun(z.x, z.y);
                            }
                        }
                    }
                }
            }
        }

        // Update Cherry Bombs
        for (let i = this.cherryBombs.length - 1; i >= 0; i--) {
            const cb = this.cherryBombs[i];
            cb.update(dt);

            if (cb.isExploded && !cb.dead) {
                cb.dead = true;
                this.screenShake = 18;
                window.soundEffects.playCherryExplode();
                this.particles.addExplosion(cb.x, cb.y, cb.radius);

                // Blast zombies in radius!
                for (const z of this.zombies) {
                    if (!z.isDead) {
                        const dx = z.x - cb.x;
                        const dy = z.y - cb.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= cb.radius) {
                            const hitResult = z.takeHit(999);
                            if (hitResult.killed) {
                                this.waveKilledZombies++;
                                if (z.isBoss) {
                                    this.score += 1500;
                                    this.screenShake = 18;
                                    window.soundEffects.playVictory();
                                    this.particles.addFloatingText('BOSS BOOMED! +1500', z.x, z.y - 50, '#FFD700', 30);
                                    // Note: Cherry Bomb kills do NOT drop sun points to preserve challenge!
                                } else {
                                    this.score += 300;
                                    this.particles.addFloatingText('+300', z.x, z.y - 20, '#FFEB3B', 22);
                                    // Note: Cherry Bomb kills do NOT drop sun points to preserve challenge!
                                }
                            } else if (z.isBoss) {
                                // Boss took 6 damage from Cherry Bomb!
                                this.particles.addFloatingText('CRITICAL -6 HP!', z.x, z.y - 45, '#FF5252', 24);
                                this.particles.addExplosion(z.x, z.y, 40);
                            }
                        }
                    }
                }
                this.cherryBombs.splice(i, 1);
            }
        }

        // Update Super Hot Chili Peppers (Jalapeno Board Wipe)
        for (let i = this.chiliPeppers.length - 1; i >= 0; i--) {
            const cp = this.chiliPeppers[i];
            cp.update(dt);

            if (cp.isExploded && !cp.dead) {
                cp.dead = true;
                this.screenShake = 35; // Heavy seismic board-clearing shake
                window.soundEffects.playChiliExplode();
                this.particles.addChiliInferno(this.laneHeights, this.mowerX, this.baseWidth);

                // Blast and incinerate ALL active zombies across the entire board!
                for (const z of this.zombies) {
                    if (!z.isDead) {
                        const hitResult = z.takeHit(999, false, true); // true forces lethal damage even on boss!
                        if (hitResult.killed) {
                            this.waveKilledZombies++;
                            if (z.isBoss) {
                                this.score += 2000;
                                window.soundEffects.playVictory();
                                this.particles.addFloatingText('BOSS INCINERATED! +2000', z.x, z.y - 50, '#FFD700', 32);
                            } else {
                                this.score += 350;
                                this.particles.addFloatingText('+350', z.x, z.y - 20, '#FF5722', 22);
                            }
                            // Fiery explosion at each incinerated zombie
                            this.particles.addExplosion(z.x, z.y, 75);
                        }
                    }
                }
                this.chiliPeppers.splice(i, 1);
            }
        }

        // Update Potato Mines (Single-target detonation on step!)
        for (let i = this.potatoMines.length - 1; i >= 0; i--) {
            const mine = this.potatoMines[i];
            mine.update(dt);

            if (mine.dead) {
                this.potatoMines.splice(i, 1);
                continue;
            }

            // Check collision with zombies in the exact same lane
            for (const z of this.zombies) {
                const hitDist = z.isBoss ? 38 : 26;
                if (!z.isDead && z.lane === mine.lane && Math.abs(z.x - mine.x) < hitDist) {
                    // Detonate Potato Mine!
                    mine.dead = true;
                    this.screenShake = 12;
                    window.soundEffects.playPotatoExplode();
                    this.particles.addExplosion(mine.x, mine.y, 45);
                    this.particles.addFloatingText('SPUDOW! 🥔💥', mine.x, mine.y - 35, '#FFA000', 24);

                    // Deal lethal / critical damage ONLY to this specific stepping zombie
                    const hitResult = z.takeHit(999);
                    if (hitResult.killed) {
                        this.waveKilledZombies++;
                        if (z.isBoss) {
                            this.score += 1500;
                            this.screenShake = 18;
                            window.soundEffects.playVictory();
                            this.particles.addFloatingText('BOSS BLASTED! +1500', z.x, z.y - 50, '#FFD700', 30);
                            // Note: Potato Mine kills do NOT drop sun points to preserve challenge!
                        } else {
                            this.score += 250;
                            this.particles.addFloatingText('+250', z.x, z.y - 20, '#FFEB3B', 22);
                            // Note: Potato Mine kills do NOT drop sun points to preserve challenge!
                        }
                    } else if (z.isBoss) {
                        this.particles.addFloatingText('CRITICAL -6 HP!', z.x, z.y - 45, '#FF5252', 24);
                        this.particles.addExplosion(z.x, z.y, 35);
                    }

                    // Remove the mine and BREAK immediately so NO other zombie is hurt!
                    this.potatoMines.splice(i, 1);
                    break;
                }
            }
        }

        // Update Sun Orbs
        const isBossFight = (this.currentWave % 5 === 0) || this.zombies.some(z => z.isBoss && !z.isDead);
        for (let i = this.suns.length - 1; i >= 0; i--) {
            const sun = this.suns[i];

            // If boss fight is active, glide any hovering suns down to the lower target so their numbers stay visible
            if (isBossFight && sun.isMultiple && sun.state === 'hovering_top' && sun.floatY < 146) {
                sun.floatY += dt * 70;
                if (sun.floatY > 148) sun.floatY = 148;
            }

            sun.update(dt);

            if (sun.dead) {
                this.suns.splice(i, 1);
                continue;
            }

            if (sun.collected) {
                if (!sun.collectedOnFly) {
                    this.sun += 1;
                    window.soundEffects.playSunCollect();
                    this.particles.addFloatingText('+1 ☀️', 120, 50, '#FFEB3B', 24);
                }
                this.suns.splice(i, 1);
                this.updateHUD();
            }
        }

        // Update Particles
        this.particles.update(dt);

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 15);
        }

        // Check if all lawnmowers have been deployed and finished their run
        if (this.allMowersDeployed && this.lawnmowers.every(m => m.state === 'spent')) {
            this.triggerGameOver('all_mowers_deployed');
            return;
        }

        // Check Victory Condition (All zombies spawned and defeated)
        if (this.zombiesToSpawn.length === 0 && this.zombies.length === 0 && this.waveKilledZombies >= this.waveTotalZombies) {
            if (this.allMowersDeployed) {
                this.triggerGameOver('all_mowers_deployed');
            } else {
                this.triggerVictory();
            }
            return;
        }

        this.updateTargetZombie();
        this.updateHUD();
    }

    spawnSun(x, y) {
        if (this.sunMultiplesMode) {
            // Two sun points released from each kill that float to the top between stats and gameplay
            const M = this.currentMultipleTarget;
            const pairId = 'pair_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

            // Valid multiple of M (between 2*M and 12*M)
            const k = Math.floor(Math.random() * 10) + 2;
            const correctNum = k * M;

            // Distractor number: random integer in [3..48] that is not a multiple of M
            let distractorNum = 7;
            for (let tries = 0; tries < 50; tries++) {
                const cand = Math.floor(Math.random() * 44) + 3;
                if (cand % M !== 0 && cand !== correctNum) {
                    distractorNum = cand;
                    break;
                }
            }

            // Positions in upper zone:
            // When boss fight is active, float slightly lower (y≈148) so suns and their numbers are never occluded by the boss life meter!
            const isBossFight = (this.currentWave % 5 === 0) || this.zombies.some(z => z.isBoss && !z.isDead);
            const baseTargetY = isBossFight ? 148 : 116;
            const targetY1 = baseTargetY + (Math.random() * 6 - 3);
            const targetY2 = baseTargetY + (Math.random() * 6 - 3);
            const midX = Math.max(220, Math.min(780, x));
            const targetX1 = midX - 52;
            const targetX2 = midX + 52;

            // Only one of the 2 released sun points is correct
            const sun1IsCorrect = (Math.random() < 0.5);
            const num1 = sun1IsCorrect ? correctNum : distractorNum;
            const num2 = sun1IsCorrect ? distractorNum : correctNum;

            const sunA = new SunOrb(x - 14, y, targetX1, targetY1, true, num1, sun1IsCorrect, pairId);
            const sunB = new SunOrb(x + 14, y, targetX2, targetY2, true, num2, !sun1IsCorrect, pairId);

            this.suns.push(sunA, sunB);
        } else {
            // Standard single sun floating to sun bank
            this.suns.push(new SunOrb(x, y, 120, 25));
        }
    }

    handleMultipleSunClick(sun) {
        if (sun.isValidMultiple) {
            // Correct multiple selected!
            this.sun += 1;
            this.score += 100;
            window.soundEffects.playSunCollect();
            this.particles.addFloatingText(`+1 ☀️ Multiple of ${this.currentMultipleTarget}! (${sun.number})`, sun.x, sun.y - 25, '#76FF03', 20);
            this.particles.addSplat(sun.x, sun.y, '#FFEB3B', 16);
            sun.collectedOnFly = true;
            sun.collect();

            // Fade away the other sun in this pair
            for (const other of this.suns) {
                if (other !== sun && other.pairId === sun.pairId) {
                    other.fadeAway();
                }
            }
        } else {
            // Incorrect multiple!
            // If they select the wrong one they lose a point. Cannot go negative points though.
            this.sun = Math.max(0, this.sun - 1);
            window.soundEffects.playWrong();
            this.particles.addFloatingText(`-1 ☀️ Not a Multiple of ${this.currentMultipleTarget}! (${sun.number})`, sun.x, sun.y - 25, '#FF5252', 20);
            this.particles.addSplat(sun.x, sun.y, '#FF1744', 16);
            sun.dead = true;

            // When selecting the wrong multiple, the other proper choice immediately goes away
            // so they cannot click it to cancel the loss of point!
            for (const other of this.suns) {
                if (other !== sun && other.pairId === sun.pairId) {
                    other.fadeAway();
                    this.particles.addFloatingText('Missed! 💨', other.x, other.y - 20, '#FF8A80', 16);
                }
            }
        }
        this.updateHUD();
    }

    render() {
        const ctx = this.ctx;
        ctx.save();

        // Screen shake offset
        if (this.screenShake > 0) {
            const ox = (Math.random() - 0.5) * this.screenShake;
            const oy = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(ox, oy);
        }

        ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

        // 1. Draw Background (Sky, lawn, checkered grass, patio)
        this.drawBackground(ctx);

        // 2. Draw Lawnmowers
        for (const mower of this.lawnmowers) {
            mower.render(ctx);
        }

        // 2.5 Draw Cherry Bombs on lawn
        for (const cb of this.cherryBombs) {
            cb.render(ctx);
        }

        // 2.55 Draw Chili Peppers on lawn
        for (const cp of this.chiliPeppers) {
            cp.render(ctx);
        }

        // 2.6 Draw Potato Mines on lawn
        for (const pm of this.potatoMines) {
            pm.render(ctx);
        }

        // 3. Draw Peashooters
        for (const p of this.peashooters) {
            p.render(ctx);
        }

        // 4. Draw Peas
        for (const pea of this.peas) {
            pea.render(ctx);
        }

        // 5. Draw Zombies (sorted by Y so lower lane zombies appear in front)
        const sortedZombies = [...this.zombies].sort((a, b) => a.y - b.y);
        for (const z of sortedZombies) {
            z.render(ctx);

            // Draw target bracket / reticle on the active target zombie
            if (z === this.targetZombie && !z.isDead) {
                this.drawTargetIndicator(ctx, z.x, z.y - 45);
            }
        }

        // 5.5 Draw Sun Orbs
        for (const sun of this.suns) {
            sun.render(ctx);
        }

        // 6. Draw Particles and Floating Text
        this.particles.render(ctx);

        // 6.8 Draw Boss Health Bar if Boss is Active!
        const activeBoss = this.zombies.find(z => z.isBoss && !z.isDead);
        if (activeBoss) {
            this.drawBossHealthBar(ctx, activeBoss);
        }

        // 6.5 Draw Cherry Bomb Placement Preview / Ghost & Blast Radius
        if (this.selectedSeed === 'cherrybomb' && this.isMouseOnCanvas) {
            ctx.save();
            // Blast radius circle
            ctx.strokeStyle = 'rgba(255, 23, 68, 0.9)';
            ctx.fillStyle = 'rgba(255, 23, 68, 0.16)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(this.mouseX, this.mouseY, 135, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Crosshair
            ctx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(this.mouseX - 18, this.mouseY);
            ctx.lineTo(this.mouseX + 18, this.mouseY);
            ctx.moveTo(this.mouseX, this.mouseY - 18);
            ctx.lineTo(this.mouseX, this.mouseY + 18);
            ctx.stroke();

            // Ghost Cherry Bomb
            ctx.globalAlpha = 0.8;
            const ghost = new CherryBomb(this.mouseX, this.mouseY);
            ghost.render(ctx);
            ctx.restore();
        }

        // 6.55 Draw Chili Pepper Placement Preview / Ghost & Screen Inferno Indicator
        if (this.selectedSeed === 'chilipepper' && this.isMouseOnCanvas) {
            ctx.save();
            // Full lawn inferno danger zone indicator
            const lawnLeft = this.defenseX - 70;
            const lawnTop = 130;
            const lawnWidth = this.baseWidth - lawnLeft - 10;
            const lawnHeight = this.baseHeight - lawnTop;

            ctx.strokeStyle = 'rgba(255, 61, 0, 0.75)';
            ctx.fillStyle = 'rgba(255, 87, 34, 0.09)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 8]);
            ctx.strokeRect(lawnLeft, lawnTop, lawnWidth, lawnHeight);
            ctx.fillRect(lawnLeft, lawnTop, lawnWidth, lawnHeight);

            // Target ring at cursor
            ctx.setLineDash([]);
            ctx.strokeStyle = '#FF1744';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.mouseX, this.mouseY, 44, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshairs
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.mouseX - 22, this.mouseY);
            ctx.lineTo(this.mouseX + 22, this.mouseY);
            ctx.moveTo(this.mouseX, this.mouseY - 22);
            ctx.lineTo(this.mouseX, this.mouseY + 22);
            ctx.stroke();

            // Target banner under cursor
            ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#FFD600';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText('🔥 BOARD WIPE INFERNO 🔥', this.mouseX, this.mouseY + 54);
            ctx.fillText('🔥 BOARD WIPE INFERNO 🔥', this.mouseX, this.mouseY + 54);

            // Ghost Chili Pepper
            ctx.globalAlpha = 0.85;
            const ghost = new ChiliPepper(this.mouseX, this.mouseY);
            ghost.render(ctx);
            ctx.restore();
        }

        // 6.58 Draw Super Pea Row Barrage Aiming Guide & Reticle
        if (this.selectedSeed === 'superpea' && this.isMouseOnCanvas) {
            ctx.save();
            const grassTop = 130;
            const totalLawnH = this.baseHeight - grassTop;
            const laneH = totalLawnH / this.laneCount;
            let targetLane = Math.floor((this.mouseY - grassTop) / laneH);
            targetLane = Math.max(0, Math.min(this.laneCount - 1, targetLane));

            const laneTop = grassTop + targetLane * laneH;
            const startX = this.defenseX - 70;
            const lawnWidth = this.baseWidth - startX - 10;
            const rowCenterY = this.laneHeights[targetLane] - 10;

            // Highlight target row with glowing electric green beam/zone
            ctx.fillStyle = 'rgba(118, 255, 3, 0.12)';
            ctx.fillRect(startX, laneTop + 3, lawnWidth, laneH - 6);

            ctx.strokeStyle = '#76FF03';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 6]);
            ctx.strokeRect(startX, laneTop + 3, lawnWidth, laneH - 6);
            ctx.setLineDash([]);

            // Aiming reticle on the row at cursor X
            ctx.strokeStyle = '#76FF03';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.mouseX, rowCenterY, 32, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshair
            ctx.beginPath();
            ctx.moveTo(this.mouseX - 20, rowCenterY);
            ctx.lineTo(this.mouseX + 20, rowCenterY);
            ctx.moveTo(this.mouseX, rowCenterY - 20);
            ctx.lineTo(this.mouseX, rowCenterY + 20);
            ctx.stroke();

            // Row target label
            ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#76FF03';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText(`🎯 ROW ${targetLane + 1} SUPER PEA BARRAGE 🟢`, this.mouseX, rowCenterY + 45);
            ctx.fillText(`🎯 ROW ${targetLane + 1} SUPER PEA BARRAGE 🟢`, this.mouseX, rowCenterY + 45);

            // Preview rapid pea icons flying from the peashooter
            const shooter = this.peashooters[targetLane];
            if (shooter && !shooter.dead) {
                ctx.fillStyle = '#76FF03';
                ctx.shadowColor = '#76FF03';
                ctx.shadowBlur = 15;
                for (let k = 0; k < 3; k++) {
                    ctx.beginPath();
                    ctx.arc(shooter.x + 40 + k * 18, rowCenterY, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // 6.6 Draw Potato Mine Grid Cell Snap & Ghost Preview
        if (this.selectedSeed === 'potatomine' && this.isMouseOnCanvas) {
            ctx.save();
            const grassTop = 130;
            const grassBottom = this.baseHeight;
            const totalLawnH = grassBottom - grassTop;
            const laneH = totalLawnH / this.laneCount;
            const colW = 75;
            const startX = this.defenseX - 70; // 150

            let col = Math.floor((this.mouseX - startX) / colW);
            col = Math.max(1, Math.min(9, col));
            let row = Math.floor((this.mouseY - grassTop) / laneH);
            row = Math.max(0, Math.min(this.laneCount - 1, row));

            const cellLeft = startX + col * colW;
            const cellTop = grassTop + row * laneH;
            const cellCenterX = cellLeft + colW / 2;
            const cellCenterY = this.laneHeights[row] + 12;

            // Highlight target lawn cell
            ctx.fillStyle = 'rgba(255, 235, 59, 0.28)';
            ctx.fillRect(cellLeft + 2, cellTop + 2, colW - 4, laneH - 4);
            ctx.strokeStyle = '#FFD54F';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(cellLeft + 2, cellTop + 2, colW - 4, laneH - 4);
            ctx.setLineDash([]);

            // Crosshair in cell
            ctx.strokeStyle = 'rgba(255, 193, 7, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cellCenterX - 14, cellCenterY);
            ctx.lineTo(cellCenterX + 14, cellCenterY);
            ctx.moveTo(cellCenterX, cellCenterY - 14);
            ctx.lineTo(cellCenterX, cellCenterY + 14);
            ctx.stroke();

            // Ghost Potato Mine with blinking red antenna
            ctx.globalAlpha = 0.85;
            const ghost = new PotatoMine(cellCenterX, cellCenterY, row);
            ghost.render(ctx);
            ctx.restore();
        }

        // 6.7 Draw Repeater Upgrade Hover & Reticle
        if (this.selectedSeed === 'repeater' && this.isMouseOnCanvas) {
            ctx.save();
            for (let i = 0; i < this.laneCount; i++) {
                const p = this.peashooters[i];
                if (!p || p.dead) continue;

                const dist = Math.hypot(this.mouseX - p.x, this.mouseY - p.y);
                const inColumn = (this.mouseX >= this.defenseX - 75 && this.mouseX <= this.defenseX + 25 && Math.abs(this.mouseY - p.y) < 45);
                const isHovered = dist < 45 || inColumn;

                if (p.isDouble) {
                    if (isHovered) {
                        ctx.strokeStyle = '#FFC107';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.fillStyle = '#FFE082';
                        ctx.font = 'bold 12px Arial, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('Already 2×! 🟢🟢', p.x, p.y - 38);
                    }
                } else {
                    const pulse = Math.sin(Date.now() / 150) * 3;
                    ctx.strokeStyle = isHovered ? '#76FF03' : '#FFD54F';
                    ctx.lineWidth = isHovered ? 3.5 : 2;
                    ctx.setLineDash([6, 4]);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 30 + (isHovered ? pulse : 0), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    if (isHovered) {
                        ctx.fillStyle = '#76FF03';
                        ctx.font = 'bold 13px Arial, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('UPGRADE! (5 ☀️)', p.x, p.y - 38);
                    }
                }
            }
            ctx.restore();
        }

        // 7. Danger Vignette if Plant Health is Low
        if (this.plantHealth < 35 && this.gameState === 'playing') {
            const pulse = (Math.sin(performance.now() * 0.008) + 1) * 0.15 + 0.1;
            ctx.fillStyle = `rgba(211, 47, 47, ${pulse})`;
            ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
        }

        ctx.restore();
    }

    drawBackground(ctx) {
        // Daytime Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 130);
        skyGrad.addColorStop(0, '#4FC3F7');
        skyGrad.addColorStop(1, '#B3E5FC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.baseWidth, 130);

        // Sun & Cute Sunflower in top-left
        ctx.fillStyle = '#FFEE58';
        ctx.beginPath();
        ctx.arc(880, 50, 36, 0, Math.PI * 2);
        ctx.fill();

        // Wooden fence in background
        ctx.fillStyle = '#8D6E63';
        for (let x = 0; x < this.baseWidth; x += 32) {
            ctx.fillRect(x, 105, 26, 30);
            ctx.beginPath();
            ctx.moveTo(x, 105);
            ctx.lineTo(x + 13, 90);
            ctx.lineTo(x + 26, 105);
            ctx.fill();
        }

        // House Patio / Stone Tiles on the left
        const patioGrad = ctx.createLinearGradient(0, 0, this.defenseX - 50, 0);
        patioGrad.addColorStop(0, '#78909C');
        patioGrad.addColorStop(1, '#90A4AE');
        ctx.fillStyle = patioGrad;
        ctx.fillRect(0, 130, this.defenseX - 70, this.baseHeight - 130);

        // Checkered Grass Lawn Grid
        const grassTop = 130;
        const grassBottom = this.baseHeight;
        const totalLawnH = grassBottom - grassTop;
        const laneH = totalLawnH / this.laneCount;
        const colW = 75;
        const startX = this.defenseX - 70;

        const grassColor1 = '#558B2F'; // Darker grass
        const grassColor2 = '#689F38'; // Lighter grass

        for (let row = 0; row < this.laneCount; row++) {
            const y = grassTop + row * laneH;
            for (let x = startX; x < this.baseWidth + 50; x += colW) {
                const colIdx = Math.floor((x - startX) / colW);
                ctx.fillStyle = (row + colIdx) % 2 === 0 ? grassColor1 : grassColor2;
                ctx.fillRect(x, y, colW, laneH);
            }

            // Lane dividing line (subtle)
            ctx.strokeStyle = 'rgba(27, 94, 32, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(this.baseWidth, y);
            ctx.stroke();
        }

        // Sidewalk Curb on the far right
        ctx.fillStyle = '#B0BEC5';
        ctx.fillRect(this.baseWidth - 45, 130, 45, this.baseHeight - 130);
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.baseWidth - 45, 130, 45, this.baseHeight - 130);
    }

    drawTargetIndicator(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        const bounce = Math.sin(performance.now() * 0.01) * 4;

        // Animated Target Arrow pointing down at zombie
        ctx.fillStyle = '#FFEB3B';
        ctx.strokeStyle = '#F57F17';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(0, bounce);
        ctx.lineTo(-9, -14 + bounce);
        ctx.lineTo(-4, -14 + bounce);
        ctx.lineTo(-4, -24 + bounce);
        ctx.lineTo(4, -24 + bounce);
        ctx.lineTo(4, -14 + bounce);
        ctx.lineTo(9, -14 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawBossHealthBar(ctx, boss) {
        ctx.save();
        const barW = 420;
        const barH = 26;
        const barX = (this.baseWidth - barW) / 2;
        const barY = 62;

        // Subtle pulsing glow when boss is enrage/low health
        const isEnraged = boss.hp <= boss.maxHp / 2;
        if (isEnraged) {
            const glow = (Math.sin(performance.now() * 0.008) + 1) * 0.5;
            ctx.shadowColor = `rgba(255, 23, 68, ${0.5 + glow * 0.4})`;
            ctx.shadowBlur = 12;
        } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 8;
        }

        // Heavy dark metallic plate container
        ctx.fillStyle = 'rgba(23, 25, 35, 0.92)';
        ctx.strokeStyle = isEnraged ? '#FF1744' : '#FFD54F';
        ctx.lineWidth = 2.5;
        roundRect(ctx, barX - 10, barY - 4, barW + 20, barH + 8, 8);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow for inner elements

        // Dark track for HP fill
        ctx.fillStyle = '#1B1C22';
        roundRect(ctx, barX, barY, barW, barH, 5);
        ctx.fill();

        // Calculate HP fill
        const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
        const fillW = barW * ratio;

        if (fillW > 0) {
            const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            if (ratio > 0.5) {
                hpGrad.addColorStop(0, '#E53935');
                hpGrad.addColorStop(1, '#FF5252');
            } else if (ratio > 0.25) {
                hpGrad.addColorStop(0, '#D50000');
                hpGrad.addColorStop(1, '#FF7043');
            } else {
                hpGrad.addColorStop(0, '#B71C1C');
                hpGrad.addColorStop(1, '#FF1744');
            }
            ctx.fillStyle = hpGrad;
            roundRect(ctx, barX, barY, fillW, barH, 5);
            ctx.fill();

            // Glass shine on upper half of HP bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.fillRect(barX, barY, fillW, barH / 2);
        }

        // Segment dividers every 2 HP
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        const segmentCount = boss.maxHp;
        for (let i = 1; i < segmentCount; i++) {
            const segX = barX + (barW / segmentCount) * i;
            ctx.beginPath();
            ctx.moveTo(segX, barY);
            ctx.lineTo(segX, barY + barH);
            ctx.stroke();
        }

        // Inner border around track
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, barX, barY, barW, barH, 5);
        ctx.stroke();

        // Left Label: Gargantuar Name & Status
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px "Fredoka", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        const bossStatus = isEnraged ? '🔥 ENRAGED GARGANTUAR' : '🧟 GARGANTUAR BOSS';
        ctx.fillText(bossStatus, barX + 12, barY + barH / 2 + 1);

        // Right Label: HP Number
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFF8E1';
        ctx.font = 'bold 13px "Fredoka", sans-serif';
        ctx.fillText(`${boss.hp} / ${boss.maxHp} HP`, barX + barW - 12, barY + barH / 2 + 1);

        ctx.restore();
    }

    updateHUD() {
        const scoreElem = document.getElementById('hudScore');
        const streakElem = document.getElementById('hudStreak');
        const waveElem = document.getElementById('hudWave');
        const healthFill = document.getElementById('healthFill');
        const healthText = document.getElementById('healthText');
        const waveProgress = document.getElementById('waveProgressBar');

        if (scoreElem) scoreElem.textContent = this.score;
        if (streakElem) streakElem.textContent = window.mathEngine.stats.streak;
        if (waveElem) waveElem.textContent = `${this.currentWave}/${this.totalWaves}`;

        const sunElem = document.getElementById('hudSun');
        if (sunElem) sunElem.textContent = this.sun;

        // Potato Mine Seed Card State (Cost: 3 ☀️)
        const potatoCard = document.getElementById('potatoMineSeed');
        const potatoOverlay = document.getElementById('potatoCooldownOverlay');
        if (potatoCard) {
            if (this.selectedSeed === 'potatomine') {
                potatoCard.className = 'seed-packet selected';
                if (potatoOverlay) {
                    potatoOverlay.style.height = '0%';
                    potatoOverlay.textContent = 'PLANTING';
                }
            } else if (this.sun >= 3) {
                potatoCard.className = 'seed-packet ready';
                if (potatoOverlay) {
                    potatoOverlay.style.height = '0%';
                    potatoOverlay.textContent = 'READY!';
                }
            } else {
                potatoCard.className = 'seed-packet disabled';
                if (potatoOverlay) {
                    const pctMissing = Math.round(((3 - this.sun) / 3) * 100);
                    potatoOverlay.style.height = `${pctMissing}%`;
                    potatoOverlay.textContent = `${this.sun}/3 ☀️`;
                }
            }
        }

        // Repeater Double Shot Seed Card State (Cost: 5 ☀️)
        const repeaterCard = document.getElementById('repeaterSeed');
        const repeaterOverlay = document.getElementById('repeaterCooldownOverlay');
        if (repeaterCard) {
            if (this.selectedSeed === 'repeater') {
                repeaterCard.className = 'seed-packet selected';
                if (repeaterOverlay) {
                    repeaterOverlay.style.height = '0%';
                    repeaterOverlay.textContent = 'UPGRADE';
                }
            } else if (this.sun >= 5) {
                repeaterCard.className = 'seed-packet ready';
                if (repeaterOverlay) {
                    repeaterOverlay.style.height = '0%';
                    repeaterOverlay.textContent = 'READY!';
                }
            } else {
                repeaterCard.className = 'seed-packet disabled';
                if (repeaterOverlay) {
                    const pctMissing = Math.round(((5 - this.sun) / 5) * 100);
                    repeaterOverlay.style.height = `${pctMissing}%`;
                    repeaterOverlay.textContent = `${this.sun}/5 ☀️`;
                }
            }
        }

        // Super Pea Barrage Seed Card State (Cost: 8 ☀️)
        const superPeaCard = document.getElementById('superPeaSeed');
        const superPeaOverlay = document.getElementById('superPeaCooldownOverlay');
        if (superPeaCard) {
            if (this.selectedSeed === 'superpea') {
                superPeaCard.className = 'seed-packet selected';
                if (superPeaOverlay) {
                    superPeaOverlay.style.height = '0%';
                    superPeaOverlay.textContent = 'AIMING';
                }
            } else if (this.sun >= 8) {
                superPeaCard.className = 'seed-packet ready';
                if (superPeaOverlay) {
                    superPeaOverlay.style.height = '0%';
                    superPeaOverlay.textContent = 'READY!';
                }
            } else {
                superPeaCard.className = 'seed-packet disabled';
                if (superPeaOverlay) {
                    const pctMissing = Math.round(((8 - this.sun) / 8) * 100);
                    superPeaOverlay.style.height = `${pctMissing}%`;
                    superPeaOverlay.textContent = `${this.sun}/8 ☀️`;
                }
            }
        }

        // Cherry Bomb Seed Card State (Cost: 8 ☀️)
        const cherryCard = document.getElementById('cherryBombSeed');
        const cooldownOverlay = document.getElementById('cherryCooldownOverlay');
        if (cherryCard) {
            if (this.selectedSeed === 'cherrybomb') {
                cherryCard.className = 'seed-packet selected';
                if (cooldownOverlay) {
                    cooldownOverlay.style.height = '0%';
                    cooldownOverlay.textContent = 'PLANTING';
                }
            } else if (this.sun >= 8) {
                cherryCard.className = 'seed-packet ready';
                if (cooldownOverlay) {
                    cooldownOverlay.style.height = '0%';
                    cooldownOverlay.textContent = 'READY!';
                }
            } else {
                cherryCard.className = 'seed-packet disabled';
                if (cooldownOverlay) {
                    const pctMissing = Math.round(((8 - this.sun) / 8) * 100);
                    cooldownOverlay.style.height = `${pctMissing}%`;
                    cooldownOverlay.textContent = `${this.sun}/8 ☀️`;
                }
            }
        }

        // Super Hot Chili Pepper Seed Card State (Cost: 12 ☀️)
        const chiliCard = document.getElementById('chiliPepperSeed');
        const chiliOverlay = document.getElementById('chiliCooldownOverlay');
        if (chiliCard) {
            if (this.selectedSeed === 'chilipepper') {
                chiliCard.className = 'seed-packet selected';
                if (chiliOverlay) {
                    chiliOverlay.style.height = '0%';
                    chiliOverlay.textContent = 'PLANTING';
                }
            } else if (this.sun >= 12) {
                chiliCard.className = 'seed-packet ready';
                if (chiliOverlay) {
                    chiliOverlay.style.height = '0%';
                    chiliOverlay.textContent = 'READY!';
                }
            } else {
                chiliCard.className = 'seed-packet disabled';
                if (chiliOverlay) {
                    const pctMissing = Math.round(((12 - this.sun) / 12) * 100);
                    chiliOverlay.style.height = `${pctMissing}%`;
                    chiliOverlay.textContent = `${this.sun}/12 ☀️`;
                }
            }
        }

        if (healthFill) {
            const pct = Math.max(0, Math.min(100, (this.plantHealth / this.maxPlantHealth) * 100));
            healthFill.style.width = `${pct}%`;
            if (pct < 30) healthFill.style.backgroundColor = '#F44336';
            else if (pct < 60) healthFill.style.backgroundColor = '#FF9800';
            else healthFill.style.backgroundColor = '#4CAF50';
        }

        if (healthText) {
            healthText.textContent = `${Math.ceil(this.plantHealth)}%`;
        }

        if (waveProgress) {
            const total = this.waveTotalZombies || 1;
            const killed = this.waveKilledZombies || 0;
            const progress = Math.min(100, Math.round((killed / total) * 100));
            waveProgress.style.width = `${progress}%`;
        }
    }

    triggerVictory() {
        this.gameState = 'victory';
        window.soundEffects.stopBGM();
        window.soundEffects.playVictory();

        // Level Defense Bonus based directly on hits taken and health preserved!
        const healthBonus = Math.round(this.plantHealth) * 10;
        const mowersSaved = this.lawnmowers.filter(m => m.state === 'idle').length;
        const mowerBonus = mowersSaved * 200;
        const flawlessBonus = (this.waveHitsTaken === 0) ? 500 : 0;
        const totalDefenseBonus = healthBonus + mowerBonus + flawlessBonus;

        this.score += totalDefenseBonus;

        const scoreElem = document.getElementById('victoryScore');
        const healthElem = document.getElementById('victoryHealth');
        const hitsElem = document.getElementById('victoryHits');
        const subtitleElem = document.getElementById('victorySubtitle');
        const waveNumElem = document.getElementById('victoryWaveNum');

        if (waveNumElem) waveNumElem.textContent = this.currentWave;
        if (scoreElem) scoreElem.textContent = this.score;
        if (healthElem) healthElem.textContent = `${Math.ceil(this.plantHealth)}%`;
        if (hitsElem) hitsElem.textContent = (this.waveHitsTaken === 0) ? '0 (Flawless!)' : `${this.waveHitsTaken}`;

        // Fallbacks for any legacy element references
        const legacyAcc = document.getElementById('victoryAccuracy');
        if (legacyAcc) legacyAcc.textContent = `${Math.ceil(this.plantHealth)}%`;
        const legacyStreak = document.getElementById('victoryStreak');
        if (legacyStreak) legacyStreak.textContent = window.mathEngine.stats.maxStreak;

        if (subtitleElem) {
            if (this.waveHitsTaken === 0) {
                subtitleElem.innerHTML = `🌟 <strong>FLAWLESS DEFENSE!</strong> 0 hits taken! <span style="color: #FFEB3B;">+${totalDefenseBonus} Defense Bonus!</span>`;
            } else {
                subtitleElem.innerHTML = `🛡️ <strong>${Math.ceil(this.plantHealth)}% Lawn Health Preserved!</strong> (${this.waveHitsTaken} hit${this.waveHitsTaken > 1 ? 's' : ''}) <span style="color: #FFEB3B;">+${totalDefenseBonus} Defense Bonus!</span>`;
            }
        }

        // 3-Star Rating based purely on hits taken / plant health (NOT failed keyboard attempts!)
        const starsElem = document.getElementById('victoryStars');
        let starCount = 1;
        if (this.waveHitsTaken <= 1 && this.plantHealth >= 80) starCount = 3;
        else if (this.plantHealth >= 45) starCount = 2;

        if (starsElem) {
            starsElem.innerHTML = '⭐'.repeat(starCount) + '☆'.repeat(3 - starCount);
        }

        document.getElementById('victoryModal').classList.remove('hidden');
    }

    triggerGameOver(reason = 'breach') {
        this.gameState = 'gameover';
        window.soundEffects.stopBGM();
        window.soundEffects.playGameOver();

        const titleElem = document.getElementById('gameOverTitle');
        const subElem = document.getElementById('gameOverSubtitle');

        if (reason === 'all_mowers_deployed') {
            if (titleElem) titleElem.innerHTML = '🚜 ALL LAWNMOWERS DEPLOYED! 🚜';
            if (subElem) subElem.textContent = 'All 3 lawnmowers were used! Even though they crushed the zombies, your lawn defenses were completely lost. Answer faster to protect your lawn without losing all mowers!';
        } else {
            if (titleElem) titleElem.innerHTML = 'THE ZOMBIES ATE YOUR BRAINS! 🧟';
            if (subElem) subElem.textContent = "Don't give up! Faster math answers knock the zombies back and defeat them in time.";
        }

        const summary = window.mathEngine.getSummary();
        const scoreElem = document.getElementById('gameOverScore');
        const questionsElem = document.getElementById('gameOverQuestions');
        const hitsElem = document.getElementById('gameOverHits');

        if (scoreElem) scoreElem.textContent = this.score;
        if (questionsElem) questionsElem.textContent = summary.correct;
        if (hitsElem) hitsElem.textContent = this.waveHitsTaken;

        document.getElementById('gameOverModal').classList.remove('hidden');
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseModal').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastTime = performance.now();
            document.getElementById('pauseModal').classList.add('hidden');
        }
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Start instance on window load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MathDefenseGame();
    requestAnimationFrame((t) => window.game.loop(t));
});
