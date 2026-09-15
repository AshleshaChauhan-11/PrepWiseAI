import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const generateFlashcards = async (documentId, options) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_FLASHCARDS,
      { documentId, ...options }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Failed to generate flashcards",
    };
  }
};

const generateQuiz = async (documentId, options) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_QUIZ,
      { documentId, ...options }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Failed to generate quiz",
    };
  }
};

const generateSummary = async (documentId) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_SUMMARY,
      { documentId }
    );
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Failed to generate summary",
    };
  }
};

const chat = async (documentId, message) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.CHAT,
      {
        documentId,
        question: message,
      } // Removed history from payload
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Chat request failed",
    };
  }
};

const explainConcept = async (documentId, concept) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AI.EXPLAIN_CONCEPT,
      {
        documentId,
        concept,
      }
    );
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Failed to explain concept",
    };
  }
};

const getChatHistory = async (documentId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.AI.GET_CHAT_HISTORY(documentId)
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Failed to fetch chat history",
    };
  }
};

const aiService = {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getChatHistory,
};

export default aiService;