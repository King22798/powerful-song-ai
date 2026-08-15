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

    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        if (!env.MUSICFUL_API_KEY) {
          return json({ error: "MUSICFUL_API_KEY পাওয়া যায়নি" }, 500, cors);
        }

        const body = await request.json();

        const response = await fetch(
          "https://api.musicful.ai/v1/music/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.MUSICFUL_API_KEY
            },
            body: JSON.stringify(body)
          }
        );

        const text = await response.text();

        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("Content-Type") ||
              "application/json",
            ...cors
          }
        });

      } catch (error) {
        return json(
          { error: error.message || "Generate error" },
          500,
          cors
        );
      }
    }

    if (url.pathname === "/api/tasks" && request.method === "GET") {
      try {
        if (!env.MUSICFUL_API_KEY) {
          return json({ error: "MUSICFUL_API_KEY পাওয়া যায়নি" }, 500, cors);
        }

        const ids = url.searchParams.get("ids");

        if (!ids) {
          return json({ error: "Task IDs পাওয়া যায়নি" }, 400, cors);
        }

        const response = await fetch(
          "https://api.musicful.ai/v1/music/tasks?ids=" +
          encodeURIComponent(ids),
          {
            headers: {
              "x-api-key": env.MUSICFUL_API_KEY
            }
          }
        );

        const text = await response.text();

        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("Content-Type") ||
              "application/json",
            ...cors
          }
        });

      } catch (error) {
        return json(
          { error: error.message || "Task error" },
          500,
          cors
        );
      }
    }

    if (url.pathname === "/api/health") {
      return json(
        {
          ok: true,
          apiKeyConfigured: !!env.MUSICFUL_API_KEY
        },
        200,
        cors
      );
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("POWERFUL SONG AI is running.", {
      headers: cors
    });
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
