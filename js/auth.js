const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;

class RainbowdleAuth {
    constructor() {
        this.client = getSupabaseClient();
        this.session = null;
        this.profile = null;
        this.listeners = new Set();
        this.ready = this._init();
    }

    async _init() {
        if (!this.client) return;

        const { data } = await this.client.auth.getSession();
        this.session = data.session || null;
        if (this.session) {
            await this._loadProfile();
        }
        this._emit();

        this.client.auth.onAuthStateChange(async (event, session) => {
            this.session = session;
            if (session) {
                await this._loadProfile();
            } else {
                this.profile = null;
            }
            this._emit();
        });
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    _emit() {
        for (const cb of this.listeners) {
            try {
                cb({ session: this.session, profile: this.profile });
            } catch (e) {
                console.error("Rainbowdle auth listener failed", e);
            }
        }
    }

    async _loadProfile() {
        if (!this.session) {
            this.profile = null;
            return;
        }
        const { data, error } = await this.client
            .from("profiles")
            .select("id, username, display_name")
            .eq("id", this.session.user.id)
            .maybeSingle();
        if (error) {
            console.error("Rainbowdle: failed to load profile", error);
            this.profile = null;
            return;
        }
        this.profile = data;
    }

    get isLoggedIn() {
        return !!this.session;
    }

    get needsUsername() {
        return this.isLoggedIn && !this.profile;
    }

    static validateUsername(username) {
        if (!USERNAME_PATTERN.test(username || "")) {
            return "Usernames must be 3-20 characters: letters, numbers, underscores, or hyphens.";
        }
        return null;
    }

    async signUp(email, password) {
        if (!this.client) return { error: "Online play is not configured yet." };
        const { data, error } = await this.client.auth.signUp({ email, password });
        if (error) return { error: error.message };
        this.session = data.session || this.session;
        return { data };
    }

    async logIn(email, password) {
        if (!this.client) return { error: "Online play is not configured yet." };
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        this.session = data.session;
        await this._loadProfile();
        this._emit();
        return { data };
    }

    async logOut() {
        if (!this.client) return;
        await this.client.auth.signOut();
        this.session = null;
        this.profile = null;
        this._emit();
    }

    async createProfile(username, displayName) {
        if (!this.client) return { error: "Online play is not configured yet." };
        const validationError = RainbowdleAuth.validateUsername(username);
        if (validationError) return { error: validationError };

        const { data, error } = await this.client.rpc("create_profile", {
            p_username: username,
            p_display_name: displayName || username,
        });

        if (error) {
            if (/taken/i.test(error.message)) {
                return { error: "That username is already taken." };
            }
            return { error: error.message };
        }

        this.profile = data;
        this._emit();
        return { data };
    }
}
