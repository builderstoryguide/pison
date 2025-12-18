require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.log("Missing env vars in .env.local");
    // Try .env if local is missing
    require('dotenv').config({ path: '.env' });
}

const finalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const finalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!finalUrl || !finalKey) {
    console.log("Missing env vars");
    process.exit(1);
}

async function check() {
    try {
        console.log("checking " + finalUrl);
        const res = await fetch(`${finalUrl}/rest/v1/notifications?select=*&limit=1`, {
            headers: {
                'apikey': finalKey,
                'Authorization': `Bearer ${finalKey}`
            }
        });
        
        if (res.ok) {
            console.log("Table exists!");
            const data = await res.json();
            console.log("Data:", data);
        } else {
            console.log("Error:", res.status, res.statusText);
            const text = await res.text();
            console.log("Body:", text);
        }
    } catch (e) {
        console.log("Exception:", e);
    }
}

check();
