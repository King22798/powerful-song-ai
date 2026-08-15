export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // -----------------------------
    // HEALTH CHECK
    // -----------------------------
    if (url.pathname === "/api/health") {
      return json(
        {
          ok: true,
          apiKeyConfigured: !!env.MUSICFUL_API_KEY,
        },
        200,
        cors
      );
    }

    // -----------------------------
    // GENERATE MUSIC
    // -----------------------------
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        if (!env.MUSICFUL_API_KEY) {
          return json(
            { error: "MUSICFUL_API_KEY পাওয়া যায়নি" },
            500,
            cors
          );
        }

        const input = await request.json();

        // Frontend-এর বিভিন্ন নাম থেকে value নেওয়া
        const topic =
          input.topic ||
          input.songTopic ||
          input.prompt ||
          input.description ||
          "";

        const language =
          input.language ||
          "Hindi";

        const musicStyle =
          input.musicStyle ||
          input.style ||
          "Powerful Cinematic";

        const vocal =
          input.vocal ||
          input.voice ||
          "Powerful Male Vocal";

        const model =
          input.mv ||
          input.musicModel ||
          input.model ||
          "MFV3.0";

        // Vocal থেকে gender বের করা
        let gender = "male";

        const vocalText = String(vocal).toLowerCase();

        if (
          vocalText.includes("female") ||
          vocalText.includes("woman") ||
          vocalText.includes("female vocal")
        ) {
          gender = "female";
        }

        // Musicful API-এর জন্য সঠিক payload
        const payload = {
          action: "auto",
          style: `${topic}. Language: ${language}. Music style: ${musicStyle}. ${vocal}`,
          mv: model,
          instrumental: 0,
          gender: gender,
        };

        const response = await fetch(
          "https://api.musicful.ai/v1/music/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.MUSICFUL_API_KEY,
            },
            body: JSON.stringify(payload),
          }
        );

        const text = await response.text();

        // Musicful-এর আসল error সরাসরি দেখাবে
        if (!response.ok) {
          return json(
            {
              error: "Musicful API error",
              status: response.status,
              details: safeJson(text),
              sent: {
                action: payload.action,
                style: payload.style,
                mv: payload.mv,
                instrumental: payload.instrumental,
                gender: payload.gender,
              },
            },
            response.status,
            cors
          );
        }

        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("Content-Type") ||
              "application/json",
            ...cors,
          },
        });
      } catch (error) {
        return json(
          {
            error: "Generate error",
            message: error.message || String(error),
          },
          500,
          cors
        );
      }
    }

    // -----------------------------
    // TASK STATUS
    // -----------------------------
    if (url.pathname === "/api/tasks" && request.method === "GET") {
      try {
        if (!env.MUSICFUL_API_KEY) {
          return json(
            { error: "MUSICFUL_API_KEY পাওয়া যায়নি" },
            500,
            cors
          );
        }

        const ids = url.searchParams.get("ids");

        if (!ids) {
          return json(
            { error: "Task IDs পাওয়া যায়নি" },
            400,
            cors
          );
        }

        const response = await fetch(
          "https://api.musicful.ai/v1/music/tasks?ids=" +
            encodeURIComponent(ids),
          {
            method: "GET",
            headers: {
              "x-api-key": env.MUSICFUL_API_KEY,
            },
          }
        );

        const text = await response.text();

        if (!response.ok) {
          return json(
            {
              error: "Musicful Task API error",
              status: response.status,
              details: safeJson(text),
            },
            response.status,
            cors
          );
        }

        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("Content-Type") ||
              "application/json",
            ...cors,
          },
        });
      } catch (error) {
        return json(
          {
            error: "Task error",
            message: error.message || String(error),
          },
          500,
          cors
        );
      }
    }

    // -----------------------------
    // STATIC WEBSITE
    // -----------------------------
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("POWERFUL SONG AI is running.", {
      headers: cors,
    });
  },
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
              }
