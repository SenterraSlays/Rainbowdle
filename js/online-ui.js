document.addEventListener("DOMContentLoaded", () => {
    const auth = new RainbowdleAuth();
    const mp = new RainbowdleMultiplayer(auth);
    window.__rainbowdleOnline = { auth, mp };

    const originalRecordResult = RainbowdleStorage.recordResult.bind(RainbowdleStorage);
    RainbowdleStorage.recordResult = function (won, guessCount) {
        const result = originalRecordResult(won, guessCount);
        RainbowdleLeaderboard.submitSingleplayerResult(auth, won, guessCount);
        return result;
    };

    const el = {
        accountArea: document.getElementById("menu-account-area"),
        loginBtn: document.getElementById("menu-login-btn"),

        authModal: document.getElementById("auth-modal"),
        authClose: document.getElementById("auth-close"),
        authTitle: document.getElementById("auth-modal-title"),
        authTabLogin: document.getElementById("auth-tab-login"),
        authTabSignup: document.getElementById("auth-tab-signup"),
        authForm: document.getElementById("auth-form"),
        authEmail: document.getElementById("auth-email"),
        authPassword: document.getElementById("auth-password"),
        authSubmit: document.getElementById("auth-submit"),
        authError: document.getElementById("auth-error"),
        authBody: document.getElementById("auth-body"),

        usernameBody: document.getElementById("username-body"),
        usernameForm: document.getElementById("username-form"),
        usernameInput: document.getElementById("username-input"),
        usernameError: document.getElementById("username-error"),

        leaderboardModal: document.getElementById("leaderboard-modal"),
        leaderboardClose: document.getElementById("leaderboard-close"),
        leaderboardBody: document.getElementById("leaderboard-body"),
        modeLeaderboardBtn: document.getElementById("mode-leaderboard-btn"),

        multiplayerModal: document.getElementById("multiplayer-modal"),
        multiplayerClose: document.getElementById("multiplayer-close"),
        modeMultiplayerBtn: document.getElementById("mode-multiplayer-btn"),

        mpViewMenu: document.getElementById("mp-view-menu"),
        mpSignedOutHint: document.getElementById("mp-signed-out-hint"),
        mpCreateBtn: document.getElementById("mp-create-btn"),
        mpJoinOpenBtn: document.getElementById("mp-join-open-btn"),

        mpViewJoin: document.getElementById("mp-view-join"),
        mpJoinCode: document.getElementById("mp-join-code"),
        mpJoinError: document.getElementById("mp-join-error"),
        mpJoinBackBtn: document.getElementById("mp-join-back-btn"),
        mpJoinSubmitBtn: document.getElementById("mp-join-submit-btn"),

        mpViewLobby: document.getElementById("mp-view-lobby"),
        mpRoomCode: document.getElementById("mp-room-code"),
        mpCopyCodeBtn: document.getElementById("mp-copy-code-btn"),
        mpPlayersList: document.getElementById("mp-players-list"),
        mpLobbyStatus: document.getElementById("mp-lobby-status"),
        mpLeaveBtn: document.getElementById("mp-leave-btn"),
        mpStartBtn: document.getElementById("mp-start-btn"),

        mpViewGame: document.getElementById("mp-view-game"),
        mpGameProgress: document.getElementById("mp-game-progress"),
        mpOperatorSearch: document.getElementById("mp-operator-search"),
        mpAutocompleteList: document.getElementById("mp-autocomplete-list"),
        mpGuessBtn: document.getElementById("mp-guess-btn"),
        mpSearchFeedback: document.getElementById("mp-search-feedback"),
        mpHintPanel: document.getElementById("mp-hint-panel"),
        mpGridBody: document.getElementById("mp-grid-body"),
        mpEndBanner: document.getElementById("mp-end-banner"),

        mpViewResults: document.getElementById("mp-view-results"),
        mpResultsOperator: document.getElementById("mp-results-operator"),
        mpResultsList: document.getElementById("mp-results-list"),
        mpResultsLeaveBtn: document.getElementById("mp-results-leave-btn"),
    };

    function openModal(modal) {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
    }
    function closeModal(modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
    }
    [el.authModal, el.leaderboardModal, el.multiplayerModal].forEach((modal) => {
        modal.addEventListener("mousedown", (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    function renderAccountArea() {
        el.accountArea.innerHTML = "";
        if (auth.isLoggedIn && auth.profile) {
            const wrap = document.createElement("div");
            wrap.className = "menu__account-info";
            wrap.innerHTML = `<span class="menu__account-name">👤 ${escapeHtml(auth.profile.display_name || auth.profile.username)}</span>`;
            const logoutBtn = document.createElement("button");
            logoutBtn.className = "toolbar__btn";
            logoutBtn.type = "button";
            logoutBtn.textContent = "Logout";
            logoutBtn.addEventListener("click", () => auth.logOut());
            wrap.appendChild(logoutBtn);
            el.accountArea.appendChild(wrap);
        } else {
            el.accountArea.appendChild(el.loginBtn);
        }
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    el.loginBtn.addEventListener("click", () => {
        el.authBody.hidden = false;
        el.usernameBody.hidden = true;
        el.authTitle.textContent = "Login";
        openModal(el.authModal);
    });
    el.authClose.addEventListener("click", () => closeModal(el.authModal));

    function setAuthTab(tab) {
        const isLogin = tab === "login";
        el.authTabLogin.classList.toggle("is-active", isLogin);
        el.authTabSignup.classList.toggle("is-active", !isLogin);
        el.authTitle.textContent = isLogin ? "Login" : "Create Account";
        el.authSubmit.textContent = isLogin ? "Login" : "Create Account";
        el.authForm.dataset.mode = tab;
        el.authError.hidden = true;
    }
    el.authTabLogin.addEventListener("click", () => setAuthTab("login"));
    el.authTabSignup.addEventListener("click", () => setAuthTab("signup"));
    setAuthTab("login");

    el.authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        el.authError.hidden = true;
        el.authSubmit.disabled = true;
        const email = el.authEmail.value.trim();
        const password = el.authPassword.value;
        const mode = el.authForm.dataset.mode || "login";

        const result = mode === "login" ? await auth.logIn(email, password) : await auth.signUp(email, password);
        el.authSubmit.disabled = false;

        if (result.error) {
            el.authError.textContent = result.error;
            el.authError.hidden = false;
            return;
        }

        if (auth.needsUsername) {
            el.authBody.hidden = true;
            el.usernameBody.hidden = false;
            el.authTitle.textContent = "Choose Username";
        } else {
            closeModal(el.authModal);
            el.authForm.reset();
        }
    });

    el.usernameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        el.usernameError.hidden = true;
        const username = el.usernameInput.value.trim();
        const result = await auth.createProfile(username, username);
        if (result.error) {
            el.usernameError.textContent = result.error;
            el.usernameError.hidden = false;
            return;
        }
        closeModal(el.authModal);
        el.usernameForm.reset();
        el.authForm.reset();
    });

    auth.onChange(() => {
        renderAccountArea();
        if (auth.needsUsername && el.authModal.classList.contains("is-open") === false) {
            el.authBody.hidden = true;
            el.usernameBody.hidden = false;
            el.authTitle.textContent = "Choose Username";
            openModal(el.authModal);
        }
    });
    renderAccountArea();

    el.modeLeaderboardBtn.addEventListener("click", async () => {
        openModal(el.leaderboardModal);
        el.leaderboardBody.innerHTML = `<p class="leaderboard-loading">Loading leaderboard…</p>`;
        const { rows, error } = await RainbowdleLeaderboard.fetchTop(50);
        if (error) {
            el.leaderboardBody.innerHTML = `<p class="leaderboard-loading">${escapeHtml(error)}</p>`;
            return;
        }
        if (!rows.length) {
            el.leaderboardBody.innerHTML = `<p class="leaderboard-loading">No games recorded yet. Be the first!</p>`;
            return;
        }
        const medals = ["🥇", "🥈", "🥉"];
        const rowsHtml = rows
            .map((r, i) => {
                const rank = medals[i] || i + 1;
                return `<div class="leaderboard-row">
                    <span class="leaderboard-rank">${rank}</span>
                    <span class="leaderboard-name">${escapeHtml(r.display_name || r.username)}</span>
                    <span class="leaderboard-stat">${r.games_won}</span>
                    <span class="leaderboard-stat">${r.average_guesses ?? "–"}</span>
                    <span class="leaderboard-stat">${r.win_percentage}%</span>
                    <span class="leaderboard-stat">${r.best_streak}</span>
                </div>`;
            })
            .join("");
        el.leaderboardBody.innerHTML = `
            <div class="leaderboard-row leaderboard-row--header">
                <span>Rank</span><span>Player</span><span>Wins</span><span>Avg</span><span>Win%</span><span>Best Streak</span>
            </div>
            ${rowsHtml}
        `;
    });
    el.leaderboardClose.addEventListener("click", () => closeModal(el.leaderboardModal));

    function mpShowView(name) {
        [el.mpViewMenu, el.mpViewJoin, el.mpViewLobby, el.mpViewGame, el.mpViewResults].forEach((v) => (v.hidden = true));
        ({
            menu: el.mpViewMenu,
            join: el.mpViewJoin,
            lobby: el.mpViewLobby,
            game: el.mpViewGame,
            results: el.mpViewResults,
        }[name].hidden = false);
    }

    el.modeMultiplayerBtn.addEventListener("click", () => {
        if (!auth.isLoggedIn) {
            el.mpSignedOutHint.hidden = false;
        } else {
            el.mpSignedOutHint.hidden = true;
        }
        mpShowView(mp.room ? "lobby" : "menu");
        openModal(el.multiplayerModal);
    });
    el.multiplayerClose.addEventListener("click", () => closeModal(el.multiplayerModal));

    el.mpCreateBtn.addEventListener("click", async () => {
        if (!auth.isLoggedIn) return;
        const result = await mp.createRoom(8);
        if (result.error) {
            alert(result.error);
            return;
        }
        mpShowView("lobby");
    });

    el.mpJoinOpenBtn.addEventListener("click", () => {
        if (!auth.isLoggedIn) return;
        el.mpJoinError.hidden = true;
        el.mpJoinCode.value = "";
        mpShowView("join");
    });
    el.mpJoinBackBtn.addEventListener("click", () => mpShowView("menu"));
    el.mpJoinSubmitBtn.addEventListener("click", async () => {
        const result = await mp.joinRoom(el.mpJoinCode.value);
        if (result.error) {
            el.mpJoinError.textContent = result.error;
            el.mpJoinError.hidden = false;
            return;
        }
        mpShowView("lobby");
    });

    el.mpCopyCodeBtn.addEventListener("click", () => {
        if (mp.room) navigator.clipboard?.writeText(mp.room.code);
    });
    el.mpLeaveBtn.addEventListener("click", async () => {
        await mp.leaveRoom();
        mpShowView("menu");
    });
    el.mpResultsLeaveBtn.addEventListener("click", async () => {
        await mp.leaveRoom();
        mpShowView("menu");
    });
    el.mpStartBtn.addEventListener("click", async () => {
        const result = await mp.startGame();
        if (result.error) alert(result.error);
    });

    let mpLocalState = { guesses: [], status: "playing" };

    function renderLobby(snapshot) {
        el.mpRoomCode.textContent = snapshot.room.code;
        el.mpPlayersList.innerHTML = snapshot.players
            .map((p) => `<div class="mp-player-row">🟢 ${escapeHtml(p.username)}${p.profile_id === snapshot.room.host_id ? " (host)" : ""}</div>`)
            .join("");
        el.mpStartBtn.hidden = !snapshot.isHost;
        el.mpLobbyStatus.textContent = snapshot.isHost ? "You are the host. Start when ready." : "Waiting for host…";
    }

    function renderMpGrid() {
        el.mpGridBody.innerHTML = "";
        for (const g of mpLocalState.guesses) {
            const nameCell = document.createElement("div");
            nameCell.className = "cell cell--operator";
            nameCell.textContent = g.operatorName;
            el.mpGridBody.appendChild(nameCell);
            for (const field of g.fields) {
                const cell = document.createElement("div");
                cell.className = `cell cell--${field.state}`;
                const value = document.createElement("div");
                value.className = "cell__value";
                value.textContent = field.key === "speed" || field.key === "armor" ? "●".repeat(field.guessValue) : String(field.guessValue);
                cell.appendChild(value);
                el.mpGridBody.appendChild(cell);
            }
        }
        el.mpGameProgress.textContent = `Guess ${mpLocalState.guesses.length} / 10`;
    }

    function renderMpHints() {
        el.mpHintPanel.innerHTML = "";
        const latest = mpLocalState.guesses[mpLocalState.guesses.length - 1];
        if (!latest || !latest.hints) return;
        const entries = [
            ["secondaryGadgets", "Secondary Gadgets"],
            ["secondaryWeapons", "Secondary Weapons"],
            ["primaryWeapons", "Primary Weapons"],
        ];
        for (const [key, label] of entries) {
            const values = latest.hints[key];
            if (!values) continue;
            const box = document.createElement("div");
            box.className = "hint-box";
            box.innerHTML = `<strong>${label}:</strong> ${values.length ? values.map(escapeHtml).join(", ") : "None"}`;
            el.mpHintPanel.appendChild(box);
        }
    }

    function mpAutocomplete(query) {
        const q = query.trim().toLowerCase();
        el.mpAutocompleteList.innerHTML = "";
        if (!q) return;
        const matches = PLAYABLE_OPERATORS.filter((op) => op.name.toLowerCase().includes(q)).slice(0, 8);
        for (const op of matches) {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.textContent = op.name;
            item.addEventListener("click", () => {
                el.mpOperatorSearch.value = op.name;
                el.mpAutocompleteList.innerHTML = "";
            });
            el.mpAutocompleteList.appendChild(item);
        }
    }
    el.mpOperatorSearch.addEventListener("input", () => mpAutocomplete(el.mpOperatorSearch.value));

    async function mpSubmitGuess() {
        const name = el.mpOperatorSearch.value.trim();
        if (!name) return;
        const found = PLAYABLE_OPERATORS.find((op) => op.name.toLowerCase() === name.toLowerCase());
        if (!found) {
            el.mpSearchFeedback.textContent = "Not a recognized operator.";
            return;
        }
        const result = await mp.submitGuess(found.name);
        if (result.error) {
            el.mpSearchFeedback.textContent = result.error;
            return;
        }
        el.mpSearchFeedback.textContent = "";
        el.mpOperatorSearch.value = "";
        el.mpAutocompleteList.innerHTML = "";
        mpLocalState.guesses.push(result.data);
        renderMpGrid();
        renderMpHints();

        if (result.data.isCorrect) {
            el.mpEndBanner.textContent = `You solved it in ${result.data.guessNumber} guesses!`;
            el.mpEndBanner.hidden = false;
            el.mpGuessBtn.disabled = true;
        } else if (result.data.guessNumber >= 10) {
            el.mpEndBanner.textContent = `Out of guesses. The operator was ${result.data.mysteryOperatorName}.`;
            el.mpEndBanner.hidden = false;
            el.mpGuessBtn.disabled = true;
        }
    }
    el.mpGuessBtn.addEventListener("click", mpSubmitGuess);
    el.mpOperatorSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            mpSubmitGuess();
        }
    });

    function renderResults(snapshot) {
        const sorted = [...snapshot.players].sort((a, b) => {
            if (a.solved !== b.solved) return a.solved ? -1 : 1;
            if (a.solved && b.solved) return a.guesses_count - b.guesses_count;
            return 0;
        });
        const medals = ["🥇", "🥈", "🥉"];
        el.mpResultsOperator.textContent = snapshot.room.mystery_operator_name
            ? `The operator was ${snapshot.room.mystery_operator_name}.`
            : "";
        el.mpResultsList.innerHTML = sorted
            .map((p, i) => {
                const medal = medals[i] || "";
                const line = p.solved ? `Solved in ${p.guesses_count} guesses` : p.finished ? "Did not solve it" : "Still playing…";
                return `<div class="mp-result-row">${medal} <strong>${escapeHtml(p.username)}</strong><br/><span>${line}</span></div>`;
            })
            .join("");
    }

    mp.onChange((snapshot) => {
        if (!snapshot.room) return;

        if (snapshot.room.status === "lobby") {
            renderLobby(snapshot);
            if (el.multiplayerModal.classList.contains("is-open")) mpShowView("lobby");
        } else if (snapshot.room.status === "playing") {
            if (el.mpViewGame.hidden && el.multiplayerModal.classList.contains("is-open")) {
                mpLocalState = { guesses: [], status: "playing" };
                el.mpEndBanner.hidden = true;
                el.mpGuessBtn.disabled = false;
                renderMpGrid();
                mpShowView("game");
            }

            const me = snapshot.players.find((p) => p.profile_id === mp.myProfileId);
            const everyoneFinished = snapshot.players.length > 0 && snapshot.players.every((p) => p.finished);
            if (everyoneFinished || (me && me.finished)) {
                renderResults(snapshot);
                if (el.multiplayerModal.classList.contains("is-open")) mpShowView("results");
            }
        } else if (snapshot.room.status === "closed") {
            mpShowView("menu");
        }
    });
});
