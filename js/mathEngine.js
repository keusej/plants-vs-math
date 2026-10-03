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

            // 3. Addition Facts (1 to 20 range)
            if (ops.includes('addition')) {
                for (let num2 = 1; num2 <= 20; num2++) {
                    deck.push({
                        op: '+',
                        a: num1,
                        b: num2,
                        answer: num1 + num2,
                        attempts: 0
                    });
                    if (num2 > 12) {
                        // Also add reverse order for higher numbers
                        deck.push({
                            op: '+',
                            a: num2,
                            b: num1,
                            answer: num2 + num1,
                            attempts: 0
                        });
                    }
                }
            }

            // 4. Subtraction Facts (1 to 20 range, positive whole number answers)
            if (ops.includes('subtraction')) {
                for (let num2 = 1; num2 <= 20; num2++) {
                    // (num1 + num2) - num1 = num2
                    deck.push({
                        op: '−',
                        a: num1 + num2,
                        b: num1,
                        answer: num2,
                        attempts: 0
                    });
                    // Also subtraction where minuend <= 20
                    if (num1 + num2 <= 20) {
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

        // Extra standalone 1..20 facts if only Addition / Subtraction are selected
        if (ops.includes('addition') && !ops.includes('multiplication') && !ops.includes('division')) {
            for (let i = 0; i < 20; i++) {
                const r1 = Math.floor(Math.random() * 20) + 1;
                const r2 = Math.floor(Math.random() * 20) + 1;
                deck.push({
                    op: '+',
                    a: r1,
                    b: r2,
                    answer: r1 + r2,
                    attempts: 0
                });
            }
        }

        if (ops.includes('subtraction') && !ops.includes('multiplication') && !ops.includes('division')) {
            for (let i = 0; i < 20; i++) {
                const a = Math.floor(Math.random() * 19) + 2; // 2..20
                const b = Math.floor(Math.random() * (a - 1)) + 1; // 1..a-1
                deck.push({
                    op: '−',
                    a: a,
                    b: b,
                    answer: a - b,
                    attempts: 0
                });
            }
        }

        // Fisher-Yates shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        this.problemQueue = deck;
    }

    nextProblem() {
        // Prioritize missed questions if ready (spaced repetition)
        if (this.missedQueue.length > 0 && Math.random() < 0.45) {
            this.currentProblem = this.missedQueue.shift();
            this.currentProblem.isReview = true;
            this.currentProblem.startTime = Date.now();
            return this.currentProblem;
        }

        if (this.problemQueue.length === 0) {
            this.generateQueue();
        }

        this.currentProblem = this.problemQueue.shift();
        this.currentProblem.isReview = false;
        this.currentProblem.startTime = Date.now();
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
            // Add back to missed queue for later repetition
            this.missedQueue.push({
                op: this.currentProblem.op || '×',
                a: this.currentProblem.a,
                b: this.currentProblem.b,
                answer: this.currentProblem.answer,
                attempts: (this.currentProblem.attempts || 0) + 1
            });
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
