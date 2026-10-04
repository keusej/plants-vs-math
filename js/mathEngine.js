/**
 * Plants vs. Math - Multiplication Engine
 * Manages multiplication tables 1-12, problem queues, intelligent review of missed questions, and analytics.
 */

class MathEngine {
    constructor() {
        this.selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.selectedOperations = ['addition', 'subtraction', 'multiplication', 'division']; // default all active
        this.mode = 'multiplication'; // backward compatibility
        this.currentProblem = null;
        this.lastProblem = null;
        this.problemQueue = [];
        this.missedQueue = [];
        this.history = [];
        this.stats = {
            totalAnswered: 0,
            correct: 0,
            incorrect: 0,
            streak: 0,
            maxStreak: 0,
            tableAccuracy: {} // { 7: { correct: 5, total: 6 } }
        };
        this.resetStats();
    }

    resetStats() {
        this.lastProblem = null;
        this.stats = {
            totalAnswered: 0,
            correct: 0,
            incorrect: 0,
            streak: 0,
            maxStreak: 0,
            tableAccuracy: {}
        };
        for (let i = 1; i <= 20; i++) {
            this.stats.tableAccuracy[i] = { correct: 0, total: 0 };
        }
    }

    setOperations(ops) {
        this.lastProblem = null;
        if (!Array.isArray(ops) || ops.length === 0) {
            this.selectedOperations = ['multiplication'];
        } else {
            const valid = ['addition', 'subtraction', 'multiplication', 'division'];
            this.selectedOperations = ops.filter(op => valid.includes(op));
            if (this.selectedOperations.length === 0) {
                this.selectedOperations = ['multiplication'];
            }
        }
        this.generateQueue();
    }

    setMode(mode) {
        this.lastProblem = null;
        // Backwards compatibility helper
        const validModes = ['multiplication', 'division', 'mixed'];
        this.mode = validModes.includes(mode) ? mode : 'multiplication';
        if (mode === 'multiplication') {
            this.selectedOperations = ['multiplication'];
        } else if (mode === 'division') {
            this.selectedOperations = ['division'];
        } else if (mode === 'mixed') {
            this.selectedOperations = ['multiplication', 'division'];
        }
        this.generateQueue();
    }

    setTables(tables) {
        this.lastProblem = null;
        if (!tables || tables.length === 0) {
            this.selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        } else {
            this.selectedTables = [...tables].sort((a, b) => a - b);
        }
        this.generateQueue();
    }

    generateQueue() {
        const deck = [];
        const ops = this.selectedOperations || ['multiplication'];

        // Generate problems across the selected tables
        this.selectedTables.forEach(num1 => {
            // 1. Multiplication Facts (1 to 12)
            if (ops.includes('multiplication')) {
                for (let num2 = 1; num2 <= 12; num2++) {
                    deck.push({
                        op: '×',
                        a: num1,
                        b: num2,
                        answer: num1 * num2,
                        attempts: 0
                    });
                }
            }

            // 2. Division Facts (Dividend up to 144, Divisor 1-12, Quotient 1-12)
            if (ops.includes('division')) {
                for (let num2 = 1; num2 <= 12; num2++) {
                    deck.push({
                        op: '÷',
                        a: num1 * num2,
                        b: num1,
                        answer: num2,
                        attempts: 0
                    });
                }
            }

            // 3. Addition Facts (bounded strictly to selected numbers)
            if (ops.includes('addition')) {
                const maxSelected = (this.selectedTables && this.selectedTables.length > 0) ? Math.max(...this.selectedTables) : 12;
                const addLimit = (maxSelected <= 2) ? maxSelected : (maxSelected <= 5 ? maxSelected : 12);
                for (let num2 = 1; num2 <= addLimit; num2++) {
                    if (maxSelected <= 2 && !this.selectedTables.includes(num2)) continue;
                    deck.push({
                        op: '+',
                        a: num1,
                        b: num2,
                        answer: num1 + num2,
                        attempts: 0
                    });
                }
            }

            // 4. Subtraction Facts (positive whole number facts bounded strictly to selected numbers)
            if (ops.includes('subtraction')) {
                const maxSelected = (this.selectedTables && this.selectedTables.length > 0) ? Math.max(...this.selectedTables) : 12;
                const subLimit = (maxSelected <= 2) ? maxSelected : (maxSelected <= 5 ? maxSelected : 12);
                for (let num2 = 1; num2 <= subLimit; num2++) {
                    if (maxSelected <= 2 && !this.selectedTables.includes(num2)) continue;
                    // (num1 + num2) - num1 = num2
                    deck.push({
                        op: '−',
                        a: num1 + num2,
                        b: num1,
                        answer: num2,
                        attempts: 0
                    });
                    if (num1 !== num2) {
                        deck.push({
                            op: '−',
                            a: num1 + num2,
                            b: num2,
                            answer: num1,
                            attempts: 0
                        });
                    }
                }
            }
        });

        // Fisher-Yates shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // If the top card matches the previous problem, swap it with another non-matching card in the deck
        if (deck.length > 1 && this.lastProblem && this.isSameProblem(deck[0], this.lastProblem)) {
            const swapIdx = deck.findIndex((p, idx) => idx > 0 && !this.isSameProblem(p, this.lastProblem));
            if (swapIdx !== -1) {
                [deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]];
            }
        }

