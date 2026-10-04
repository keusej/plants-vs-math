# 🌻 Plants vs. Math: Arithmetic Lawn Defense 🧟

An interactive, web-based flashcard math game designed for elementary students mastering **Addition, Subtraction, Multiplication, and Division**, crafted in the playful cartoon style of *Plants vs. Zombies*!

---

## 🎮 How to Play

### Option 1: Instant Play (No Server Needed!)
Simply double-click [`index.html`](file:///c:/Users/jkeus/OneDrive/Documents/Antigravity/FlashCardGame/index.html) in Windows File Explorer to open and play directly in Microsoft Edge, Google Chrome, Mozilla Firefox, or Safari!

### Option 2: Local Web Server
You can also launch a lightweight local Python server:
```powershell
python -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000) in your web browser.

---

## ➕➖✖️➗ Custom Operation Selection & Adaptive Smart Menu

Customize your arithmetic practice from the game settings with any combination of operations:
1. **➕ Addition (+)** & **➖ Subtraction (−)**: Features an **Adaptive Smart Menu** with 5 skill levels designed for early learners through advanced mental math:
   - 🌱 **Within 10 (Intro)**: Kindergarten & 1st Grade. Sums and minuends strictly $\le 10$ ($4 + 3 = 7$, $9 - 4 = 5$). Includes a number selector (1–10) with beginner presets (e.g. *Just 1 & 2*).
   - 🌿 **Facts to 20 (Standard)**: 1st & 2nd Grade fact families and sums up to 20 ($8 + 7 = 15$, $14 - 8 = 6$).
   - 🔟 **Tens (10–90)**: Place-value confidence building ($30 + 40 = 70$, $80 - 30 = 50$) with a clean, zero-clutter layout.
   - 🌻 **Up to 50**: Intro to two-digit mental math & regrouping ($26 + 18 = 44$, $42 - 17 = 25$).
   - ⚡ **Up to 100**: Advanced two-digit mental math challenge ($48 + 37 = 85$, $91 - 45 = 46$).
2. **✖️ Multiplication (×)**: Classic times tables from $1 \times 1$ through $12 \times 12$ with full 1–12 table selector grid.
3. **➗ Division (÷)**: Clean, whole-number division facts ($1 \div 1$ up to $144 \div 12$) with zero remainders.
4. **Smart Adaptive Mode**: When multiplication or division is selected, the familiar 1–12 grid is preserved. When only addition or subtraction is chosen, the UI seamlessly morphs into the kid-friendly skill tiers!
5. **No Duplicate Problems**: The math engine automatically prevents asking the exact same problem or commutative pair twice in a row.

---

## ⭐ New Game Mode: Multiples Sun Catcher

Choose your sun drop style in the start menu:
1. **🌻 Classic Sun Drops**: Standard PvZ mechanic where defeated zombies drop sun orbs that fly to your sun bank to buy Cherry Bombs.
2. **⭐ Multiples Sun Catcher**:
   - **Two Floating Sun Points**: On every zombie kill, **two numbered suns** are released and float up to the sky zone between the top stats bar and the lawn!
   - **Level Target Multiple (2 → 5)**: On each level, a target multiple ($2$, $3$, $4$, or $5$) is chosen at random and displayed prominently in a glowing gold banner at the top (e.g. `⭐ COLLECT MULTIPLES OF 3! ⭐`).
   - **Only One Correct Sun**: In each released pair, **exactly one** sun is a valid multiple of the target, and the other is a distractor.
   - **Point Mechanics**:
     - Clicking the **valid multiple** awards **+1 ☀️ Sun point** and bonus score, while the other sun fades away!
     - Clicking the **wrong number** deducts **-1 ☀️ Sun point** (with a floor of 0; points **cannot go negative**!) and immediately causes the paired valid sun to vanish (`Missed! 💨`), preventing players from clicking it to cancel out the point loss.

---

## 🕹️ Game Mechanics

1. **Math Flashcards**:
   - The wooden flashcard sign displays the current problem (e.g., $7 \times 8$ or $72 \div 9$).
   - Type the answer using your physical keyboard (number keys or numpad) or tap the on-screen tactile keypad.
   - **Auto-Fire**: As soon as you type the correct answer, your Peashooter immediately shoots a pellet!
2. **Speed is Your Best Defense**:
   - Zombies steadily march across the checkered lawn from right to left.
   - Faster answers launch pellets sooner, knocking back and defeating zombies before they reach your lawn line.
3. **Zombies Attack & Lawnmowers**:
   - If you don't answer quickly enough, zombies reach the Peashooters and start chomping (`nom nom nom!`).
   - If defense health drops, your red **Lawnmower** revs up and blasts through the lane in an emergency rescue!
   - 🛡️ **Lawnmower Lane Diversion & Plant Loss**: When the lawnmower goes down a lane, the plant for that lane goes away too, and zombies will **no longer spawn or travel down that lane**, directing all incoming zombies to the remaining lanes with intact defenses!
   - 🚨 **All Lawnmowers Deployed = LOSS**: If all 3 lawnmowers are triggered/deployed, it is an **automatic loss**! Even if the mowers roll through and kill every zombie on the lawn, your defenses have failed and you will not win the wave. You must answer questions quickly to keep your lawn protected!
   - If lawnmowers are exhausted and zombies reach the house, they'll eat your brains!
4. **Combos & Elemental Pellets**:
   - **3+ Streak**: Combo bonus points!
   - **5+ Streak**: 🔥 **FIRE PEA**! Explodes on impact and deals 2× damage!
   - **10+ Streak**: ❄️ **ICE PEA**! Freezes zombies and slows them down by 50%!
5. **☀️ Sun Points & Botanical Defenses (🥔 Potato Mines & 🍒 Cherry Bombs)**:
   - **Earn Sun**: Every zombie you defeat with Peashooter pellets drops a glowing Sun orb that flies up into your Sun bank (or tap/click it!).
   - **🥔 Potato Mine (Cost: 3 ☀️)**:
     - **Affordable Defense**: Costs only 3 sun points (unlocked earlier than Cherry Bomb)!
     - **Grid Cell Placement**: Click the Potato Mine seed card on the left tray, hover over the lawn to see the snapped yellow cell reticle and ghost preview, then click to plant the mine in any checkered lawn cell!
     - **Blinking Red Antenna**: Sits snugly in the dirt with cute buck teeth and a metal antenna whose red bulb blinks brightly above the soil so you always know where your land mines are armed.
     - **Single-Target Detonation**: When a zombie steps directly onto the mine, it detonates with a comic `SPUDOW! 🥔💥`, dealing lethal damage **strictly to that specific zombie** (no splash damage to adjacent zombies). Deals a 6 HP critical hit against the Gargantuar Boss!
     - **Persists Across Waves**: Placed potato mines carry over from level to level! If unexploded mines remain on your lawn when a wave is cleared, they stay armed in their cells ready to defend against the next wave.
     - **Balance Rule**: Kills by Potato Mines grant score points but do not drop sun points.
   - **🌿 Double Shot Repeater (Cost: 5 ☀️)**:
     - **Peashooter Upgrade**: Costs 5 sun points. Click the `DOUBLE` seed packet on the left tray, then click any active Peashooter on the lawn.
     - **Distinctive Repeater Visuals**: Upgraded Peashooters sprout extra leafy crests behind their heads, sport fierce determined eyebrows, and display a golden `2× PEA` badge!
     - **Double Shot Barrage**: The upgraded plant fires two peas in rapid succession whenever triggered.
     - **Penetrating Pass-Through**: If the first shot kills the front zombie, the second shot continues through without stopping to hit the next zombie behind it!
     - **Resets Each Level**: Double shot upgrades reset back to standard single Peashooters on each new wave/level, encouraging active mid-wave tactical choices.
   - **🍒 Cherry Bomb (Cost: 8 ☀️)**:
     - **Area-of-Effect Blast**: Costs 8 sun points. Click the Cherry Bomb seed packet, then click anywhere on the lawn.
     - **KABOOM!**: The cherries puff up, turn bright orange-red, tremble, and detonate with a massive comic explosion (`💥 BOOM!`), obliterating all regular zombies within its 135px blast radius, or dealing a 6 HP critical hit to the Boss! Right-click or press `ESC` to cancel placement.
     - **Balance Rule**: Zombies destroyed by a Cherry Bomb grant score points but do not drop Sun points, keeping the challenge high.
6. **🧟 BOSS BATTLES (Gargantuar & Dr. Zomboss Mega Boss)**:
   - **Wave 5 – Gargantuar Boss**: Enters wielding a telephone pole with a massive 16 HP health bar. When his health drops to 50% or below ($\le 8$ HP), he roars and launches the tiny **Imp Zombie** from his back over your defenses!
   - **Wave 10+ – Dr. Zomboss in Zombot Mech (Mega Boss)**:
     - **Phase 1 (The Zombot Mech)**: Dr. Zomboss pilots a massive mechanical walker with robotic hydraulics, animated control levers, and an armored command dome.
     - **Phase 2 (Ejection & Jump-Back)**: When the Zombot Mech explodes, Dr. Zomboss catapults out, **leaps backwards 30%** across the lawn, and charges forward on foot with fierce determination!
     - **Boss Rewards**: Defeating a Boss awards **+1,500 points**, golden fanfare, and drops **3 bonus Sun Orbs**!
     - **Boss vs. Explosives**: Cherry Bombs and Chili Peppers deal devastating critical hits (6–8 HP) to bosses rather than instant kills.
7. **🚀 Level Skip Selector**:
   - Skip directly to later waves (Level 1, 2, 3, 5, 8, 10+) from the start screen without having to replay early levels. Defaults to Level 1.
8. **🛡️ Level Scoring & Star Ratings (Hits-Based, Keyboard Friendly)**:
   - **No Penalty for Rapid Typing**: Because auto-fire triggers immediately on matching digits, level scoring and star ratings are based on **how many hits you take and defense health preserved**, NOT on failed typing attempts!
   - **Lawn Defense Bonus**:
     - **Health Preserved**: Up to `+1,000 pts` (10 pts per % health).
     - **Flawless Defense**: `+500 bonus pts` for 0 hits taken!
     - **Mowers Saved**: `+200 pts` for each intact lawnmower.
   - **Star Ratings**:
     - ⭐⭐⭐ (3 Stars): $\le 1$ hit taken ($\ge 80\%$ health). Flawless Defense!
     - ⭐⭐☆ (2 Stars): $\ge 45\%$ health. Solid Defense!
     - ⭐☆☆ (1 Star): $< 45\%$ health. Close Call!

---

## ⚡ Difficulty & Speed Throttle (Kid-Friendly & Rebalanced)

Adjust how fast the zombies walk towards you at any time. The speed scale has been rebalanced so higher difficulties are friendly and manageable for elementary students:
- **🐌 Snail Pace (0.50x)**: The gold-standard learning pace! Recommended baseline for elementary students mastering arithmetic and building confidence.
- **🚶 Steady Pace (0.75x)**: Gentle step up with ample thinking time between multiplication problems.
- **🏃 Brisk Pace (1.00x)**: Standard speed for quick-thinking practice.
- **⚡ Fast Pace (1.35x)**: Exciting challenge mode without being overwhelmingly fast.
- **Gentle Spawn Scaling**: Zombie spawn intervals now scale smoothly across waves (`3.6s – 5.4s`), preventing overwhelming swarms.
- **Live Throttle Slider**: Fine-tune anywhere from **0.35x to 1.80x** in real-time right from the in-game HUD or pause menu!

---

## 📚 Educational Features for elementary students

- **Custom Table Selection**: Practice all tables ($1 - 12$), or isolate specific tables (e.g. practicing only $6, 7, 8, 9, 12$).
- **Smart Spaced Repetition**: If a student misses a question, the game notes it and gently re-queues that fact 2–3 questions later so they achieve true mastery.
- **Dedicated Strategy Hints (💡)**: Tap the hint button to see friendly mental math tips:
  - **Addition Tips**: Doubles ($8+8=16$), near doubles ($7+8=(7+7)+1$), friends of 10 ($a+b=10$), make a 10 ($8+5 = 10+3$), 9s trick (add 10, take away 1).
  - **Subtraction Tips**: Inverse addition ("Think: What + $b$ = $a$?"), consecutive numbers ($a - (a-1) = 1$), take away 10, friends of 10.
  - **Multiplication Tips**: 9s finger trick, doubling for 4s and 8s, splitting 12s, multiplying by 10/11.
  - **Division Tips**: Inverse thinking ("Think: What times 7 gives 56?"), halving for $\div 2$, drop-zero for $\div 10$, identical number rule ($n \div n = 1$).
- **Math Mastery Report Card (📊)** *(Temporarily Hidden)*: Underlying tracking engine for accuracy percentages across operations (currently hidden from UI pending improved input/error tracking).
- **100% Self-Contained Web Audio**: Procedural arcade sound synthesizers (shoots, splats, chomps, lawnmower engines, victory fanfare) with no external audio file dependencies or missing asset issues.
