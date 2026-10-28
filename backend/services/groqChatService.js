// backend/services/groqChatService.js
// Groq Cloud LLM Integration (OpenAI-compatible)

class GroqChatService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || null;
    this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    this.endpoint = "https://api.groq.com/openai/v1/chat/completions";
  }

  isAvailable() {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async processMessage(userId, message, tools = [], systemPrompt = "") {
    if (!this.isAvailable()) return null;

    try {
      const messages = [
        { role: "system", content: systemPrompt || "You are SabAI, an AI payment assistant for SabAI Pay." },
        { role: "user", content: message },
      ];

      const body = {
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      };

      if (tools && tools.length > 0) {
        body.tools = tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
        body.tool_choice = "auto";
      }

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(`❌ Groq API error HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) return null;

      const toolCalls = choice.message?.tool_calls || [];
      const text = choice.message?.content || "";

      return {
        text,
        toolCalls: toolCalls.map((tc) => ({
          name: tc.function?.name,
          args: JSON.parse(tc.function?.arguments || "{}"),
        })),
      };
    } catch (e) {
      console.error("Groq chat error:", e.message);
      return null;
    }
  }
}

module.exports = new GroqChatService();
