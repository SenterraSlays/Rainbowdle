const STATE_ICON = {
    match: "✓",
    mismatch: "✕",
    higher: "⬆",
    lower: "⬇"
};

const STATE_EMOJI = {
    match: "🟩",
    mismatch: "⬛",
    higher: "⬆️",
    lower: "⬇️"
};

const HINT_EMOJI = {
    secondaryGadgets: "💥",
    secondaryWeapons: "🔫",
    primaryWeapons: "🔫"
};

const HINT_CIRCLE_META = {
    secondaryGadgets: {
        icon: "📷",
        short: "Gadget"
    },
    secondaryWeapons: {
        icon: "🔫",
        short: "Secondary Weapon"
    },
    primaryWeapons: {
        icon: "🎯",
        short: "Primary Weapon"
    }
};

function initialsFor(name) {
    const cleaned = name.replace(/[^A-Za-z ]/g, "");
    const parts = cleaned.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return cleaned.slice(0, 2).toUpperCase();
}

function createPortraitElement(operator, {size: size = "grid"} = {}) {
    const img = document.createElement("img");
    img.src = operator.image;
    img.alt = `${operator.name} operator`;
    img.className = size === "grid" ? "op-portrait" : size === "banner" ? "end-banner__portrait" : size === "card" ? "op-card__portrait" : size === "learn" ? "learn-card__portrait" : size === "quiz" ? "quiz-option__portrait" : "autocomplete-item__thumb";
    img.loading = "lazy";
    img.addEventListener("error", () => {
        console.warn(`⚠ Missing operator image: ${operator.image}`);
        const fallback = document.createElement("div");
        fallback.className = size === "grid" ? "op-portrait-fallback" : size === "banner" ? "end-banner__portrait-fallback" : size === "card" ? "op-card__portrait-fallback" : size === "learn" ? "learn-card__portrait-fallback" : size === "quiz" ? "quiz-option__portrait-fallback" : "autocomplete-item__thumb-fallback";
        fallback.textContent = initialsFor(operator.name);
        fallback.title = operator.name;
        fallback.setAttribute("role", "img");
        fallback.setAttribute("aria-label", `${operator.name} operator (image unavailable)`);
        img.replaceWith(fallback);
    }, {
        once: true
    });
    return img;
}

class SoundBoard {
    constructor() {
        this.ctx = null;
    }
    _ensureCtx() {
        if (!this.ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) this.ctx = new Ctx;
        }
        return this.ctx;
    }
    play(freq, duration = .08, type = "sine", gain = .06) {
        const ctx = this._ensureCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.value = gain;
        osc.connect(g).connect(ctx.destination);
        osc.start();
        g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration + .02);
    }
    click() {
        this.play(440, .04, "square", .03);
    }
    submit() {
        this.play(300, .08, "triangle");
    }
    correct() {
        this.play(660, .1, "sine");
    }
    incorrect() {
        this.play(160, .12, "sawtooth", .04);
    }
    hint() {
        this.play(520, .15, "sine");
        setTimeout(() => this.play(780, .15, "sine"), 100);
    }
    win() {
        [ 523, 659, 784, 1047 ].forEach((f, i) => setTimeout(() => this.play(f, .18, "sine"), i * 110));
    }
    lose() {
        [ 392, 330, 262 ].forEach((f, i) => setTimeout(() => this.play(f, .22, "sawtooth", .04), i * 130));
    }
}

