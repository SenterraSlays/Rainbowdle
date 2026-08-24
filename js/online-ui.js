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

        mpViewCreate: document.getElementById("mp-view-create"),
        mpCreateMaxPlayers: document.getElementById("mp-create-max-players"),
        mpCreateVisibilityInputs: Array.from(document.querySelectorAll('input[name="mp-create-visibility"]')),
        mpCreatePasswordRow: document.getElementById("mp-create-password-row"),
        mpCreatePassword: document.getElementById("mp-create-password"),
        mpCreateError: document.getElementById("mp-create-error"),
        mpCreateBackBtn: document.getElementById("mp-create-back-btn"),
        mpCreateSubmitBtn: document.getElementById("mp-create-submit-btn"),

        mpViewLobbylist: document.getElementById("mp-view-lobbylist"),
        mpLobbylistBody: document.getElementById("mp-lobbylist-body"),
        mpLobbylistRefreshBtn: document.getElementById("mp-lobbylist-refresh-btn"),
        mpLobbylistBackBtn: document.getElementById("mp-lobbylist-back-btn"),
        mpLobbylistCodeBtn: document.getElementById("mp-lobbylist-code-btn"),

        mpViewJoin: document.getElementById("mp-view-join"),
        mpJoinCode: document.getElementById("mp-join-code"),
        mpJoinPassword: document.getElementById("mp-join-password"),
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

        mpResults: document.getElementById("mp-results"),
        mpResultsReveal: document.getElementById("mp-results-reveal"),
        mpResultsList: document.getElementById("mp-results-list"),
        mpResultsNextHint: document.getElementById("mp-results-next-hint"),
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
        [el.mpViewMenu, el.mpViewCreate, el.mpViewLobbylist, el.mpViewJoin, el.mpViewLobby].forEach((v) => (v.hidden = true));
        ({
            menu: el.mpViewMenu,
            create: el.mpViewCreate,
            lobbylist: el.mpViewLobbylist,
            join: el.mpViewJoin,
            lobby: el.mpViewLobby,
        }[name].hidden = false);
    }

    el.modeMultiplayerBtn.addEventListener("click", () => {
        if (!auth.isLoggedIn) {
            el.mpSignedOutHint.hidden = false;
        } else {
            el.mpSignedOutHint.hidden = true;
        }
        if (mp.room && mp.room.status === "playing") {
            // Already mid-round -- jump straight back into the shared game
            // screen instead of showing the lobby.
            closeModal(el.multiplayerModal);
            mpEnterGameScreen();
        } else {
            mpShowView(mp.room ? "lobby" : "menu");
            openModal(el.multiplayerModal);
        }
    });
    el.multiplayerClose.addEventListener("click", () => closeModal(el.multiplayerModal));

    // --- Create Room ------------------------------------------------
    el.mpCreateBtn.addEventListener("click", () => {
        if (!auth.isLoggedIn) return;
        el.mpCreateError.hidden = true;
        el.mpCreatePassword.value = "";
        el.mpCreateMaxPlayers.value = "6";
        el.mpCreateVisibilityInputs.forEach((r) => (r.checked = r.value === "public"));
        el.mpCreatePasswordRow.hidden = true;
        mpShowView("create");
    });

    el.mpCreateVisibilityInputs.forEach((radio) => {
        radio.addEventListener("change", () => {
            const visibility = el.mpCreateVisibilityInputs.find((r) => r.checked)?.value || "public";
            el.mpCreatePasswordRow.hidden = visibility !== "private";
        });
    });

    el.mpCreateBackBtn.addEventListener("click", () => mpShowView("menu"));

    el.mpCreateSubmitBtn.addEventListener("click", async () => {
        el.mpCreateError.hidden = true;
        const maxPlayers = parseInt(el.mpCreateMaxPlayers.value, 10);
        const visibility = el.mpCreateVisibilityInputs.find((r) => r.checked)?.value || "public";
        const password = el.mpCreatePassword.value.trim();

        if (visibility === "private" && !password) {
            el.mpCreateError.textContent = "Private rooms need a password.";
            el.mpCreateError.hidden = false;
            return;
        }

        el.mpCreateSubmitBtn.disabled = true;
        const result = await mp.createRoom(maxPlayers, visibility, visibility === "private" ? password : null);
        el.mpCreateSubmitBtn.disabled = false;

        if (result.error) {
            el.mpCreateError.textContent = result.error;
            el.mpCreateError.hidden = false;
            return;
        }
        mpShowView("lobby");
    });

    // --- Join Room (lobby list of open rooms) ------------------------
    async function mpRefreshLobbyList() {
        el.mpLobbylistBody.innerHTML = `<p class="mp-lobbylist__empty">Loading rooms…</p>`;
        const { rows, error } = await mp.listOpenRooms();
        if (error) {
            el.mpLobbylistBody.innerHTML = `<p class="mp-lobbylist__empty">${escapeHtml(error)}</p>`;
            return;
        }
        if (!rows.length) {
            el.mpLobbylistBody.innerHTML = `<p class="mp-lobbylist__empty">No open rooms right now. Create one!</p>`;
            return;
        }
        el.mpLobbylistBody.innerHTML = rows
            .map((r) => {
                const lock = r.visibility === "private" ? "🔒" : "🌐";
                return `<div class="mp-lobby-row">
                    <div class="mp-lobby-row__info">
                        <span class="mp-lobby-row__name">${lock} ${escapeHtml(r.host_username)}'s room · <code>${escapeHtml(r.code)}</code></span>
                        <span class="mp-lobby-row__meta">${r.player_count}/${r.max_players} players${r.visibility === "private" ? " · needs password" : ""}</span>
                    </div>
                    <button class="secondary-btn mp-lobby-row__join" type="button" data-code="${escapeHtml(r.code)}" data-visibility="${escapeHtml(r.visibility)}">Join</button>
                </div>`;
            })
            .join("");
    }

    el.mpJoinOpenBtn.addEventListener("click", () => {
        if (!auth.isLoggedIn) return;
        mpShowView("lobbylist");
        mpRefreshLobbyList();
    });
    el.mpLobbylistRefreshBtn.addEventListener("click", () => mpRefreshLobbyList());
    el.mpLobbylistBackBtn.addEventListener("click", () => mpShowView("menu"));
    el.mpLobbylistCodeBtn.addEventListener("click", () => {
        el.mpJoinError.hidden = true;
        el.mpJoinCode.value = "";
        el.mpJoinPassword.value = "";
        mpShowView("join");
    });

    el.mpLobbylistBody.addEventListener("click", async (e) => {
        const btn = e.target.closest(".mp-lobby-row__join");
        if (!btn) return;
        const code = btn.dataset.code;
        if (btn.dataset.visibility === "private") {
            // Needs a password -- send them to the code/password form, prefilled.
            el.mpJoinError.hidden = true;
            el.mpJoinCode.value = code;
            el.mpJoinPassword.value = "";
            mpShowView("join");
            return;
        }
        btn.disabled = true;
        const result = await mp.joinRoom(code);
        btn.disabled = false;
        if (result.error) {
            alert(result.error);
            return;
        }
        mpShowView("lobby");
    });

    // --- Join Room by code -------------------------------------------
    el.mpJoinBackBtn.addEventListener("click", () => mpShowView("lobbylist"));
    el.mpJoinSubmitBtn.addEventListener("click", async () => {
        const result = await mp.joinRoom(el.mpJoinCode.value, el.mpJoinPassword.value.trim() || null);
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
    el.mpStartBtn.addEventListener("click", async () => {
        const result = await mp.startGame();
        if (result.error) alert(result.error);
    });

    // --- Shared game screen adapter -------------------------------------
    // Rather than maintaining a separate multiplayer grid/UI, multiplayer
    // rounds are played on the exact same screen as Classic/Daily via
    // ui.enterMultiplayerMode(adapter). The adapter exposes the same shape
    // RainbowdleGame does (guesses/status/mysteryOperator/getAvailableHints/
    // findOperatorByName) so every render path (grid, hex track, hints,
    // end banner, share) works unmodified. Opponents' progress is shown in
    // the left-hand mp-sidebar as rows of share-style emoji squares.
    const ui = window.__rainbowdle && window.__rainbowdle.ui;
    let mpGameEntered = false;
    let mpHintValues = { secondaryGadgets: null, secondaryWeapons: null, primaryWeapons: null };

    function findOperator(name) {
        const n = (name || "").trim().toLowerCase();
        return PLAYABLE_OPERATORS.find((op) => op.name.toLowerCase() === n) || null;
    }

    function fieldsToResults(fields) {
        return (fields || []).map((f) => {
            const schema = ATTRIBUTE_SCHEMA.find((a) => a.key === f.key);
            return {
                key: f.key,
                label: schema ? schema.label : f.key,
                type: schema ? schema.type : "equality",
                state: f.state,
                guessValue: f.guessValue,
            };
        });
    }

    const mpAdapter = {
        mode: "multiplayer",
        roomCode: "",
        dateKey: null,
        guesses: [],
        guessedNames: new Set(),
        status: "playing",
        mysteryOperator: { name: "???", image: "pngs/recruit_blue.png" },
        _roomId: null,
        _roundStartedAt: null,
        findOperatorByName: findOperator,
        getAvailableHints() {
            return HINT_SCHEDULE.map((entry) => {
                const unlocked = this.guesses.length >= entry.afterGuesses;
                return {
                    ...entry,
                    unlocked,
                    values: unlocked ? mpHintValues[entry.field] || [] : [],
                };
            });
        },
    };

    function mpResetAdapter() {
        mpAdapter.roomCode = mp.room ? mp.room.code : "";
        mpAdapter.guesses = [];
        mpAdapter.guessedNames = new Set();
        mpAdapter.status = "playing";
        mpAdapter.mysteryOperator = { name: "???", image: "pngs/recruit_blue.png" };
        mpAdapter._roomId = mp.room ? mp.room.id : null;
        mpAdapter._roundStartedAt = mp.room ? mp.room.round_started_at : null;
        mpHintValues = { secondaryGadgets: null, secondaryWeapons: null, primaryWeapons: null };
    }

    function mpEnterGameScreen() {
        if (!ui || !mp.room) return;
        mpGameEntered = true;
        // Only carry guesses over when re-entering the SAME room's SAME
        // round (e.g. reopening the multiplayer menu mid-round). A
        // different room, or a new round in the same room (rematch), must
        // always start from a clean slate, otherwise old guesses/duplicate
        // names and a stale won/lost status leak in and block guessing.
        if (mpAdapter._roomId !== mp.room.id || mpAdapter._roundStartedAt !== mp.room.round_started_at) mpResetAdapter();
        ui.onMultiplayerGuessSubmit = mpSubmitGuess;
        ui.onMultiplayerLeaveRequested = mpLeaveFromGameScreen;
        ui.enterMultiplayerMode(mpAdapter);
        mpRenderSidebar(mp._snapshot());
        mpStartPolling();
    }

    // Realtime pushes updates as soon as a guess/player row changes, but as
    // a fallback (replication lag, a missed event) also poll for opponents'
    // progress while a round is in play, so the sidebar never gets stuck.
    let mpPollTimer = null;
    function mpStartPolling() {
        mpStopPolling();
        mpPollTimer = setInterval(async () => {
            if (!mpGameEntered || !mp.room) return;
            await Promise.all([mp._refreshPlayers(), mp._refreshGuesses()]);
            const snapshot = mp._snapshot();
            mpRenderSidebar(snapshot);
            renderRoundResults(snapshot);
            mpMaybeScheduleRestart(snapshot);
        }, 4000);
    }
    function mpStopPolling() {
        if (mpPollTimer) {
            clearInterval(mpPollTimer);
            mpPollTimer = null;
        }
    }

    async function mpSubmitGuess(operatorName) {
        const result = await mp.submitGuess(operatorName);
        if (result.error) {
            ui.setMultiplayerGuessError(result.error);
            return;
        }
        const data = result.data;
        const operator = findOperator(data.operatorName);
        mpAdapter.guesses.push({
            operator,
            results: fieldsToResults(data.fields),
            isCorrect: data.isCorrect,
        });
        mpAdapter.guessedNames.add(data.operatorName);
        if (data.hints) {
            for (const key of Object.keys(mpHintValues)) {
                if (data.hints[key] != null) mpHintValues[key] = data.hints[key];
            }
        }
        if (data.isCorrect) {
            mpAdapter.status = "won";
            mpAdapter.mysteryOperator = operator || mpAdapter.mysteryOperator;
        } else if (data.guessNumber >= 10) {
            mpAdapter.status = "lost";
            const revealed = data.mysteryOperatorName ? findOperator(data.mysteryOperatorName) : null;
            mpAdapter.mysteryOperator = revealed || mpAdapter.mysteryOperator;
        }
        ui.renderMultiplayerGuessResult(data.isCorrect);

        // Don't wait on realtime to reflect this in the sidebar -- pull the
        // latest players/guesses straight away so your own card (and
        // everyone else's, next time they poll) updates immediately.
        await Promise.all([mp._refreshPlayers(), mp._refreshGuesses()]);
        mpRenderSidebar(mp._snapshot());
    }

    async function mpLeaveFromGameScreen() {
        mpStopPolling();
        if (mpRestartTimer) {
            clearTimeout(mpRestartTimer);
            mpRestartTimer = null;
        }
        await mp.leaveRoom();
        mpGameEntered = false;
        mpResetAdapter();
        ui.exitMultiplayerMode();
    }

    function mpRenderSidebar(snapshot) {
        if (!ui || !snapshot.room) return;
        const room = snapshot.room;
        const statusText = room.status === "playing" ? "Round in progress…" : room.status === "lobby" ? "Waiting to start…" : "";
        const players = snapshot.players.map((p) => {
            const present = !snapshot.presentProfileIds || snapshot.presentProfileIds.size === 0 || snapshot.presentProfileIds.has(p.profile_id);
            const guessRows = (snapshot.guessesByProfile[p.profile_id] || []).map((fields) => (fields || []).map((f) => f.state));
            return {
                username: p.username,
                isMe: p.profile_id === mp.myProfileId,
                isHost: p.profile_id === room.host_id,
                offline: !present,
                guessRows,
                solved: p.solved,
                finished: p.finished,
                guessCount: p.guesses_count,
            };
        });
        ui.renderMultiplayerSidebar({ statusText, players });
    }

    function renderLobby(snapshot) {
        el.mpRoomCode.textContent = snapshot.room.code;
        el.mpPlayersList.innerHTML = snapshot.players
            .map((p) => {
                const present = !snapshot.presentProfileIds || snapshot.presentProfileIds.size === 0 || snapshot.presentProfileIds.has(p.profile_id);
                const dot = present ? "🟢" : "⚪";
                return `<div class="mp-player-row">${dot} ${escapeHtml(p.username)}${p.profile_id === snapshot.room.host_id ? " (host)" : ""}</div>`;
            })
            .join("");
        el.mpStartBtn.hidden = !snapshot.isHost;
        el.mpLobbyStatus.textContent = snapshot.isHost ? "You are the host. Start when ready." : "Waiting for host…";
    }

    // --- End-of-round results + auto-rematch ------------------------
    function renderRoundResults(snapshot) {
        const results = snapshot.results;
        if (!el.mpResults) return;
        if (!results || !results.allFinished) {
            el.mpResults.hidden = true;
            return;
        }
        el.mpResults.hidden = false;
        el.mpResultsReveal.textContent = results.mysteryOperatorName ? `The operator was ${results.mysteryOperatorName}.` : "";
        el.mpResultsList.innerHTML = (results.players || [])
            .map((p, i) => {
                const line = p.solved ? `✅ Solved in ${p.guesses_count}` : "❌ Did not solve";
                return `<div class="mp-result-row"><strong>${i + 1}. ${escapeHtml(p.username)}</strong><br /><span>${line}</span></div>`;
            })
            .join("");
        el.mpResultsNextHint.textContent = snapshot.isHost
            ? "Everyone's finished — starting a new round…"
            : "Everyone's finished — waiting for the host to start the next round…";
    }

    let mpRestartTimer = null;
    function mpMaybeScheduleRestart(snapshot) {
        const shouldSchedule = snapshot.isHost && snapshot.room && snapshot.room.status === "playing" && snapshot.results && snapshot.results.allFinished;
        if (shouldSchedule) {
            if (!mpRestartTimer) {
                mpRestartTimer = setTimeout(async () => {
                    mpRestartTimer = null;
                    if (mp.room && mp.room.status === "playing") {
                        const result = await mp.startNewRound();
                        if (result.error) console.error("Rainbowdle auto-rematch failed", result.error);
                    }
                }, 3000);
            }
        } else if (mpRestartTimer) {
            clearTimeout(mpRestartTimer);
            mpRestartTimer = null;
        }
    }

    mp.onChange((snapshot) => {
        if (!snapshot.room) return;

        if (snapshot.room.status === "lobby") {
            mpGameEntered = false;
            mpMaybeScheduleRestart(snapshot);
            renderLobby(snapshot);
            if (el.multiplayerModal.classList.contains("is-open")) mpShowView("lobby");
        } else if (snapshot.room.status === "playing") {
            const isNewRound = mpAdapter._roomId !== snapshot.room.id || mpAdapter._roundStartedAt !== snapshot.room.round_started_at;
            if (!mpGameEntered || isNewRound) {
                closeModal(el.multiplayerModal);
                mpEnterGameScreen();
            }
            mpRenderSidebar(snapshot);
            renderRoundResults(snapshot);
            mpMaybeScheduleRestart(snapshot);
        } else if (snapshot.room.status === "closed") {
            mpGameEntered = false;
            mpStopPolling();
            mpMaybeScheduleRestart({ ...snapshot, results: null });
            mpResetAdapter();
            if (ui && ui.multiplayerActive) ui.exitMultiplayerMode();
            mpShowView("menu");
        }
    });
});