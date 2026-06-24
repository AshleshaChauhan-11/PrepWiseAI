import Groq from "groq-sdk";

class GeminiService {
  get client() {
    if (!this._client) {
      this._client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this._client;
  }

  async generateText(prompt) {
    const chatCompletion = await this.client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0].message.content;
  }
}

export default new GeminiService();