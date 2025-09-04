// Vercel serverless function with CORS + proxy to verifiedsecure.org
const ALLOWED_ORIGINS = [
  "https://www.smartinvestornews.com",
  "https://paretopublishing.webflow.io"
];

function cors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  // CORS preflight
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) cors(res, origin);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, preferred_niche_ids, source } = req.body || {};
    if (!email || !Array.isArray(preferred_niche_ids)) {
      return res.status(400).json({ error: "Missing email or preferred_niche_ids" });
    }

    const upstream = await fetch(
      "https://verifiedsecure.org/api1/coreg.php?method=saveSubscriberPreferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "bt-api-user": process.env.BT_API_USER,
          "bt-api-key": process.env.BT_API_KEY
        },
        body: JSON.stringify({
          email,
          preferred_niche_ids,
          source: source || "coreg"
        })
      }
    );

    // Try to parse JSON either way
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Proxy failed" });
  }
}