        this.problemQueue = deck;
    }

    normalizeOp(op) {
        if (!op) return '';
        if (op === '*' || op === 'x' || op === 'X') return '×';
        if (op === '/') return '÷';
        if (op === '-') return '−';
        return op;
    }

    isSameProblem(p1, p2) {
        if (!p1 || !p2) return false;
        const op1 = this.normalizeOp(p1.op);
        const op2 = this.normalizeOp(p2.op);
        if (op1 !== op2) return false;

        // Exact match
        if (p1.a === p2.a && p1.b === p2.b) return true;

        // Commutative match for multiplication and addition (e.g., 7 × 8 is equivalent to 8 × 7)
        if ((op1 === '×' || op1 === '+') && p1.a === p2.b && p1.b === p2.a) {
            return true;
        }

        return false;
    }

    generateSingleProblem(excludeProblem = null) {
        const ops = (this.selectedOperations && this.selectedOperations.length > 0)
            ? this.selectedOperations
            : ['multiplication'];
        const tables = (this.selectedTables && this.selectedTables.length > 0)
            ? this.selectedTables
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        let candidate = null;
        let attempts = 0;
        const maxAttempts = 35;

        while (attempts < maxAttempts) {
            attempts++;
            const opName = ops[Math.floor(Math.random() * ops.length)];
            const num1 = tables[Math.floor(Math.random() * tables.length)];

            if (opName === 'multiplication') {
                const num2 = Math.floor(Math.random() * 12) + 1;
                candidate = {
                    op: '×',
                    a: num1,
                    b: num2,
                    answer: num1 * num2,
                    attempts: 0
                };
            } else if (opName === 'division') {
                const num2 = Math.floor(Math.random() * 12) + 1;
                candidate = {
                    op: '÷',
                    a: num1 * num2,
                    b: num1,
                    answer: num2,
                    attempts: 0
                };
            } else if (opName === 'addition') {
                const maxSelected = Math.max(...tables);
                let num2;
                if (maxSelected <= 2) {
                    num2 = tables[Math.floor(Math.random() * tables.length)];
                } else if (maxSelected <= 5) {
                    num2 = Math.floor(Math.random() * maxSelected) + 1;
                } else {
                    num2 = Math.floor(Math.random() * 12) + 1;
                }
                if (Math.random() < 0.5) {
                    candidate = {
                        op: '+',
                        a: num1,
                        b: num2,
                        answer: num1 + num2,
                        attempts: 0
                    };
                } else {
                    candidate = {
                        op: '+',
                        a: num2,
                        b: num1,
                        answer: num2 + num1,
                        attempts: 0
                    };
                }
            } else if (opName === 'subtraction') {
                const maxSelected = Math.max(...tables);
                let num2;
                if (maxSelected <= 2) {
                    num2 = tables[Math.floor(Math.random() * tables.length)];
                } else if (maxSelected <= 5) {
                    num2 = Math.floor(Math.random() * maxSelected) + 1;
                } else {
                    num2 = Math.floor(Math.random() * 12) + 1;
                }
                const sum = num1 + num2;
                candidate = {
                    op: '−',
                    a: sum,
                    b: num1,
                    answer: num2,
                    attempts: 0
                };
            }

            if (!excludeProblem || !this.isSameProblem(candidate, excludeProblem)) {
                return candidate;
            }
        }

        return candidate || {
            op: '×',
            a: tables[0] || 1,
            b: 2,
            answer: (tables[0] || 1) * 2,
            attempts: 0
        };
    }

    nextProblem() {
        let candidate = null;

        // 1. Spaced repetition from missed queue if available and not identical to lastProblem
        if (this.missedQueue.length > 0 && Math.random() < 0.45) {
            const validMissedIdx = this.missedQueue.findIndex(p => !this.isSameProblem(p, this.lastProblem));
            if (validMissedIdx !== -1) {
                candidate = this.missedQueue.splice(validMissedIdx, 1)[0];
                candidate.isReview = true;
            }
        }

        // 2. Otherwise pull from problemQueue
        if (!candidate) {
            if (this.problemQueue.length === 0) {
                this.generateQueue();
            }

            const validQueueIdx = this.problemQueue.findIndex(p => !this.isSameProblem(p, this.lastProblem));
            if (validQueueIdx !== -1) {
                candidate = this.problemQueue.splice(validQueueIdx, 1)[0];
                candidate.isReview = false;
            } else {
                // If all remaining queue items match lastProblem, re-generate a fresh distinct problem
                candidate = this.generateSingleProblem(this.lastProblem);
                candidate.isReview = false;
            }
        }

        // 3. Fallback guard: If candidate still matches lastProblem, re-generate a new problem!
        if (!candidate || this.isSameProblem(candidate, this.lastProblem)) {
            candidate = this.generateSingleProblem(this.lastProblem);
            candidate.isReview = false;
        }

        candidate.startTime = Date.now();
        this.currentProblem = candidate;
        this.lastProblem = {
            op: candidate.op,
            a: candidate.a,
            b: candidate.b,
            answer: candidate.answer
        };

        return this.currentProblem;
    }

    checkAnswer(userAnswer) {
        if (!this.currentProblem) return { isCorrect: false, answer: 0 };

        const numAnswer = parseInt(userAnswer, 10);
        const isCorrect = (numAnswer === this.currentProblem.answer);
        const timeTaken = (Date.now() - (this.currentProblem.startTime || Date.now())) / 1000;

        this.stats.totalAnswered++;
        const op = this.currentProblem.op;
        const isDivision = (op === '÷');
        const isSubtraction = (op === '−');
        const tableA = (isDivision || isSubtraction) ? this.currentProblem.b : this.currentProblem.a;
        const tableB = (isDivision || isSubtraction) ? this.currentProblem.answer : this.currentProblem.b;

        // Update stats for participating tables
        if (this.stats.tableAccuracy[tableA]) {
            this.stats.tableAccuracy[tableA].total++;
            if (isCorrect) this.stats.tableAccuracy[tableA].correct++;
        }
        if (this.stats.tableAccuracy[tableB] && tableA !== tableB) {
            this.stats.tableAccuracy[tableB].total++;
            if (isCorrect) this.stats.tableAccuracy[tableB].correct++;
        }

        if (isCorrect) {
            this.stats.correct++;
            this.stats.streak++;
            if (this.stats.streak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.streak;
            }
        } else {
            this.stats.incorrect++;
            this.stats.streak = 0;
            // Add back to missed queue for later repetition (avoid duplicates)
            const existingMissed = this.missedQueue.find(p => this.isSameProblem(p, this.currentProblem));
            if (existingMissed) {
                existingMissed.attempts = (existingMissed.attempts || 0) + 1;
            } else {
                this.missedQueue.push({
                    op: this.currentProblem.op || '×',
                    a: this.currentProblem.a,
                    b: this.currentProblem.b,
                    answer: this.currentProblem.answer,
                    attempts: (this.currentProblem.attempts || 0) + 1
                });
            }
        }

        const result = {
            isCorrect,
            problem: this.currentProblem,
            userAnswer: numAnswer,
            correctAnswer: this.currentProblem.answer,
            streak: this.stats.streak,
            timeTaken
        };

        this.history.push(result);
        return result;
    }

    getHint() {
        if (!this.currentProblem) return "";
        const a = this.currentProblem.a;
        const b = this.currentProblem.b;
        const op = this.currentProblem.op || '×';
        const ans = this.currentProblem.answer;

        // Friendly strategic hints for 5th graders (Addition)
        if (op === '+') {
            if (a === b) return `Doubles fact! ${a} + ${b} = ${ans}!`;
            if (Math.abs(a - b) === 1) {
                const smaller = Math.min(a, b);
                return `Near doubles! Double ${smaller} is ${smaller * 2}, plus 1 is ${ans}!`;
            }
            if (a === 10 || b === 10) return `Adding 10: Just put 1 in the tens place: ${ans}!`;
            if (a === 9 || b === 9) {
                const other = (a === 9 ? b : a);
                return `9s trick: Add 10 to ${other} (${other + 10}), then take away 1: ${ans}!`;
            }
            if (a + b === 10) return `Friends of 10! ${a} + ${b} makes an exact 10!`;
            if (ans > 10 && (a < 10 || b < 10)) {
                const larger = Math.max(a, b);
                const smaller = Math.min(a, b);
                const neededFor10 = 10 - larger;
                return `Make a 10! ${larger} + ${neededFor10} = 10, plus ${smaller - neededFor10} left over = ${ans}!`;
            }
            return `Count on from ${Math.max(a, b)}: count up ${Math.min(a, b)} more to get ${ans}!`;
        }

        // Friendly strategic hints for 5th graders (Subtraction)
        if (op === '−') {
            if (a === b) return `Any number minus itself is zero: ${a} - ${b} = 0!`;
            if (b === 1) return `One less than ${a} is ${ans}!`;
            if (a - b === 1) return `Consecutive numbers! The difference is 1!`;
            if (b === 10) return `Take away 10: Drop 1 from the tens place of ${a} to get ${ans}!`;
            if (a === 10) return `Friends of 10: 10 - ${b} = ${ans} because ${b} + ${ans} = 10!`;
            return `Think addition: What number + ${b} = ${a}? (${b} + ${ans} = ${a}, so ${a} - ${b} = ${ans}!)`;
        }

        // Friendly strategic hints for 5th graders (Division)
        if (op === '÷') {
            if (b === 1) return `Any number divided by 1 stays itself: ${a}!`;
            if (b === 2) return `Cut it in half! Half of ${a} is ${ans}.`;
            if (b === 10) return `Drop the zero: ${a} ÷ 10 = ${ans}!`;
            if (ans === 1) return `Any number divided by itself is 1: ${a} ÷ ${b} = 1!`;
            return `Think multiplication: What number × ${b} = ${a}? (${b} × ${ans} = ${a}, so the answer is ${ans}!)`;
        }

        // Friendly strategic hints for 5th graders (Multiplication)
        if (b === 1) return `Any number times 1 stays itself: ${a}!`;
        if (b === 2) return `Double it! ${a} + ${a} = ${a * 2}`;
        if (b === 5) return `Count by 5s or take half of (${a} × 10)!`;
        if (b === 9) return `Use the 9s trick: (${a} × 10) - ${a} = ${a * 9}`;
        if (b === 10) return `Just put a zero at the end: ${a}0!`;
        if (b === 11 && a < 10) return `Double the digit: ${a}${a}!`;
        if (b === 12) return `Split it! (${a} × 10) + (${a} × 2) = ${a * 10} + ${a * 2} = ${a * 12}`;

        // General helper
        if (b > 1) {
            const prev = (b - 1);
            return `Think: ${a} × ${prev} = ${a * prev}. Now add ${a} more!`;
        }

        return `${a} groups of ${b}`;
    }

    getSummary() {
        const accuracy = this.stats.totalAnswered > 0
            ? Math.round((this.stats.correct / this.stats.totalAnswered) * 100)
            : 0;

        return {
            totalAnswered: this.stats.totalAnswered,
            correct: this.stats.correct,
            incorrect: this.stats.incorrect,
            accuracy,
            maxStreak: this.stats.maxStreak,
            tableAccuracy: this.stats.tableAccuracy
        };
    }
}

window.mathEngine = new MathEngine();
