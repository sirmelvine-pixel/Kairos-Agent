// netlify/functions/ai.js
// Server-side proxy — handles web search multi-turn loop entirely server-side

const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")   return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  const API_KEY = process.env.KAIROS_API_KEY;
  if (!API_KEY) return {
    statusCode: 500, headers: CORS,
    body: JSON.stringify({ error: "KAIROS_API_KEY not configured in Netlify environment variables." })
  };

  let payload;
  try { payload = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  try {
    const result = await runAgentLoop(API_KEY, payload);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(result) };
  } catch (err) {
    console.error("Agent loop error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

async function runAgentLoop(apiKey, payload) {
  const messages     = JSON.parse(JSON.stringify(payload.messages || []));
  const hasWebSearch = (payload.tools || []).some(t => t.type === "web_search_20250305");

  const tools = hasWebSearch ? [{ type: "web_search_20250305", name: "web_search" }] : [];

  const basePayload = {
    model:      payload.model      || "claude-sonnet-4-20250514",
    max_tokens: payload.max_tokens || 1500,
    system:     payload.system     || "",
    ...(payload.mcp_servers && { mcp_servers: payload.mcp_servers }),
    ...(tools.length > 0 && { tools }),
  };

  let allToolsUsed = [];
  let finalText    = "";
  let iterations   = 0;
  const MAX        = 6;

  while (iterations < MAX) {
    iterations++;

    const response  = await callAnthropic(apiKey, { ...basePayload, messages });
    const data      = JSON.parse(response.body);

    if (response.status !== 200) {
      const msg = (data.error && data.error.message) ? data.error.message : "API error " + response.status;
      throw new Error(msg);
    }

    const content    = data.content || [];
    const stopReason = data.stop_reason;

    // Gather text + tool names
    for (const block of content) {
      if (block.type === "text") finalText += block.text;
      if (block.type === "tool_use" || block.type === "mcp_tool_use") {
        allToolsUsed.push(block.name || "web_search");
      }
    }

    // Done if model stopped naturally
    if (stopReason !== "tool_use") break;

    // Find tool_use blocks and build tool_result responses
    const toolUseBlocks   = content.filter(b => b.type === "tool_use");
    if (toolUseBlocks.length === 0) break;

    const toolResults = toolUseBlocks.map(b => ({
      type:        "tool_result",
      tool_use_id: b.id,
      content:     "Search executed. Please continue with the results you found.",
    }));

    // Extend conversation
    messages.push({ role: "assistant", content });
    messages.push({ role: "user",      content: toolResults });
  }

  return {
    content: [
      { type: "text", text: finalText || "No response generated." },
      ...allToolsUsed.map(name => ({ type: "tool_use", name })),
    ],
    stop_reason: "end_turn",
  };
}

function callAnthropic(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payload);
    const options = {
      hostname: "api.anthropic.com",
      path:     "/v1/messages",
      method:   "POST",
      headers: {
        "Content-Type":      "application/json",
        "Content-Length":    Buffer.byteLength(bodyStr),
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta":    "web-search-2025-03-05",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data",  chunk => { data += chunk; });
      res.on("end",   ()    => resolve({ status: res.statusCode, body: data }));
      res.on("error", err  => reject(err));
    });
    req.on("error", err => reject(err));
    req.write(bodyStr);
    req.end();
  });
}
