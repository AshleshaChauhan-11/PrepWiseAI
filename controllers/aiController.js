import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import { findRelevantChunks } from '../utils/textChunker.js';
import geminiService from '../utils/geminiService.js';

// @desc
// Generate flashcards from document
// @route
// POST /api/ai/generate-flashcards
// @access
// Private
export const generateFlashcards = async (req, res, next) => {
  console.log("===== INSIDE GENERATE FLASHCARDS =====");

  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    const document = await Document.findById(documentId);

    console.log("Document:", document);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const relevantChunks = findRelevantChunks(document.content, 5);

    const prompt = `
Generate ${count} flashcards from the document content below.

Return ONLY valid JSON.

Format:
[
  {
    "question": "Question text",
    "answer": "Answer text"
  }
]

Document Content:
${relevantChunks.join("\n\n")}
`;

    console.log("===== SENDING TO GEMINI =====");

    const response = await geminiService.generateText(prompt);

    console.log("===== GEMINI RESPONSE =====");
    console.log(response);

    let flashcardsData;

    try {
      const cleanedResponse = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      flashcardsData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse Gemini response",
        rawResponse: response,
      });
    }

    if (!Array.isArray(flashcardsData)) {
      return res.status(500).json({
        success: false,
        message: "Gemini did not return an array of flashcards",
      });
    }

    const flashcards = flashcardsData.map((fc) => ({
      userId: req.user._id,      // IMPORTANT FIX
      documentId,
      question: fc.question,
      answer: fc.answer,
      isStarred: false,
      reviewCount: 0,
    }));

    const createdFlashcards = await Flashcard.create(flashcards);

    return res.status(201).json({
      success: true,
      count: createdFlashcards.length,
      flashcards: createdFlashcards,
    });
  } catch (error) {
    console.error("Generate Flashcards Error:", error);
    next(error);
  }
};

export const markReviewed = async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({
        message: 'Flashcard not found'
      });
    }

    flashcard.reviewed = true;

    await flashcard.save();

    res.status(200).json(flashcard);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// @desc
// Generate quiz from document
// @route
// POST /api/ai/generate-quiz
// @access
// Private
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const relevantChunks = findRelevantChunks(document.content, 5);
    const prompt = `Generate 5-10 multiple choice quiz questions from this document content. Each question should have 4 options and indicate the correct answer. Format as JSON array: [{question: "", options: ["", "", "", ""], correctAnswer: ""}]\n\nDocument content:\n${relevantChunks.join('\n\n')}`;

    const response = await geminiService.generateText(prompt);
    const quizData = JSON.parse(response.replace(/```json\s*|\s*```/g, ''));

    const quiz = {
      documentId: documentId,
      questions: quizData
    };

    const createdQuiz = await Quiz.create(quiz);

    res.status(201).json({
      success: true,
      quiz: createdQuiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc
// Generate summary from document
// @route
// POST /api/ai/generate-summary
// @access
// Private
export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const relevantChunks = findRelevantChunks(document.content, 3);
    const prompt = `Generate a concise summary (150-200 words) of this document content:\n\nDocument content:\n${relevantChunks.join('\n\n')}`;

    const summary = await geminiService.generateText(prompt);

    res.status(200).json({
      success: true,
      summary: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc
// Chat with document
// @route
// POST /api/ai/chat
// @access
// Private
export const chat = async (req, res, next) => {
  try {
    const { documentId, message } = req.body;
    
    if (!documentId || !message) {
      return res.status(400).json({ message: 'Document ID and message are required' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const relevantChunks = findRelevantChunks(document.content, 5);
    const prompt = `You are helping a user chat with this document. Answer their question based on the document content below. If the answer isn't in the document, state that clearly.\n\nUser question: ${message}\n\nDocument content:\n${relevantChunks.join('\n\n')}`;

    const response = await geminiService.generateText(prompt);

    const chatHistory = new ChatHistory({
      documentId: documentId,
      userMessage: message,
      aiResponse: response
    });

    await chatHistory.save();

    res.status(200).json({
      success: true,
      response: response
    });
  } catch (error) {
    next(error);
  }
};

// @desc
// Explain concept from document
// @route
// POST /api/ai/explain-concept
// @access
// Private
export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;
    
    if (!documentId || !concept) {
      return res.status(400).json({ message: 'Document ID and concept name are required' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const relevantChunks = findRelevantChunks(document.content, 5);
    const prompt = `Explain the concept "${concept}" in detail based on this document content. Provide a clear, comprehensive explanation with examples if available.\n\nDocument content:\n${relevantChunks.join('\n\n')}`;

    const explanation = await geminiService.generateText(prompt);

    res.status(200).json({
      success: true,
      explanation: explanation
    });
  } catch (error) {
    next(error);
  }
};

// @desc
// Get chat history for a document
// @route
// GET /api/ai/chat-history/:documentId
// @access
// Private
export const getChatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const chatHistory = await ChatHistory.find({ documentId: documentId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: chatHistory.length,
      chatHistory: chatHistory
    });
  } catch (error) {
    next(error);
  }
};