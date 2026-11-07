import Groq from 'groq-sdk';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

let groqClient = null;

/**
 * Client is created on first use, not at import time.
 * This avoids crashes caused by ESM import hoisting — if this module
 * gets imported before dotenv.config() has run, reading
 * process.env.GROQ_API_KEY at module load time would fail.
 * By the time generateText() actually runs, dotenv has definitely loaded.
 */
const getClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY is not set. Check that backend/.env exists and that ' +
        "server.js has `import 'dotenv/config';` as its first line."
    );
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
};

/**
 * Sends a single prompt to Groq and returns the plain text reply.
 * Kept API-compatible with the old geminiService.generateText(prompt)
 * so controllers did not have to change their call shape.
 */
const generateText = async (prompt) => {
  const client = getClient();

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a study assistant. When asked for JSON, return only raw valid JSON with no markdown fences and no commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    });

    const text = completion.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Groq returned an empty response');
    }

    return text;
  } catch (error) {
    console.error('Groq API Error:', error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

export default { generateText };