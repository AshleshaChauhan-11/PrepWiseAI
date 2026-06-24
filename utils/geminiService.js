import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  async generateText(prompt) {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

export default new GeminiService();