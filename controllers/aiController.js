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
    const { documentId, count=10 } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    const document = await Document.findById(documentId);
    console.log("Document:", document);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let relevantChunks = [];
    if (document.chunks && document.chunks.length > 0) {
      relevantChunks = document.chunks.slice(0, 5).map(c => c.content);
    } else if (document.extractedText && document.extractedText.trim().length > 0) {
      relevantChunks = [document.extractedText];
    }

    if (relevantChunks.length === 0) {
      return res.status(400).json({ message: 'Document content is empty or not yet processed' });
    }
    const prompt = `Generate 5-10 flashcards from this document content. Each flashcard should have a question and answer format. Format as JSON array: [{question: "", answer: ""}]\n\nDocument content:\n${relevantChunks.join('\n\n')}`;

    console.log("===== SENDING TO GEMINI =====");
    console.log(prompt);
    const response = await geminiService.generateText(prompt);
    console.log("===== GEMINI RESPONSE =====");
    console.log(response);

    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
    const startIndex = cleanResponse.indexOf('[');
    const endIndex = cleanResponse.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error('AI response does not contain a valid JSON array');
    }
    const jsonString = cleanResponse.substring(startIndex, endIndex + 1);
    const flashcardsData = JSON.parse(jsonString);

    const cards = flashcardsData.map(fc => ({
      question: fc.question,
      answer: fc.answer
    }));

    const createdFlashcard = await Flashcard.create({
      userId: req.user._id,
      documentId: documentId,
      cards: cards
    });

    res.status(201).json({
      success: true,
      count: createdFlashcard.cards.length,
      flashcards: createdFlashcard
    });
  } catch (error) {
    next(error);
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
    const { documentId, title, numQuestions } = req.body;

    if (!documentId) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    let relevantChunks = [];

    if (document.chunks && document.chunks.length > 0) {
      relevantChunks = document.chunks.slice(0, 5).map((c) => c.content);
    } else if (
      document.extractedText &&
      document.extractedText.trim().length > 0
    ) {
      relevantChunks = [document.extractedText];
    }

    if (relevantChunks.length === 0) {
      return res.status(400).json({
        message: "Document content is empty or not yet processed",
      });
    }

    const questionCount = numQuestions || 5;

    const prompt = `
Generate ${questionCount} multiple choice quiz questions from this document content.

Each question should:
- Have exactly 4 options
- Have one correct answer
- Return ONLY valid JSON

Format:
[
  {
    "question": "",
    "options": ["", "", "", ""],
    "correctAnswer": ""
  }
]

Document Content:
${relevantChunks.join("\n\n")}
`;

    const response = await geminiService.generateText(prompt);

    const cleanResponse = response
      .replace(/```json\s*|\s*```/g, "")
      .trim();

    const startIndex = cleanResponse.indexOf("[");
    const endIndex = cleanResponse.lastIndexOf("]");

    if (
      startIndex === -1 ||
      endIndex === -1 ||
      endIndex < startIndex
    ) {
      throw new Error(
        "AI response does not contain a valid JSON array"
      );
    }

    const jsonString = cleanResponse.substring(
      startIndex,
      endIndex + 1
    );

    const quizData = JSON.parse(jsonString);

    const createdQuiz = await Quiz.create({
      userId: req.user._id,
      documentId,
      title: title || `${document.title} Quiz`,
      questions: quizData,
      totalQuestions: quizData.length,
    });

    res.status(201).json({
      success: true,
      quiz: createdQuiz,
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

    let relevantChunks = [];
    if (document.chunks && document.chunks.length > 0) {
      relevantChunks = document.chunks.slice(0, 3).map(c => c.content);
    } else if (document.extractedText && document.extractedText.trim().length > 0) {
      relevantChunks = [document.extractedText];
    }

    if (relevantChunks.length === 0) {
      return res.status(400).json({ message: 'Document content is empty or not yet processed' });
    }
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

    let relevantChunks = [];
    if (document.chunks && document.chunks.length > 0) {
      relevantChunks = findRelevantChunks(document.chunks, message, 5).map(c => c.content);
    } else if (document.extractedText && document.extractedText.trim().length > 0) {
      relevantChunks = [document.extractedText];
    }

    if (relevantChunks.length === 0) {
      return res.status(400).json({ message: 'Document content is empty or not yet processed' });
    }
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

    let relevantChunks = [];
    if (document.chunks && document.chunks.length > 0) {
      relevantChunks = findRelevantChunks(document.chunks, concept, 5).map(c => c.content);
    } else if (document.extractedText && document.extractedText.trim().length > 0) {
      relevantChunks = [document.extractedText];
    }

    if (relevantChunks.length === 0) {
      return res.status(400).json({ message: 'Document content is empty or not yet processed' });
    }
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