class RainbowdleUI {
    constructor(game, roster) {
        this.game = game;
        this.roster = roster;
        this.activeSuggestionIndex = -1;
        this.currentSuggestions = [];
        this.selectedOperatorName = null;
        this.sound = new SoundBoard;
        this.settings = RainbowdleStorage.loadSettings();
        this.prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this._lastAnnouncedHints = new Set;
        this.expandedHintField = null;
        this.operatorFilters = {
            side: "all",
            year: "all",
            gender: "all"
        };
        this.learnFilters = {
            side: "all",
            year: "all",
            gender: "all"
        };
        this.allGenders = [ ...new Set(this.roster.map(op => op.gender)) ].sort();
        this.learnTab = "reference";
        const savedQuizStats = RainbowdleStorage.loadQuizStats();
        this.quizCategories = new Set(savedQuizStats.categories && savedQuizStats.categories.length ? savedQuizStats.categories : QUIZ_ATTRIBUTES.map(a => a.key));
        this.quiz = {
            score: 0,
            total: 0,
            streak: 0,
            bestStreak: savedQuizStats.bestStreak || 0,
            allTimeAnswered: savedQuizStats.totalAnswered || 0,
            allTimeCorrect: savedQuizStats.totalCorrect || 0,
            current: null,
            answered: false,
            history: []
        };
        this._cacheDom();
        this._applySettingsToDom();
        this._bindEvents();
        this._buildQuizCategoryToggles();
        this._ensureToastStack();
        this._showMenu();
        this._hideLoading();
    }
    _hideLoading() {
        const loader = document.getElementById("loading-screen");
        if (!loader) return;
        requestAnimationFrame(() => {
            loader.classList.add("is-hidden");
            setTimeout(() => loader.remove(), 400);
        });
    }
    _restoreMode(mode) {
        try {
            const snapshot = RainbowdleStorage.loadGameState(mode);
            return !!(snapshot && this.game.restore(snapshot));
        } catch (e) {
            console.error(`Rainbowdle: failed to restore saved ${mode} game.`, e);
            return false;
        }
    }
    _persistGame() {
        RainbowdleStorage.saveGameState(this.game.mode, this.game.serialize());
    }
    _showMenu() {
        this._renderMenu();
        this.el.mainMenu.hidden = false;
        this.el.app.hidden = true;
        this.el.learnScreen.hidden = true;
        this.el.stickyHeader.style.display = "none";
    }
    _showGame() {
        this.el.mainMenu.hidden = true;
        this.el.app.hidden = false;
        this.el.learnScreen.hidden = true;
        this.el.stickyHeader.style.removeProperty("display");
        this.el.modeEyebrow.textContent = this.game.mode === "daily" ? `Daily Challenge · ${this.game.dateKey}` : "Classic Mode · Prototype Build";
        this.el.homeBtn.hidden = false;
        const isDaily = this.game.mode === "daily";
        this.el.newGameBtn.style.display = isDaily ? "none" : "";
        this.el.newGameBtnTop.textContent = isDaily ? "Give Up" : "New Game";
    }
    _renderMenu() {
        const dailyMeta = RainbowdleStorage.loadDailyMeta();
        const today = RainbowdleGame.todayKey();
        const classicSnap = RainbowdleStorage.loadGameState("classic");
        const classicInProgress = classicSnap && classicSnap.status === "playing" && (classicSnap.guessOrder || []).length > 0;
        this.el.modeClassicCta.textContent = classicInProgress ? "Continue" : "Play";
        this.el.modeClassicCta.className = "mode-card__cta" + (classicInProgress ? " mode-card__cta--continue" : "");
        const dailySnap = RainbowdleStorage.loadGameState("daily");
        const dailyIsToday = dailySnap && dailySnap.dateKey === today;
        const dailyDone = dailyIsToday && dailySnap.status !== "playing";
        const dailyInProgress = dailyIsToday && dailySnap.status === "playing" && (dailySnap.guessOrder || []).length > 0;
        this.el.modeDailyCta.textContent = dailyDone ? "Completed" : dailyInProgress ? "Continue" : "Play";
        this.el.modeDailyCta.className = "mode-card__cta" + (dailyDone ? " mode-card__cta--done" : dailyInProgress ? " mode-card__cta--continue" : "");
        if (dailyMeta.streak > 0) {
            this.el.menuDailyStreak.hidden = false;
            this.el.menuDailyStreakValue.textContent = dailyMeta.streak;
        } else {
            this.el.menuDailyStreak.hidden = true;
        }
    }
    _startMode(mode) {
        // If today's daily has already been completed, always reopen that
        // finished game (read-only end state) instead of generating a new
        // one -- resetting here would let the player replay the same
        // day's puzzle over and over.
        const resumed = this._restoreMode(mode);
        if (!resumed) {
            this.game.reset(mode);
            this._persistGame();
        }
        this._lastAnnouncedHints = new Set;
        this.expandedHintField = null;
        this.el.searchInput.value = "";
        this._setFeedback("");
        this._showGame();
        this.render();
    }
    _goHome() {
        if (this.multiplayerActive) {
            if (!window.confirm("Leave this multiplayer room? You won't be able to rejoin this round.")) {
                return;
            }
            this._leaveMultiplayerGame();
            return;
        }
        this._persistGame();
        this._showMenu();
    }
    // --- Multiplayer: reuses every singleplayer render/DOM code path by
    // temporarily swapping `this.game` for a lightweight adapter object
    // that exposes the same shape (guesses/status/mysteryOperator/
    // getAvailableHints/findOperatorByName). All the actual networking
    // lives in online-ui.js -- this class only knows how to render
    // whatever's in `this.game` and forward guess/leave intents outward
    // via the two callback hooks below.
    enterMultiplayerMode(adapter) {
        this._savedGame = this.game;
        this.game = adapter;
        this.multiplayerActive = true;
        this._lastAnnouncedHints = new Set;
        this.expandedHintField = null;
        this.el.searchInput.value = "";
        this._setFeedback("");
        this._closeAutocomplete();
        this.el.mainMenu.hidden = true;
        this.el.app.hidden = false;
        this.el.learnScreen.hidden = true;
        this.el.stickyHeader.style.removeProperty("display");
        this.el.modeEyebrow.textContent = `Multiplayer · Room ${adapter.roomCode || ""}`.trim();
        this.el.homeBtn.hidden = false;
        this.el.newGameBtn.style.display = "none";
        this.el.newGameBtnTop.style.display = "none";
        this.el.mpSidebar.hidden = false;
        this.el.mpSidebarCode.textContent = adapter.roomCode || "";
        this.render();
    }
    exitMultiplayerMode() {
        this.multiplayerActive = false;
        this.game = this._savedGame || this.game;
        this.el.mpSidebar.hidden = true;
        this.el.newGameBtn.style.removeProperty("display");
        this.el.newGameBtnTop.style.removeProperty("display");
        this._showMenu();
    }
    _leaveMultiplayerGame() {
        if (typeof this.onMultiplayerLeaveRequested === "function") {
            this.onMultiplayerLeaveRequested();
        } else {
            this.exitMultiplayerMode();
        }
    }
    _handleMultiplayerGuessSubmit() {
        const rawValue = this.el.searchInput.value.trim();
        if (!rawValue) {
            this._setFeedback("ENTER AN OPERATOR NAME");
            return;
        }
        if (this.game.status !== "playing") {
            this._setFeedback("ROUND OVER — WAITING ON OTHER PLAYERS");
            return;
        }
        const matched = this.game.findOperatorByName(rawValue);
        if (!matched) {
            this._setFeedback(`"${rawValue}" IS NOT A RECOGNIZED OPERATOR`);
            return;
        }
        if (this.game.guessedNames.has(matched.name)) {
            this._setFeedback(`You already guessed ${matched.name}!`);
            return;
        }
        if (typeof this.onMultiplayerGuessSubmit === "function") {
            this.onMultiplayerGuessSubmit(matched.name);
        }
    }
    renderMultiplayerGuessResult(won) {
        // Called by online-ui.js right after it pushes a new guess into the
        // adapter, so the shared render pipeline picks it up exactly like a
        // singleplayer guess would.
        this._setFeedback("");
        this.el.searchInput.value = "";
        this.selectedOperatorName = null;
        this._closeAutocomplete();
        this.render({ animateLastGuess: true });
        if (this.game.status !== "playing") {
            this._playSound(won ? "win" : "lose");
        } else if (won === false) {
            this._playSound("incorrect");
        }
    }
    setMultiplayerGuessError(message) {
        this._setFeedback(message || "");
    }
    renderMultiplayerSidebar({ statusText, players }) {
        if (this.el.mpSidebarStatus) this.el.mpSidebarStatus.textContent = statusText || "";
        const wrap = this.el.mpSidebarPlayers;
        if (!wrap) return;
        wrap.innerHTML = "";
        for (const p of players) {
            const card = document.createElement("div");
            card.className = "mp-player-card" + (p.isMe ? " mp-player-card--me" : "") + (p.offline ? " mp-player-card--gone" : "");

            const head = document.createElement("div");
            head.className = "mp-player-card__head";
            const dot = document.createElement("span");
            dot.className = "mp-player-card__dot" + (p.offline ? " mp-player-card__dot--offline" : "");
            head.appendChild(dot);
            const name = document.createElement("span");
            name.className = "mp-player-card__name";
            name.textContent = p.isMe ? `${p.username} (you)` : p.username;
            head.appendChild(name);
            if (p.isHost) {
                const badge = document.createElement("span");
                badge.className = "mp-player-card__badge";
                badge.textContent = "host";
                head.appendChild(badge);
            }
            card.appendChild(head);

            const grid = document.createElement("div");
            grid.className = "mp-player-card__grid";
            if (!p.guessRows || !p.guessRows.length) {
                const empty = document.createElement("div");
                empty.className = "mp-player-card__empty";
                empty.textContent = "No guesses yet…";
                grid.appendChild(empty);
            } else {
                for (const states of p.guessRows) {
                    const row = document.createElement("div");
                    row.className = "mp-player-card__row";
                    for (const state of states) {
                        const sq = document.createElement("span");
                        sq.className = `share-square share-square--${state}`;
                        row.appendChild(sq);
                    }
                    grid.appendChild(row);
                }
            }
            card.appendChild(grid);

            const status = document.createElement("div");
            status.className = "mp-player-card__status";
            status.textContent = p.solved
                ? `✅ Solved in ${p.guessCount}`
                : p.finished
                ? "❌ Did not solve it"
                : `${p.guessCount} / 10 guesses`;
            card.appendChild(status);

            wrap.appendChild(card);
        }
    }
    _showLearn() {
        this.el.mainMenu.hidden = true;
        this.el.app.hidden = true;
        this.el.learnScreen.hidden = false;
        this.el.stickyHeader.style.display = "none";
        this._setLearnTab(this.learnTab);
    }
    _setLearnTab(tab) {
        this.learnTab = tab;
        const isReference = tab === "reference";
        this.el.learnTabReference.classList.toggle("is-active", isReference);
        this.el.learnTabReference.setAttribute("aria-selected", String(isReference));
        this.el.learnTabQuiz.classList.toggle("is-active", !isReference);
        this.el.learnTabQuiz.setAttribute("aria-selected", String(!isReference));
        this.el.learnGrid.hidden = !isReference;
        this.el.learnSearchSection.hidden = !isReference;
        this.el.quizPanel.hidden = isReference;
        this.el.quizSettings.hidden = isReference;
        this.el.quizStatsRail.hidden = isReference;
        this.el.learnScreenTagline.textContent = isReference ? "Every operator, every loadout — filter, search, and study." : "Answer live, data-driven multiple choice questions built from the current roster.";
        this._syncLearnFilterPanel();
        if (isReference) {
            this._renderLearnGrid();
        } else {
            this._renderQuizStats();
            if (!this.quiz.current) this._nextQuizQuestion();
        }
    }
    _syncLearnFilterPanel() {
        const years = [ ...new Set(this.roster.map(op => op.releaseYear)) ].sort((a, b) => a - b);
        this._populateFilterPanel(this.el.learnFilterPanel, this.learnFilters, years, () => this._onLearnFilterChange(), this.allGenders);
    }
    _onLearnFilterChange() {
        this._syncLearnFilterPanel();
        if (this.learnTab === "reference") {
            this._renderLearnGrid();
        } else {
            this._nextQuizQuestion();
            this._renderQuizStats();
        }
    }
    _renderLearnGrid() {
        const query = this.el.learnSearch.value.trim().toLowerCase();
        this._syncLearnFilterPanel();
        let matches = this.roster.filter(op => op.name.toLowerCase().includes(query));
        if (this.learnFilters.side !== "all") matches = matches.filter(op => op.side === this.learnFilters.side);
        if (this.learnFilters.year !== "all") matches = matches.filter(op => op.releaseYear === this.learnFilters.year);
        if (this.learnFilters.gender !== "all") matches = matches.filter(op => op.gender === this.learnFilters.gender);
        matches.sort((a, b) => (a.side === b.side ? 0 : a.side === "Attack" ? -1 : 1) || a.releaseYear - b.releaseYear || a.name.localeCompare(b.name));
        this.el.learnFilterCount.textContent = `${matches.length} operator${matches.length === 1 ? "" : "s"}`;
        const grid = this.el.learnGrid;
        grid.innerHTML = "";
        if (!matches.length) {
            const empty = document.createElement("div");
            empty.className = "learn-grid__empty";
            empty.textContent = "No operators match your search or filters.";
            grid.appendChild(empty);
            return;
        }
        matches.forEach(op => grid.appendChild(this._buildLearnCard(op)));
    }
    _buildLearnCard(op) {
        const card = document.createElement("div");
        card.className = "learn-card";
        const portrait = createPortraitElement(op, {
            size: "learn"
        });
        card.appendChild(portrait);
        const body = document.createElement("div");
        body.className = "learn-card__body";
        const top = document.createElement("div");
        top.className = "learn-card__top";
        const name = document.createElement("span");
        name.className = "learn-card__name";
        name.textContent = op.name;
        top.appendChild(name);
        const year = document.createElement("span");
        year.className = "learn-card__year";
        year.textContent = op.releaseYear;
        top.appendChild(year);
        body.appendChild(top);
        const badges = document.createElement("div");
        badges.className = "learn-card__badges";
        const sideBadge = document.createElement("span");
        sideBadge.className = `learn-badge learn-badge--${op.side.toLowerCase()}`;
        sideBadge.textContent = op.side === "Attack" ? "⚔ Attack" : "🛡 Defense";
        badges.appendChild(sideBadge);
        const roleBadge = document.createElement("span");
        roleBadge.className = "learn-badge";
        roleBadge.textContent = op.role;
        badges.appendChild(roleBadge);
        const genderBadge = document.createElement("span");
        genderBadge.className = "learn-badge";
        genderBadge.textContent = op.gender;
        badges.appendChild(genderBadge);
        body.appendChild(badges);
        const stats = document.createElement("div");
        stats.className = "learn-card__stats";
        const speedSpan = document.createElement("span");
        speedSpan.innerHTML = `Speed <span class="learn-card__pips">${"●".repeat(op.speed)}${"○".repeat(3 - op.speed)}</span>`;
        const armorSpan = document.createElement("span");
        armorSpan.innerHTML = `Armor <span class="learn-card__pips">${"●".repeat(op.armor)}${"○".repeat(3 - op.armor)}</span>`;
        stats.appendChild(speedSpan);
        stats.appendChild(armorSpan);
        body.appendChild(stats);
        const sections = [ [ "Primary", op.primaryWeapons ], [ "Secondary", op.secondaryWeapons ], [ "Gadgets", op.secondaryGadgets ] ];
        sections.forEach(([label, values]) => {
            const line = document.createElement("div");
            line.className = "learn-card__section";
            const strong = document.createElement("b");
            strong.textContent = `${label}: `;
            line.appendChild(strong);
            line.appendChild(document.createTextNode(values.length ? values.join(", ") : "—"));
            body.appendChild(line);
        });
        card.appendChild(body);
        return card;
    }
    _buildQuizCategoryToggles() {
        const wrap = this.el.quizCategories;
        wrap.innerHTML = "";
        QUIZ_ATTRIBUTES.forEach(attr => {
            const id = `quiz-cat-${attr.key}`;
            const row = document.createElement("label");
            row.className = "quiz-cat-toggle";
            row.htmlFor = id;
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.id = id;
            cb.checked = this.quizCategories.has(attr.key);
            cb.addEventListener("change", () => {
                if (cb.checked) {
                    this.quizCategories.add(attr.key);
                } else if (this.quizCategories.size > 1) {
                    this.quizCategories.delete(attr.key);
                } else {
                    cb.checked = true;
                }
                this._persistQuizMeta();
                this._nextQuizQuestion();
                this._renderQuizStats();
            });
            row.appendChild(cb);
            row.appendChild(document.createTextNode(" " + attr.label));
            wrap.appendChild(row);
        });
    }
    _persistQuizMeta() {
        RainbowdleStorage.saveQuizStats({
            bestStreak: this.quiz.bestStreak,
            totalAnswered: this.quiz.allTimeAnswered,
            totalCorrect: this.quiz.allTimeCorrect,
            categories: [ ...this.quizCategories ]
        });
    }
    _getQuizPool() {
        let pool = this.roster;
        if (this.learnFilters.side !== "all") pool = pool.filter(op => op.side === this.learnFilters.side);
        if (this.learnFilters.year !== "all") pool = pool.filter(op => op.releaseYear === this.learnFilters.year);
        if (this.learnFilters.gender !== "all") pool = pool.filter(op => op.gender === this.learnFilters.gender);
        return pool;
    }
    _nextQuizQuestion() {
        const pool = this._getQuizPool();
        this.el.quizPoolCount.textContent = `${pool.length} operator${pool.length === 1 ? "" : "s"} in pool`;
        const question = generateQuizQuestion(pool, this.quizCategories);
        this.quiz.current = question;
        this.quiz.answered = false;
        this.el.quizNextBtn.hidden = true;
        this.el.quizFeedback.textContent = "";
        this.el.quizFeedback.className = "quiz-card__feedback";
        if (!question) {
            this.el.quizCard.hidden = true;
            this.el.quizEmpty.hidden = false;
            return;
        }
        this.el.quizCard.hidden = false;
        this.el.quizEmpty.hidden = true;
        this._renderQuizQuestion(question);
    }
    _renderQuizQuestion(question) {
        this.el.quizPrompt.textContent = `Q: ${question.prompt}`;
        const optionsEl = this.el.quizOptions;
        optionsEl.innerHTML = "";
        const letters = [ "A", "B", "C", "D", "E", "F" ];
        question.options.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "quiz-option";
            btn.dataset.name = opt.name;
            const letter = document.createElement("span");
            letter.className = "quiz-option__letter";
            letter.textContent = letters[i] || "?";
            btn.appendChild(letter);
            btn.appendChild(createPortraitElement(opt, {
                size: "quiz"
            }));
            const name = document.createElement("span");
            name.className = "quiz-option__name";
            name.textContent = opt.name;
            btn.appendChild(name);
            btn.addEventListener("click", () => this._handleQuizAnswer(question, opt.name, btn));
            optionsEl.appendChild(btn);
        });
    }
    _handleQuizAnswer(question, chosenName, btnEl) {
        if (this.quiz.answered) return;
        this.quiz.answered = true;
        const correct = chosenName === question.correctName;
        [ ...this.el.quizOptions.children ].forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.name === question.correctName) btn.classList.add("is-correct"); else if (btn === btnEl) btn.classList.add("is-incorrect");
        });
        this.quiz.total += 1;
        this.quiz.allTimeAnswered += 1;
        if (correct) {
            this.quiz.score += 1;
            this.quiz.streak += 1;
            this.quiz.allTimeCorrect += 1;
            this.quiz.bestStreak = Math.max(this.quiz.bestStreak, this.quiz.streak);
            this._playSound("correct");
        } else {
            this.quiz.streak = 0;
            this._playSound("incorrect");
        }
        this._persistQuizMeta();
        this.quiz.history.unshift({
            correct: correct,
            prompt: question.prompt,
            correctName: question.correctName
        });
        this.quiz.history = this.quiz.history.slice(0, 8);
        this.el.quizFeedback.textContent = correct ? "✓ Correct!" : `✕ Not quite — it was ${question.correctName}.`;
        this.el.quizFeedback.className = "quiz-card__feedback " + (correct ? "is-correct" : "is-incorrect");
        this.el.quizNextBtn.hidden = false;
        this.el.quizNextBtn.focus();
        this._renderQuizStats();
    }
    _renderQuizStats() {
        this.el.quizStatScore.textContent = this.quiz.score;
        this.el.quizStatTotal.textContent = this.quiz.total;
        this.el.quizStatStreak.textContent = this.quiz.streak;
        this.el.quizStatBest.textContent = this.quiz.bestStreak;
        const list = this.el.quizHistory;
        list.innerHTML = "";
        if (!this.quiz.history.length) {
            const li = document.createElement("li");
            li.className = "quiz-history__empty";
            li.textContent = "Answer a question to start your log.";
            list.appendChild(li);
            return;
        }
        this.quiz.history.forEach(h => {
            const li = document.createElement("li");
            li.className = "quiz-history__item " + (h.correct ? "is-correct" : "is-incorrect");
            li.title = h.prompt;
            li.textContent = `${h.correct ? "✓" : "✕"} ${h.correctName}`;
            list.appendChild(li);
        });
    }
    _resetQuizSession() {
        this.quiz.score = 0;
        this.quiz.total = 0;
        this.quiz.streak = 0;
        this.quiz.history = [];
        this._nextQuizQuestion();
        this._renderQuizStats();
    }
    _toggleFilterPanel(btn, panel, onOpenRender) {
        const willOpen = panel.hidden;
        panel.hidden = !willOpen;
        btn.setAttribute("aria-expanded", String(willOpen));
        btn.classList.toggle("is-active", willOpen);
        if (willOpen) onOpenRender();
    }
    _populateFilterPanel(panelEl, filterState, years, onChange, genders = []) {
        panelEl.innerHTML = "";
        const sideGroup = document.createElement("div");
        sideGroup.className = "filter-group";
        const sideLabel = document.createElement("span");
        sideLabel.className = "filter-group__label";
        sideLabel.textContent = "Side";
        sideGroup.appendChild(sideLabel);
        const sideToggle = document.createElement("div");
        sideToggle.className = "filter-toggle-group";
        [ [ "all", "All" ], [ "Attack", "Attack" ], [ "Defense", "Defense" ] ].forEach(([value, label]) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "filter-chip" + (value === "Attack" ? " filter-chip--attack" : value === "Defense" ? " filter-chip--defense" : "");
            if (filterState.side === value) chip.classList.add("is-selected");
            chip.textContent = label;
            chip.addEventListener("click", () => {
                filterState.side = value;
                onChange();
            });
            sideToggle.appendChild(chip);
        });
        sideGroup.appendChild(sideToggle);
        panelEl.appendChild(sideGroup);
        if (genders.length) {
            const genderGroup = document.createElement("div");
            genderGroup.className = "filter-group";
            const genderLabel = document.createElement("span");
            genderLabel.className = "filter-group__label";
            genderLabel.textContent = "Gender";
            genderGroup.appendChild(genderLabel);
            const genderToggle = document.createElement("div");
            genderToggle.className = "filter-toggle-group";
            [ [ "all", "All" ], ...genders.map(g => [ g, g ]) ].forEach(([value, label]) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "filter-chip" + (value === "Male" ? " filter-chip--male" : value === "Female" ? " filter-chip--female" : "");
                if (filterState.gender === value) chip.classList.add("is-selected");
                chip.textContent = label;
                chip.addEventListener("click", () => {
                    filterState.gender = value;
                    onChange();
                });
                genderToggle.appendChild(chip);
            });
            genderGroup.appendChild(genderToggle);
            panelEl.appendChild(genderGroup);
        }
        const yearGroup = document.createElement("div");
        yearGroup.className = "filter-group";
        const yearLabel = document.createElement("span");
        yearLabel.className = "filter-group__label";
        yearLabel.textContent = "Release Year";
        yearGroup.appendChild(yearLabel);
        const yearSelect = document.createElement("select");
        yearSelect.className = "filter-select";
        const allOpt = document.createElement("option");
        allOpt.value = "all";
        allOpt.textContent = "All Years";
        yearSelect.appendChild(allOpt);
        years.forEach(y => {
            const opt = document.createElement("option");
            opt.value = String(y);
            opt.textContent = String(y);
            yearSelect.appendChild(opt);
        });
        yearSelect.value = String(filterState.year);
        yearSelect.addEventListener("change", () => {
            filterState.year = yearSelect.value === "all" ? "all" : Number(yearSelect.value);
            onChange();
        });
        yearGroup.appendChild(yearSelect);
        panelEl.appendChild(yearGroup);
        const hasActiveFilters = filterState.side !== "all" || filterState.year !== "all" || filterState.gender !== "all";
        if (hasActiveFilters) {
            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className = "filter-clear-btn";
            clearBtn.textContent = "✕ Clear filters";
            clearBtn.addEventListener("click", () => {
                filterState.side = "all";
                filterState.year = "all";
                filterState.gender = "all";
                onChange();
            });
            panelEl.appendChild(clearBtn);
        }
    }
    _cacheDom() {
        this.el = {
            app: document.getElementById("app"),
            mainMenu: document.getElementById("main-menu"),
            mpSidebar: document.getElementById("mp-sidebar"),
            mpSidebarCode: document.getElementById("mp-sidebar-code"),
            mpSidebarStatus: document.getElementById("mp-sidebar-status"),
            mpSidebarPlayers: document.getElementById("mp-sidebar-players"),
            mpSidebarLeaveBtn: document.getElementById("mp-sidebar-leave-btn"),
            modeEyebrow: document.getElementById("mode-eyebrow"),
            homeBtn: document.getElementById("home-btn"),
            stickyHomeBtn: document.getElementById("sticky-home-btn"),
            stickyHeader: document.getElementById("sticky-header"),
            modeClassicBtn: document.getElementById("mode-classic-btn"),
            modeDailyBtn: document.getElementById("mode-daily-btn"),
            modeLearnBtn: document.getElementById("mode-learn-btn"),
            modeClassicCta: document.getElementById("mode-classic-cta"),
            modeDailyCta: document.getElementById("mode-daily-cta"),
            menuDailyStreak: document.getElementById("menu-daily-streak"),
            menuDailyStreakValue: document.getElementById("menu-daily-streak-value"),
            menuOperatorsBtn: document.getElementById("menu-operators-btn"),
            menuStatsBtn: document.getElementById("menu-stats-btn"),
            menuSettingsBtn: document.getElementById("menu-settings-btn"),
            menuHowtoBtn: document.getElementById("menu-howto-btn"),
            learnScreen: document.getElementById("learn-screen"),
            learnScreenTagline: document.getElementById("learn-screen-tagline"),
            learnHomeBtn: document.getElementById("learn-home-btn"),
            learnSearch: document.getElementById("learn-search"),
            learnSearchSection: document.getElementById("learn-search-section"),
            learnFilterBtn: document.getElementById("learn-filter-btn"),
            learnFilterPanel: document.getElementById("learn-filter-panel"),
            learnFilterCount: document.getElementById("learn-filter-count"),
            learnGrid: document.getElementById("learn-grid"),
            learnTabReference: document.getElementById("learn-tab-reference"),
            learnTabQuiz: document.getElementById("learn-tab-quiz"),
            quizSettings: document.getElementById("quiz-settings"),
            quizCategories: document.getElementById("quiz-categories"),
            quizPoolCount: document.getElementById("quiz-pool-count"),
            quizRestartBtn: document.getElementById("quiz-restart-btn"),
            quizPanel: document.getElementById("quiz-panel"),
            quizCard: document.getElementById("quiz-card"),
            quizPrompt: document.getElementById("quiz-prompt"),
            quizOptions: document.getElementById("quiz-options"),
            quizFeedback: document.getElementById("quiz-feedback"),
            quizNextBtn: document.getElementById("quiz-next-btn"),
            quizEmpty: document.getElementById("quiz-empty"),
            quizStatsRail: document.getElementById("quiz-stats-rail"),
            quizStatScore: document.getElementById("quiz-stat-score"),
            quizStatTotal: document.getElementById("quiz-stat-total"),
            quizStatStreak: document.getElementById("quiz-stat-streak"),
            quizStatBest: document.getElementById("quiz-stat-best"),
            quizHistory: document.getElementById("quiz-history"),
            operatorsFilterBtn: document.getElementById("operators-filter-btn"),
            operatorsFilterPanel: document.getElementById("operators-filter-panel"),
            operatorsFilterCount: document.getElementById("operators-filter-count"),
            howtoModal: document.getElementById("howto-modal"),
            howtoClose: document.getElementById("howto-close"),
            shareModal: document.getElementById("share-modal"),
            shareClose: document.getElementById("share-close"),
            shareCardResult: document.getElementById("share-card-result"),
            shareCardGrid: document.getElementById("share-card-grid"),
            shareCopyBtn: document.getElementById("share-copy-btn"),
            shareNativeBtn: document.getElementById("share-native-btn"),
            searchInput: document.getElementById("operator-search"),
            autocompleteList: document.getElementById("autocomplete-list"),
            guessBtn: document.getElementById("guess-btn"),
            gridBody: document.getElementById("grid-body"),
            hexTrack: document.getElementById("hex-track"),
            guessCounter: document.getElementById("guess-counter"),
            searchFeedback: document.getElementById("search-feedback"),
            endBanner: document.getElementById("end-banner"),
            newGameBtn: document.getElementById("new-game-btn"),
            newGameBtnTop: document.getElementById("new-game-btn-top"),
            hintPanel: document.getElementById("hint-panel"),
            operatorsBtn: document.getElementById("operators-btn"),
            operatorsModal: document.getElementById("operators-modal"),
            operatorsGrid: document.getElementById("operators-grid"),
            operatorsSearch: document.getElementById("operators-search"),
            operatorsClose: document.getElementById("operators-close"),
            statsBtn: document.getElementById("stats-btn"),
            statsModal: document.getElementById("stats-modal"),
            statsClose: document.getElementById("stats-close"),
            statsBody: document.getElementById("stats-body"),
            statsResetBtn: document.getElementById("stats-reset-btn"),
            statsResetConfirm: document.getElementById("stats-reset-confirm"),
            settingsBtn: document.getElementById("settings-btn"),
            settingsModal: document.getElementById("settings-modal"),
            settingsClose: document.getElementById("settings-close"),
            soundToggle: document.getElementById("setting-sound"),
            animToggle: document.getElementById("setting-animations"),
            themeSelect: document.getElementById("setting-theme"),
            newGameConfirmModal: document.getElementById("new-game-confirm-modal"),
            newGameConfirmCancel: document.getElementById("new-game-confirm-cancel"),
            newGameConfirmOk: document.getElementById("new-game-confirm-ok"),
            shareBtn: document.getElementById("share-btn"),
            shareFallback: document.getElementById("share-fallback")
        };
    }
    _bindEvents() {
        this.el.searchInput.addEventListener("input", () => this._handleSearchInput());
        this.el.searchInput.addEventListener("keydown", e => this._handleSearchKeydown(e));
        this.el.searchInput.addEventListener("focus", () => this._handleSearchInput());
        document.addEventListener("click", e => {
            if (!this.el.autocompleteList.contains(e.target) && e.target !== this.el.searchInput) {
                this._closeAutocomplete();
            }
        });
        this.el.guessBtn.addEventListener("click", () => this._handleGuessSubmit());
        this.el.newGameBtn.addEventListener("click", () => this._requestNewGame());
        this.el.newGameBtnTop.addEventListener("click", () => this._requestNewGame());
        this.el.modeClassicBtn.addEventListener("click", () => this._startMode("classic"));
        this.el.modeDailyBtn.addEventListener("click", () => this._startMode("daily"));
        this.el.modeLearnBtn.addEventListener("click", () => this._showLearn());
        this.el.homeBtn.addEventListener("click", () => this._goHome());
        this.el.stickyHomeBtn.addEventListener("click", () => this._goHome());
        this.el.mpSidebarLeaveBtn.addEventListener("click", () => this._leaveMultiplayerGame());
        this.el.menuOperatorsBtn.addEventListener("click", () => this._openModal(this.el.operatorsModal, this.el.operatorsSearch));
        this.el.menuStatsBtn.addEventListener("click", () => {
            this._renderStats();
            this._openModal(this.el.statsModal);
        });
        this.el.menuSettingsBtn.addEventListener("click", () => this._openModal(this.el.settingsModal));
        this.el.menuHowtoBtn.addEventListener("click", () => this._openModal(this.el.howtoModal));
        this.el.howtoClose.addEventListener("click", () => this._closeModal(this.el.howtoModal));
        this.el.learnHomeBtn.addEventListener("click", () => this._showMenu());
        this.el.learnSearch.addEventListener("input", () => this._renderLearnGrid());
        this.el.learnFilterBtn.addEventListener("click", () => this._toggleFilterPanel(this.el.learnFilterBtn, this.el.learnFilterPanel, () => this._syncLearnFilterPanel()));
        this.el.learnTabReference.addEventListener("click", () => this._setLearnTab("reference"));
        this.el.learnTabQuiz.addEventListener("click", () => this._setLearnTab("quiz"));
        this.el.quizRestartBtn.addEventListener("click", () => this._resetQuizSession());
        this.el.quizNextBtn.addEventListener("click", () => this._nextQuizQuestion());
        document.addEventListener("keydown", e => {
            if (this.learnTab !== "quiz" || this.el.learnScreen.hidden) return;
            if ([ "1", "2", "3", "4" ].includes(e.key)) {
                const idx = Number(e.key) - 1;
                const btn = this.el.quizOptions.children[idx];
                if (btn && !btn.disabled) btn.click();
            } else if ((e.key === "Enter" || e.key === " ") && !this.el.quizNextBtn.hidden) {
                e.preventDefault();
                this.el.quizNextBtn.click();
            }
        });
        this.el.operatorsBtn.addEventListener("click", () => this._openModal(this.el.operatorsModal, this.el.operatorsSearch));
        this.el.operatorsClose.addEventListener("click", () => this._closeModal(this.el.operatorsModal));
        this.el.operatorsSearch.addEventListener("input", () => this._filterOperatorGrid());
        this.el.operatorsFilterBtn.addEventListener("click", () => this._toggleFilterPanel(this.el.operatorsFilterBtn, this.el.operatorsFilterPanel, () => this._filterOperatorGrid()));
        this.el.statsBtn.addEventListener("click", () => {
            this._renderStats();
            this._openModal(this.el.statsModal);
        });
        this.el.statsClose.addEventListener("click", () => this._closeModal(this.el.statsModal));
        this.el.statsResetBtn.addEventListener("click", () => {
            this.el.statsResetConfirm.hidden = false;
        });
        document.getElementById("stats-reset-cancel").addEventListener("click", () => {
            this.el.statsResetConfirm.hidden = true;
        });
        document.getElementById("stats-reset-confirm-btn").addEventListener("click", () => {
            RainbowdleStorage.resetStats();
            this.el.statsResetConfirm.hidden = true;
            this._renderStats();
        });
        this.el.settingsBtn.addEventListener("click", () => this._openModal(this.el.settingsModal));
        this.el.settingsClose.addEventListener("click", () => this._closeModal(this.el.settingsModal));
        this.el.soundToggle.checked = this.settings.sound;
        this.el.animToggle.checked = this.settings.animations;
        this.el.themeSelect.value = this.settings.theme;
        this.el.soundToggle.addEventListener("change", () => this._updateSetting("sound", this.el.soundToggle.checked));
        this.el.animToggle.addEventListener("change", () => this._updateSetting("animations", this.el.animToggle.checked));
        this.el.themeSelect.addEventListener("change", () => this._updateSetting("theme", this.el.themeSelect.value));
        this.el.newGameConfirmCancel.addEventListener("click", () => this._closeModal(this.el.newGameConfirmModal));
        this.el.newGameConfirmOk.addEventListener("click", () => {
            this._closeModal(this.el.newGameConfirmModal);
            this._handleNewGame();
        });
        this.el.shareBtn.addEventListener("click", () => this._openShareModal());
        this.el.shareClose.addEventListener("click", () => this._closeModal(this.el.shareModal));
        this.el.shareCopyBtn.addEventListener("click", () => this._handleShareCopy());
        this.el.shareNativeBtn.addEventListener("click", () => this._handleShareNative());
        if (navigator.share) this.el.shareNativeBtn.hidden = false;
        this._allModals = [ this.el.operatorsModal, this.el.statsModal, this.el.settingsModal, this.el.newGameConfirmModal, this.el.shareModal, this.el.howtoModal ];
        this._allModals.forEach(modal => {
            modal.addEventListener("mousedown", e => {
                if (e.target === modal) this._closeModal(modal);
            });
        });
        document.addEventListener("keydown", e => {
            if (e.key !== "Escape") return;
            this._allModals.forEach(modal => {
                if (modal.classList.contains("is-open")) this._closeModal(modal);
            });
        });
        window.addEventListener("beforeunload", e => {
            if (this.game.status === "playing" && this.game.guesses.length > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        });
        document.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => this._playSound("click"));
        });
    }
    _playSound(name) {
        if (!this.settings.sound) return;
        try {
            this.sound[name] && this.sound[name]();
        } catch (e) {}
    }
    _updateSetting(key, value) {
        this.settings[key] = value;
        RainbowdleStorage.saveSettings(this.settings);
        this._applySettingsToDom();
    }
    _applySettingsToDom() {
        const root = document.documentElement;
        const reduceMotion = this.prefersReducedMotion || !this.settings.animations;
        root.classList.toggle("no-animations", reduceMotion);
        let theme = this.settings.theme;
        if (theme === "system") {
            theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        }
        root.setAttribute("data-theme", theme);
    }
    _openModal(modal, focusEl) {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        if (modal === this.el.operatorsModal) this._filterOperatorGrid();
        setTimeout(() => (focusEl || modal.querySelector("button, input"))?.focus(), 0);
    }
    _closeModal(modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
    }
    _filterOperatorGrid() {
        const query = this.el.operatorsSearch.value.trim().toLowerCase();
        const grid = this.el.operatorsGrid;
        grid.innerHTML = "";
        const years = [ ...new Set(this.roster.map(op => op.releaseYear)) ].sort((a, b) => a - b);
        this._populateFilterPanel(this.el.operatorsFilterPanel, this.operatorFilters, years, () => this._filterOperatorGrid(), this.allGenders);
        let matches = this.roster.filter(op => op.name.toLowerCase().includes(query));
        if (this.operatorFilters.side !== "all") matches = matches.filter(op => op.side === this.operatorFilters.side);
        if (this.operatorFilters.year !== "all") matches = matches.filter(op => op.releaseYear === this.operatorFilters.year);
        if (this.operatorFilters.gender !== "all") matches = matches.filter(op => op.gender === this.operatorFilters.gender);
        this.el.operatorsFilterCount.textContent = `${matches.length} operator${matches.length === 1 ? "" : "s"}`;
        if (matches.length === 0) {
            const empty = document.createElement("p");
            empty.className = "operators-grid__empty";
            empty.textContent = "No operators match your search.";
            grid.appendChild(empty);
            return;
        }
        const bySide = {
            Attack: [],
            Defense: []
        };
        matches.forEach(op => {
            (bySide[op.side] || (bySide[op.side] = [])).push(op);
        });
        const sortChrono = (a, b) => a.releaseYear - b.releaseYear || a.name.localeCompare(b.name);
        Object.values(bySide).forEach(list => list.sort(sortChrono));
        const sectionOrder = [ "Attack", "Defense" ];
        sectionOrder.forEach(side => {
            const ops = bySide[side];
            if (!ops || !ops.length) return;
            const section = document.createElement("div");
            section.className = `operators-section operators-section--${side.toLowerCase()}`;
            const heading = document.createElement("h3");
            heading.className = "operators-section__heading";
            const headingLabel = document.createElement("span");
            headingLabel.textContent = side === "Attack" ? "⚔ Attackers" : "🛡 Defenders";
            heading.appendChild(headingLabel);
            const count = document.createElement("span");
            count.className = "operators-section__count";
            count.textContent = ops.length;
            heading.appendChild(count);
            section.appendChild(heading);
            const sectionGrid = document.createElement("div");
            sectionGrid.className = "operators-grid__cards";
            ops.forEach(op => {
                const card = document.createElement("div");
                card.className = "op-card";
                const portrait = createPortraitElement(op, {
                    size: "card"
                });
                card.appendChild(portrait);
                const name = document.createElement("span");
                name.className = "op-card__name";
                name.textContent = op.name;
                card.appendChild(name);
                const year = document.createElement("span");
                year.className = "op-card__year";
                year.textContent = op.releaseYear;
                card.appendChild(year);
                sectionGrid.appendChild(card);
            });
            section.appendChild(sectionGrid);
            grid.appendChild(section);
        });
    }
    _renderStats() {
        const stats = RainbowdleStorage.loadStats();
        const winRate = stats.gamesPlayed ? Math.round(stats.gamesWon / stats.gamesPlayed * 100) : 0;
        const avgGuesses = stats.gamesWon ? (stats.totalGuessesOnWins / stats.gamesWon).toFixed(1) : "—";
        this.el.statsBody.innerHTML = "";
        const rows = [ [ "Games Played", stats.gamesPlayed ], [ "Wins", stats.gamesWon ], [ "Win Rate", `${winRate}%` ], [ "Current Streak", stats.currentStreak ], [ "Best Streak", stats.bestStreak ], [ "Average Guesses", avgGuesses ] ];
        rows.forEach(([label, value]) => {
            const row = document.createElement("div");
            row.className = "stats-row";
            row.innerHTML = `<span class="stats-row__label">${label}</span><span class="stats-row__value">${value}</span>`;
            this.el.statsBody.appendChild(row);
        });
    }
    _handleSearchInput() {
        const query = this.el.searchInput.value.trim().toLowerCase();
        this.selectedOperatorName = null;
        this._setFeedback("");
        if (!query) {
            this._closeAutocomplete();
            return;
        }
        const available = this.roster.filter(op => !this.game.guessedNames.has(op.name));
        const matches = available.filter(op => op.name.toLowerCase().includes(query)).sort((a, b) => {
            const an = a.name.toLowerCase();
            const bn = b.name.toLowerCase();
            const aExact = an === query ? 0 : an.startsWith(query) ? 1 : 2;
            const bExact = bn === query ? 0 : bn.startsWith(query) ? 1 : 2;
            if (aExact !== bExact) return aExact - bExact;
            return a.name.localeCompare(b.name);
        }).slice(0, 8);
        this.currentSuggestions = matches;
        this.activeSuggestionIndex = -1;
        this._renderAutocomplete(matches, query);
    }
    _highlightMatch(name, query) {
        const idx = name.toLowerCase().indexOf(query);
        if (idx === -1) return name;
        const before = name.slice(0, idx);
        const match = name.slice(idx, idx + query.length);
        const after = name.slice(idx + query.length);
        const span = document.createElement("span");
        span.append(before, Object.assign(document.createElement("mark"), {
            textContent: match
        }), after);
        return span;
    }
    _renderAutocomplete(matches, query) {
        const list = this.el.autocompleteList;
        list.innerHTML = "";
        this.el.searchInput.setAttribute("aria-expanded", matches.length > 0 ? "true" : "false");
        if (matches.length === 0) {
            this._closeAutocomplete();
            return;
        }
        matches.forEach((op, index) => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.setAttribute("role", "option");
            item.id = `ac-item-${index}`;
            item.dataset.index = String(index);
            const thumb = createPortraitElement(op, {
                size: "thumb"
            });
            item.appendChild(thumb);
            const name = document.createElement("span");
            name.className = "autocomplete-item__name";
            name.appendChild(this._highlightMatch(op.name, query || ""));
            item.appendChild(name);
            const meta = document.createElement("span");
            meta.className = "autocomplete-item__meta";
            meta.textContent = op.side;
            item.appendChild(meta);
            item.addEventListener("mousedown", e => {
                e.preventDefault();
                this._selectSuggestion(op);
            });
            list.appendChild(item);
        });
    }
    _closeAutocomplete() {
        this.el.autocompleteList.innerHTML = "";
        this.currentSuggestions = [];
        this.activeSuggestionIndex = -1;
        this.el.searchInput.setAttribute("aria-expanded", "false");
    }
    _selectSuggestion(operator) {
        this.el.searchInput.value = operator.name;
        this.selectedOperatorName = operator.name;
        this._closeAutocomplete();
        this.el.guessBtn.focus();
    }
    _handleSearchKeydown(e) {
        const items = this.el.autocompleteList.querySelectorAll(".autocomplete-item");
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!items.length) return;
            this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % items.length;
            this._highlightActiveSuggestion(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!items.length) return;
            this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + items.length) % items.length;
            this._highlightActiveSuggestion(items);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (this.activeSuggestionIndex >= 0 && this.currentSuggestions[this.activeSuggestionIndex]) {
                this._selectSuggestion(this.currentSuggestions[this.activeSuggestionIndex]);
            } else {
                this._handleGuessSubmit();
            }
        } else if (e.key === "Escape") {
            this._closeAutocomplete();
        }
    }
    _highlightActiveSuggestion(items) {
        items.forEach((item, i) => {
            item.classList.toggle("is-active", i === this.activeSuggestionIndex);
        });
        const active = items[this.activeSuggestionIndex];
        if (active) {
            active.scrollIntoView({
                block: "nearest"
            });
            this.el.searchInput.setAttribute("aria-activedescendant", active.id);
        }
    }
    _handleGuessSubmit() {
        if (this.multiplayerActive) {
            this._handleMultiplayerGuessSubmit();
            return;
        }
        const rawValue = this.el.searchInput.value.trim();
        if (!rawValue) {
            this._setFeedback("ENTER AN OPERATOR NAME");
            return;
        }
        const matchedOperator = this.game.findOperatorByName(rawValue);
        if (!matchedOperator) {
            this._setFeedback(`"${rawValue}" IS NOT A RECOGNIZED OPERATOR`);
            return;
        }
        const result = this.game.submitGuess(rawValue);
        if (!result.ok) {
            if (result.reason === "duplicate") {
                this._setFeedback(`You already guessed ${result.operator.name}!`);
            } else if (result.reason === "game-over") {
                this._setFeedback("ROUND OVER — START A NEW GAME");
            } else {
                this._setFeedback(`"${rawValue}" IS NOT A RECOGNIZED OPERATOR`);
            }
            return;
        }
        this._playSound(result.guess.isCorrect ? "correct" : "submit");
        this._setFeedback("");
        this.el.searchInput.value = "";
        this.selectedOperatorName = null;
        this._closeAutocomplete();
        this._persistGame();
        this.render({
            animateLastGuess: true
        });
        if (this.game.status !== "playing") {
            const won = this.game.status === "won";
            RainbowdleStorage.recordResult(won, this.game.guesses.length);
            if (this.game.mode === "daily") {
                RainbowdleStorage.recordDailyResult(won, this.game.dateKey);
            }
            this._playSound(won ? "win" : "lose");
        } else if (!result.guess.isCorrect) {
            this._playSound("incorrect");
        }
    }
    _setFeedback(message) {
        this.el.searchFeedback.textContent = message;
    }
    _requestNewGame() {
        if (this.multiplayerActive) return;
        if (this.game.mode === "daily") {
            this._goHome();
            return;
        }
        const unfinished = this.game.status === "playing" && this.game.guesses.length > 0;
        if (unfinished) {
            this._openModal(this.el.newGameConfirmModal);
        } else {
            this._handleNewGame();
        }
    }
    _handleNewGame() {
        this.game.reset("classic");
        this.el.searchInput.value = "";
        this._setFeedback("");
        this._closeAutocomplete();
        this._lastAnnouncedHints = new Set;
        this.expandedHintField = null;
        this._persistGame();
        this.render();
    }
    _shareOutcomeLabel() {
        const total = this.game.guesses.length;
        const outcome = this.game.status === "won" ? `${total}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
        const modeLabel = this.game.mode === "daily" ? `Daily · ${this.game.dateKey}` : this.game.mode === "multiplayer" ? `Multiplayer · Room ${this.game.roomCode || ""}`.trim() : "Classic";
        return `${outcome} — ${modeLabel}`;
    }
    _buildShareText() {
        const total = this.game.guesses.length;
        const outcome = this.game.status === "won" ? `${total}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
        const heading = this.game.mode === "daily" ? `Rainbowdle Daily (${this.game.dateKey})` : "Rainbowdle";
        const lines = this.game.guesses.map(g => g.results.map(r => STATE_EMOJI[r.state]).join(""));
        return `${heading}\n${outcome}\n\n${lines.join("\n")}`;
    }
    _openShareModal() {
        this.el.shareCardResult.textContent = this._shareOutcomeLabel();
        this.el.shareCardGrid.innerHTML = "";
        this.game.guesses.forEach(g => {
            const row = document.createElement("div");
            row.className = "share-preview__row";
            g.results.forEach(r => {
                const sq = document.createElement("span");
                sq.className = `share-square share-square--${r.state}`;
                row.appendChild(sq);
            });
            this.el.shareCardGrid.appendChild(row);
        });
        this.el.shareFallback.hidden = true;
        this._openModal(this.el.shareModal, this.el.shareCopyBtn);
    }
    async _handleShareCopy() {
        const text = this._buildShareText();
        this.el.shareFallback.hidden = true;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                this._toast("Result copied to clipboard!");
                return;
            }
            throw new Error("Clipboard API unavailable");
        } catch (e) {
            this.el.shareFallback.hidden = false;
            this.el.shareFallback.value = text;
            this.el.shareFallback.focus();
            this.el.shareFallback.select();
            this._toast("Copy failed — text selected, press Ctrl/Cmd+C");
        }
    }
    async _handleShareNative() {
        const text = this._buildShareText();
        try {
            await navigator.share({
                text: text,
                title: "Rainbowdle"
            });
        } catch (e) {}
    }
    _ensureToastStack() {
        if (document.querySelector(".toast-stack")) return;
        const stack = document.createElement("div");
        stack.className = "toast-stack";
        stack.setAttribute("aria-live", "polite");
        document.body.appendChild(stack);
        this._toastStack = stack;
    }
    _toast(message) {
        if (!this._toastStack) this._ensureToastStack();
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        this._toastStack.appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
    }
    render({animateLastGuess: animateLastGuess = false} = {}) {
        this._renderGrid({
            animateLastGuess: animateLastGuess
        });
        this._renderHexTrack();
        this._renderGuessCounter();
        this._renderHintPanel();
        this._renderEndBanner();
        this._renderInputState();
    }
    _renderGrid({animateLastGuess: animateLastGuess}) {
        const body = this.el.gridBody;
        body.innerHTML = "";
        this.game.guesses.forEach((guess, row) => {
            const rowEl = document.createElement("div");
            rowEl.className = "guess-row";
            const shouldAnimate = animateLastGuess && row === this.game.guesses.length - 1 && !this._reducedMotion();
            rowEl.appendChild(this._buildOperatorCell(guess.operator, shouldAnimate));
            guess.results.forEach((result, i) => {
                rowEl.appendChild(this._buildAttributeCell(result, shouldAnimate, i + 1));
            });
            body.appendChild(rowEl);
        });
    }
    _reducedMotion() {
        return this.prefersReducedMotion || !this.settings.animations;
    }
    _buildEmptyOperatorCell() {
        const cell = document.createElement("div");
        cell.className = "cell cell--empty cell--operator";
        return cell;
    }
    _buildEmptyCell() {
        const cell = document.createElement("div");
        cell.className = "cell cell--empty";
        return cell;
    }
    _buildOperatorCell(operator, animate) {
        const cell = document.createElement("div");
        cell.className = "cell cell--operator";
        if (animate) {
            cell.classList.add("cell--reveal");
            cell.style.setProperty("--reveal-delay", "0s");
        }
        const portrait = createPortraitElement(operator, {
            size: "grid"
        });
        if (animate) portrait.classList.add("op-portrait-pop");
        cell.appendChild(portrait);
        const name = document.createElement("span");
        name.className = "op-name";
        name.textContent = operator.name;
        cell.appendChild(name);
        return cell;
    }
    _buildAttributeCell(result, animate, position) {
        const cell = document.createElement("div");
        cell.className = `cell cell--${result.state}`;
        if (animate) {
            cell.classList.add("cell--reveal");
            cell.style.setProperty("--reveal-delay", `${position * .12}s`);
        }
        const icon = STATE_ICON[result.state];
        if (icon) {
            const iconEl = document.createElement("div");
            iconEl.className = "cell__icon";
            iconEl.textContent = icon;
            cell.appendChild(iconEl);
        }
        const value = document.createElement("div");
        value.className = "cell__value";
        value.textContent = this._formatValue(result);
        if (result.key === "side") {
            value.classList.add(result.guessValue === "Attack" ? "side-value--attack" : "side-value--defense");
        }
        cell.appendChild(value);
        cell.title = `${result.label}: ${result.guessValue}`;
        cell.setAttribute("aria-label", `${result.label}: ${result.guessValue}, ${result.state}`);
        return cell;
    }
    _formatValue(result) {
        if (result.key === "releaseYear") return String(result.guessValue);
        if (result.key === "speed" || result.key === "armor") return "●".repeat(result.guessValue);
        return result.guessValue;
    }
    _renderHexTrack() {
        const track = this.el.hexTrack;
        track.innerHTML = "";
        for (let i = 0; i < MAX_GUESSES; i++) {
            const hex = document.createElement("div");
            hex.className = "hex";
            if (i < this.game.guesses.length) {
                hex.classList.add("hex--used");
                if (this.game.guesses[i].isCorrect) hex.classList.add("hex--won");
            }
            track.appendChild(hex);
        }
    }
    _renderGuessCounter() {
        this.el.guessCounter.textContent = `${this.game.guesses.length} / ${MAX_GUESSES}`;
    }
    _renderHintPanel() {
        const panel = this.el.hintPanel;
        panel.innerHTML = "";
        const hints = this.game.getAvailableHints();
        const guessesMade = this.game.guesses.length;
        const row = document.createElement("div");
        row.className = "hint-circle-row";
        hints.forEach(hint => {
            const meta = HINT_CIRCLE_META[hint.field] || {
                icon: "❔",
                short: hint.label
            };
            const triesLeft = Math.max(0, hint.afterGuesses - guessesMade);
            const wrap = document.createElement("button");
            wrap.type = "button";
            wrap.className = "hint-circle" + (hint.unlocked ? " hint-circle--unlocked" : " hint-circle--locked");
            wrap.disabled = !hint.unlocked;
            wrap.setAttribute("aria-pressed", String(this.expandedHintField === hint.field));
            const isNew = hint.unlocked && !this._lastAnnouncedHints.has(hint.field) && guessesMade === hint.afterGuesses && !this._reducedMotion();
            if (isNew) {
                wrap.classList.add("hint-circle--just-unlocked");
                this._lastAnnouncedHints.add(hint.field);
                this._playSound("hint");
                this.expandedHintField = hint.field;
            } else if (hint.unlocked) {
                this._lastAnnouncedHints.add(hint.field);
            }
            if (this.expandedHintField === hint.field) {
                wrap.classList.add("hint-circle--expanded");
            }
            const badge = document.createElement("div");
            badge.className = "hint-circle__badge";
            badge.textContent = meta.icon;
            wrap.appendChild(badge);
            const label = document.createElement("div");
            label.className = "hint-circle__label";
            label.textContent = `${meta.short} hint in ${triesLeft} ${triesLeft === 1 ? "try" : "tries"}`;
            wrap.appendChild(label);
            if (hint.unlocked) {
                wrap.addEventListener("click", () => {
                    this.expandedHintField = this.expandedHintField === hint.field ? null : hint.field;
                    this._renderHintPanel();
                });
            }
            row.appendChild(wrap);
        });
        panel.appendChild(row);
        const activeHint = hints.find(h => h.unlocked && h.field === this.expandedHintField);
        if (activeHint) {
            const expansion = document.createElement("div");
            expansion.className = "hint-expansion";
            const values = activeHint.values.length ? activeHint.values : [ "None" ];
            values.forEach(val => {
                const box = document.createElement("div");
                box.className = "hint-item-box";
                const icon = document.createElement("div");
                icon.className = "hint-item-box__icon";
                icon.textContent = HINT_EMOJI[activeHint.field] || "•";
                box.appendChild(icon);
                const name = document.createElement("div");
                name.className = "hint-item-box__name";
                name.textContent = val;
                box.appendChild(name);
                expansion.appendChild(box);
            });
            panel.appendChild(expansion);
        }
    }
    _renderEndBanner() {
        const banner = this.el.endBanner;
        if (this.game.status === "playing") {
            banner.classList.remove("is-visible");
            banner.innerHTML = "";
            this.el.shareBtn.hidden = true;
            return;
        }
        banner.innerHTML = "";
        banner.classList.add("is-visible");
        banner.classList.remove("end-banner--won", "end-banner--lost");
        banner.classList.add(this.game.status === "won" ? "end-banner--won" : "end-banner--lost");
        const portrait = createPortraitElement(this.game.mysteryOperator, {
            size: "banner"
        });
        banner.appendChild(portrait);
        const text = document.createElement("div");
        text.className = "end-banner__text";
        const headline = document.createElement("p");
        headline.className = "end-banner__headline";
        headline.textContent = this.game.status === "won" ? "🎉 YOU GOT IT!" : "Game Over";
        text.appendChild(headline);
        const name = document.createElement("p");
        name.className = "end-banner__name";
        name.textContent = this.game.mysteryOperator.name;
        text.appendChild(name);
        const sub = document.createElement("p");
        sub.className = "end-banner__sub";
        sub.textContent = this.game.status === "won" ? `You solved Rainbowdle in ${this.game.guesses.length} guess${this.game.guesses.length === 1 ? "" : "es"}!` : `The operator was ${this.game.mysteryOperator.name}.`;
        text.appendChild(sub);
        banner.appendChild(text);
        this.el.shareBtn.hidden = false;
        this.el.shareFallback.hidden = true;
    }
    _renderInputState() {
        const isOver = this.game.status !== "playing";
        this.el.searchInput.disabled = isOver;
        this.el.guessBtn.disabled = isOver;
        this.el.searchInput.placeholder = isOver ? "ROUND OVER" : "Search operator name…";
    }
}