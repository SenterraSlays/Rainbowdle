const STORAGE_KEYS = {
    stats: "rainbowdle_stats_v1",
    settings: "rainbowdle_settings_v1",
    gameState: "rainbowdle_gamestate_v1",
    stateClassic: "rainbowdle_state_classic_v1",
    stateDaily: "rainbowdle_state_daily_v1",
    dailyMeta: "rainbowdle_daily_meta_v1",
    quizStats: "rainbowdle_quiz_stats_v1"
};

function safeGet(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn("Rainbowdle: could not read from localStorage", e);
        return null;
    }
}

function safeSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.warn("Rainbowdle: could not write to localStorage", e);
        return false;
    }
}

function safeRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn("Rainbowdle: could not clear localStorage key", e);
    }
}

const DEFAULT_STATS = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGuessesOnWins: 0
};

const DEFAULT_SETTINGS = {
    sound: false,
    animations: true,
    theme: "dark"
};

const DEFAULT_QUIZ_STATS = {
    bestStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    categories: null
};

const RainbowdleStorage = {
    loadStats() {
        return {
            ...DEFAULT_STATS,
            ...safeGet(STORAGE_KEYS.stats) || {}
        };
    },
    saveStats(stats) {
        return safeSet(STORAGE_KEYS.stats, stats);
    },
    resetStats() {
        safeSet(STORAGE_KEYS.stats, DEFAULT_STATS);
    },
    recordResult(won, guessCount) {
        const stats = this.loadStats();
        stats.gamesPlayed += 1;
        if (won) {
            stats.gamesWon += 1;
            stats.currentStreak += 1;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            stats.totalGuessesOnWins += guessCount;
        } else {
            stats.currentStreak = 0;
        }
        this.saveStats(stats);
        return stats;
    },
    loadSettings() {
        return {
            ...DEFAULT_SETTINGS,
            ...safeGet(STORAGE_KEYS.settings) || {}
        };
    },
    saveSettings(settings) {
        return safeSet(STORAGE_KEYS.settings, settings);
    },
    loadQuizStats() {
        return {
            ...DEFAULT_QUIZ_STATS,
            ...safeGet(STORAGE_KEYS.quizStats) || {}
        };
    },
    saveQuizStats(stats) {
        return safeSet(STORAGE_KEYS.quizStats, stats);
    },
    loadGameState(mode = "classic") {
        const key = mode === "daily" ? STORAGE_KEYS.stateDaily : STORAGE_KEYS.stateClassic;
        const state = safeGet(key);
        if (state) return state;
        if (mode === "classic") {
            const legacy = safeGet(STORAGE_KEYS.gameState);
            if (legacy) {
                safeRemove(STORAGE_KEYS.gameState);
                const migrated = {
                    mode: "classic",
                    dateKey: null,
                    ...legacy
                };
                safeSet(STORAGE_KEYS.stateClassic, migrated);
                return migrated;
            }
        }
        return null;
    },
    saveGameState(mode, snapshot) {
        const key = mode === "daily" ? STORAGE_KEYS.stateDaily : STORAGE_KEYS.stateClassic;
        return safeSet(key, snapshot);
    },
    clearGameState(mode = "classic") {
        const key = mode === "daily" ? STORAGE_KEYS.stateDaily : STORAGE_KEYS.stateClassic;
        safeRemove(key);
    },
    loadDailyMeta() {
        return {
            streak: 0,
            bestStreak: 0,
            lastCompletedDate: null,
            ...safeGet(STORAGE_KEYS.dailyMeta) || {}
        };
    },
    recordDailyResult(won, dateKey) {
        const meta = this.loadDailyMeta();
        if (meta.lastCompletedDate === dateKey) return meta;
        if (won) {
            meta.streak = meta.lastCompletedDate && this._isYesterday(meta.lastCompletedDate, dateKey) ? meta.streak + 1 : 1;
            meta.bestStreak = Math.max(meta.bestStreak, meta.streak);
        } else {
            meta.streak = 0;
        }
        meta.lastCompletedDate = dateKey;
        safeSet(STORAGE_KEYS.dailyMeta, meta);
        return meta;
    },
    _isYesterday(prevKey, curKey) {
        try {
            const prev = new Date(prevKey + "T00:00:00");
            const cur = new Date(curKey + "T00:00:00");
            return Math.round((cur - prev) / 864e5) === 1;
        } catch (e) {
            return false;
        }
    }
};
