const MAX_GUESSES = 10;

const HINT_SCHEDULE = [ {
    afterGuesses: 4,
    field: "secondaryGadgets",
    label: "Secondary Gadgets"
}, {
    afterGuesses: 6,
    field: "secondaryWeapons",
    label: "Secondary Weapons"
}, {
    afterGuesses: 8,
    field: "primaryWeapons",
    label: "Primary Weapons"
} ];

function _seededRandom(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

class RainbowdleGame {
    constructor(roster) {
        this.roster = roster;
        this.mode = "classic";
        this.reset("classic");
    }
    static todayKey() {
        const d = new Date;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    reset(mode = this.mode || "classic", forcedOperator = null) {
        this.mode = mode;
        this.dateKey = mode === "daily" ? RainbowdleGame.todayKey() : null;
        this.mysteryOperator = forcedOperator || (mode === "daily" ? this._pickDailyOperator() : this._pickRandomOperator());
        this.guesses = [];
        this.guessedNames = new Set;
        this.status = "playing";
        this.hintsUnlocked = new Set;
    }
    _pickRandomOperator() {
        const index = Math.floor(Math.random() * this.roster.length);
        return this.roster[index];
    }
    _pickDailyOperator() {
        const sorted = [ ...this.roster ].sort((a, b) => a.name.localeCompare(b.name));
        const rand = _seededRandom(`rainbowdle-${this.dateKey || RainbowdleGame.todayKey()}`);
        const index = Math.floor(rand() * sorted.length);
        return sorted[index];
    }
    get guessesRemaining() {
        return MAX_GUESSES - this.guesses.length;
    }
    getAvailableHints() {
        return HINT_SCHEDULE.map(entry => {
            const unlocked = this.guesses.length >= entry.afterGuesses;
            if (unlocked) this.hintsUnlocked.add(entry.field);
            return {
                ...entry,
                unlocked: unlocked,
                values: unlocked ? this.mysteryOperator[entry.field] || [] : []
            };
        });
    }
    getNewlyUnlockedHints() {
        return HINT_SCHEDULE.filter(entry => this.guesses.length === entry.afterGuesses);
    }
    findOperatorByName(name) {
        const normalized = name.trim().toLowerCase();
        return this.roster.find(op => op.name.toLowerCase() === normalized) || null;
    }
    submitGuess(operatorName) {
        if (this.status !== "playing") {
            return {
                ok: false,
                reason: "game-over"
            };
        }
        const operator = this.findOperatorByName(operatorName);
        if (!operator) {
            return {
                ok: false,
                reason: "invalid"
            };
        }
        if (this.guessedNames.has(operator.name)) {
            return {
                ok: false,
                reason: "duplicate",
                operator: operator
            };
        }
        const comparison = compareOperators(operator, this.mysteryOperator);
        const guessRecord = {
            operator: operator,
            results: comparison.results,
            isCorrect: comparison.isCorrect
        };
        this.guesses.push(guessRecord);
        this.guessedNames.add(operator.name);
        if (comparison.isCorrect) {
            this.status = "won";
        } else if (this.guesses.length >= MAX_GUESSES) {
            this.status = "lost";
        }
        return {
            ok: true,
            guess: guessRecord
        };
    }
    serialize() {
        return {
            mode: this.mode,
            dateKey: this.dateKey,
            mysteryOperatorName: this.mysteryOperator.name,
            guessOrder: this.guesses.map(g => g.operator.name),
            status: this.status
        };
    }
    restore(snapshot) {
        if (!snapshot) return false;
        if (snapshot.mode === "daily" && snapshot.dateKey !== RainbowdleGame.todayKey()) return false;
        const mystery = this.roster.find(op => op.name === snapshot.mysteryOperatorName);
        if (!mystery) return false;
        this.mode = snapshot.mode === "daily" ? "daily" : "classic";
        this.dateKey = snapshot.dateKey || null;
        this.mysteryOperator = mystery;
        this.guesses = [];
        this.guessedNames = new Set;
        this.status = "playing";
        this.hintsUnlocked = new Set;
        for (const name of snapshot.guessOrder || []) {
            const operator = this.roster.find(op => op.name === name);
            if (!operator) continue;
            const comparison = compareOperators(operator, this.mysteryOperator);
            this.guesses.push({
                operator: operator,
                results: comparison.results,
                isCorrect: comparison.isCorrect
            });
            this.guessedNames.add(operator.name);
        }
        this.status = snapshot.status === "won" || snapshot.status === "lost" ? snapshot.status : "playing";
        this.getAvailableHints();
        return true;
    }
}
