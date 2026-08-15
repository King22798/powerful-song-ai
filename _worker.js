export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // -------------------------
    // HEALTH CHECK
    // -------------------------
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        worker: "POWERFUL SONG AI",
        apiKeyConfigured: !!env.MUSICFUL_API_KEY
      }, 200, cors);
    }

    // -------------------------
    // GENERATE MUSIC
    // -------------------------
    if (
      url.pathname === "/api/generate" &&
      request.method === "POST"
    ) {
      try {
        if (!env.MUSICFUL_API_KEY) {
          return json({
            ok: false,
            error: "MUSICFUL_API_KEY পাওয়া যায়নি"
          }, 500, cors);
        }

        let body;

        try {
          body = await request.json();
        } catch {
          return json({
            ok: false,
            error: "Browser থেকে সঠিক JSON request পাওয়া যায়নি"
          }, 400, cors);
        }

        // Musicful API অনুযায়ী clean payload
        const payload = {
          action: "auto",
          style: String(body.style || "Powerful original song"),
          mv: body.mv || "MFV3.0",
          instrumental: Number(body.instrumental ?? 0),
          gender: body.gender || ""
        };

        const response = await fetch(
          "https://api.musicful.ai/v1/music/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.MUSICFUL_API_KEY
            },
            body: JSON.stringify(payload)
          }
        );

        const text = await response.text();

        // Musicful response JSON করার চেষ্টা
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          return json({
            ok: false,
            error: "Musicful JSON response দেয়নি",
            musicfulStatus: response.status,
            musicfulContentType:
              response.headers.get("content-type") || "",
            musicfulResponse:
              text.substring(0, 2000)
          }, 502, cors);
        }

        // Musicful API error
        if (!response.ok) {
          return json({
            ok: false,
            error: "Musicful API error",
            musicfulStatus: response.status,
            details: data
          }, response.status, cors);
        }

        // Success
        return json({
          ok: true,
          data
        }, 200, cors);

      } catch (error) {
        return json({
          ok: false,
          error: error?.message || "Generate error"
        }, 500, cors);
      }
    }

    // -------------------------
    // TASK STATUS
    // -------------------------
    if (
      url.pathname === "/api/tasks" &&
      request.method === "GET"
    ) {
      try {
        if (!env.MUSICFUL_API_KEY) {
          return json({
            ok: false,
            error: "MUSICFUL_API_KEY পাওয়া যায়নি"
          }, 500, cors);
        }

        const ids = url.searchParams.get("ids");

        if (!ids) {
          return json({
            ok: false,
            error: "Task IDs পাওয়া যায়নি"
          }, 400, cors);
        }

        const response = await fetch(
          "https://api.musicful.ai/v1/music/tasks?ids=" +
          encodeURIComponent(ids),
          {
            method: "GET",
            headers: {
              "x-api-key": env.MUSICFUL_API_KEY
            }
          }
        );

        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          return json({
            ok: false,
            error: "Musicful task response JSON নয়",
            musicfulStatus: response.status,
            musicfulResponse:
              text.substring(0, 2000)
          }, 502, cors);
        }

        if (!response.ok) {
          return json({
            ok: false,
            error: "Musicful task API error",
            musicfulStatus: response.status,
            details: data
          }, response.status, cors);
        }

        return json({
          ok: true,
          data
        }, 200, cors);

      } catch (error) {
        return json({
          ok: false,
          error: error?.message || "Task error"
        }, 500, cors);
      }
    }

    // -------------------------
    // STATIC WEBSITE
    // -------------------------
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "POWERFUL SONG AI is running.",
      {
        status: 200,
        headers: cors
      }
    );
  }
};

function json(data, status = 200, headers = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...headers
      }
    }
  );
        }
