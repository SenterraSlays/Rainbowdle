const SUPABASE_URL = "https://YOUR-PROJECT-ref.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR-PUBLIC-ANON-OR-PUBLISHABLE-KEY";

let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (typeof window.supabase === "undefined") {
        console.error("Supabase library did not load. Check your network connection or the CDN script tag in index.html.");
        return null;
    }
    if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR-PROJECT-ref") || !SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes("YOUR-PUBLIC")) {
        console.warn("Rainbowdle: Supabase is not configured yet. Online features are disabled until js/supabase.js has real values. See README.md.");
        return null;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    });
    return supabaseClient;
}

function isSupabaseConfigured() {
    return getSupabaseClient() !== null;
}
