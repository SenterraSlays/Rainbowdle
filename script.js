document.addEventListener("DOMContentLoaded", () => {
    try {
        const game = new RainbowdleGame(PLAYABLE_OPERATORS);
        const ui = new RainbowdleUI(game, PLAYABLE_OPERATORS);
        const stickyCounter = document.getElementById("sticky-guess-counter");
        const stickyOperatorsBtn = document.getElementById("sticky-operators-btn");
        const mainCounter = document.getElementById("guess-counter");
        if (stickyOperatorsBtn) {
            stickyOperatorsBtn.addEventListener("click", () => document.getElementById("operators-btn").click());
        }
        if (stickyCounter && mainCounter) {
            const sync = () => {
                stickyCounter.textContent = mainCounter.textContent;
            };
            sync();
            const observer = new MutationObserver(sync);
            observer.observe(mainCounter, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        window.__rainbowdle = {
            game: game,
            ui: ui
        };
    } catch (err) {
        console.error("Rainbowdle failed to start:", err);
        const app = document.querySelector(".app") || document.body;
        const loader = document.getElementById("loading-screen");
        if (loader) loader.remove();
        app.innerHTML = `\n            <div class="fatal-error">\n                <h2>Something went wrong loading Rainbowdle.</h2>\n                <p>Please refresh the page and try again.</p>\n            </div>`;
    }
});
