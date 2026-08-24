const RainbowdleLeaderboard = {
    async fetchTop(limit = 50) {
        const client = getSupabaseClient();
        if (!client) return { error: "Online play is not configured yet.", rows: [] };

        const { data, error } = await client
            .from("leaderboard")
            .select("*")
            .order("games_won", { ascending: false })
            .order("average_guesses", { ascending: true, nullsFirst: false })
            .limit(limit);

        if (error) return { error: error.message, rows: [] };
        return { rows: data || [] };
    },

    async submitSingleplayerResult(auth, won, guessCount) {
        if (!auth || !auth.isLoggedIn) return null;
        const client = getSupabaseClient();
        if (!client) return null;

        const { data, error } = await client.rpc("record_singleplayer_result", {
            p_won: won,
            p_guesses: guessCount,
        });

        if (error) {
            console.error("Rainbowdle: failed to submit online result", error);
            return null;
        }
        return data;
    },
};
