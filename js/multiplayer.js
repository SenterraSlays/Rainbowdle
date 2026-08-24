class RainbowdleMultiplayer {
    constructor(auth) {
        this.auth = auth;
        this.client = getSupabaseClient();
        this.room = null;
        this.players = [];
        this.myGuesses = [];
        this.channel = null;
        this.listeners = new Set();
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    _emit() {
        for (const cb of this.listeners) {
            try {
                cb(this._snapshot());
            } catch (e) {
                console.error("Rainbowdle multiplayer listener failed", e);
            }
        }
    }

    _snapshot() {
        return {
            room: this.room,
            players: this.players,
            myGuesses: this.myGuesses,
            isHost: !!(this.room && this.auth.session && this.room.host_id === this.auth.session.user.id),
        };
    }

    get myProfileId() {
        return this.auth.session ? this.auth.session.user.id : null;
    }

    async createRoom(maxPlayers = 8) {
        if (!this.client) return { error: "Online play is not configured yet." };
        const { data, error } = await this.client.rpc("create_room", { p_max_players: maxPlayers });
        if (error) return { error: error.message };
        this.room = data;
        await this._afterJoin();
        return { data };
    }

    async joinRoom(code) {
        if (!this.client) return { error: "Online play is not configured yet." };
        const cleaned = (code || "").trim().toUpperCase();
        if (!cleaned) return { error: "Enter a room code." };

        const { data, error } = await this.client.rpc("join_room", { p_code: cleaned });
        if (error) {
            if (/not found/i.test(error.message)) return { error: "Room not found." };
            if (/full/i.test(error.message)) return { error: "This room is full." };
            if (/already started/i.test(error.message)) return { error: "This room already started." };
            return { error: error.message };
        }
        this.room = data;
        await this._afterJoin();
        return { data };
    }

    async _afterJoin() {
        await this._refreshPlayers();
        this._subscribeRealtime();
        this._emit();
    }

    async _refreshPlayers() {
        if (!this.room) return;
        const { data, error } = await this.client
            .from("room_players")
            .select("profile_id, username, guesses_count, solved, finished, joined_at, left_at")
            .eq("room_id", this.room.id)
            .is("left_at", null)
            .order("joined_at", { ascending: true });
        if (!error) {
            this.players = data || [];
        }

        const { data: roomRow } = await this.client
            .from("rooms")
            .select("*")
            .eq("id", this.room.id)
            .maybeSingle();
        if (roomRow) this.room = roomRow;
    }

    _subscribeRealtime() {
        if (!this.room || !this.client) return;
        if (this.channel) {
            this.client.removeChannel(this.channel);
        }

        this.channel = this.client
            .channel(`room-${this.room.id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${this.room.id}` },
                () => this._refreshPlayers().then(() => this._emit())
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "rooms", filter: `id=eq.${this.room.id}` },
                (payload) => {
                    this.room = payload.new;
                    this._emit();
                }
            )
            .subscribe();
    }

    async startGame() {
        if (!this.room) return { error: "Not in a room." };
        const { data, error } = await this.client.rpc("start_room", { p_room_id: this.room.id });
        if (error) return { error: error.message };
        this.room = data;
        this._emit();
        return { data };
    }

    async submitGuess(operatorName) {
        if (!this.room) return { error: "Not in a room." };
        const { data, error } = await this.client.rpc("mp_submit_guess", {
            p_room_id: this.room.id,
            p_operator_name: operatorName,
        });
        if (error) return { error: error.message };
        this.myGuesses.push(data);
        if (data.guessNumber >= 10 || data.isCorrect) {
            await this.client.rpc("mp_record_result", { p_room_id: this.room.id });
        }
        this._emit();
        return { data };
    }

    async leaveRoom() {
        if (!this.room || !this.client) return;
        await this.client.rpc("leave_room", { p_room_id: this.room.id });
        if (this.channel) {
            this.client.removeChannel(this.channel);
            this.channel = null;
        }
        this.room = null;
        this.players = [];
        this.myGuesses = [];
        this._emit();
    }

    async refresh() {
        await this._refreshPlayers();
        this._emit();
    }
}
