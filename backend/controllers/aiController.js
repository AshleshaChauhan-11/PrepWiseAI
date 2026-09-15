import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import groqService from '../utils/groqService.js';

/**
 * Pulls usable text out of a document.
 * Prefers pre-computed chunks, falls back to raw extracted text.
 * Returns an array of strings, or null if the document has no content.
 */
const getDocumentContent = (document, maxChunks = 5) => {
  if (document.chunks && document.chunks.length > 0) {
    return document.chunks.slice(0, maxChunks).map((chunk) => chunk.content);
  }
  if (document.extractedText && document.extractedText.trim().length > 0) {
    return [document.extractedText];
  }
  return null;
};

/**
 * Strips markdown fences the model sometimes wraps JSON in,
 * then parses. Throws with the raw text attached so callers can surface it.
 */
const parseJsonResponse = (response) => {
  const cleaned = response
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
    const err = new Error('AI did not return JSON');
    err.rawResponse = cleaned;
    throw err;
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    const err = new Error('Failed to parse AI response');
    err.rawResponse = cleaned;
    throw err;
  }
};

// @desc    Generate flashcards from document
// @route   POST /api/ai/generate-flashcards
// @access  Private
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const relevantChunks = getDocumentContent(document, 5);

    if (!relevantChunks) {
      return res.status(400).json({
        success: false,
        message: 'Document content is empty or not processed.',
      });
    }

    const prompt = `
Generate ${count} flashcards from the document content below.

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

Format:
[
  {
    "question": "Question text",
    "answer": "Answer text"
  }
]

Document Content:
${relevantChunks.join('\n\n')}
`;

    const response = await groqService.generateText(prompt);

    let flashcardsData;
    try {
      flashcardsData = parseJsonResponse(response);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        rawResponse: error.rawResponse,
      });
    }

    if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI did not return an array of flashcards',
      });
    }

    const flashcards = flashcardsData.map((fc) => ({
      userId: req.user._id,
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
    console.error('Generate Flashcards Error:', error);
    next(error);
  }
};

// @desc    Mark a flashcard as reviewed
// @route   PATCH /api/ai/flashcards/:id/review
// @access  Private
export const markReviewed = async (req, res, next) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found',
      });
    }

    // Ownership check — a user should not be able to touch someone else's card
    if (flashcard.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this flashcard',
      });
    }

    flashcard.reviewCount = (flashcard.reviewCount || 0) + 1;
    flashcard.lastReviewedAt = new Date();

    await flashcard.save();

    return res.status(200).json({
      success: true,
      flashcard,
    });
  } catch (error) {
    console.error('Mark Reviewed Error:', error);
    next(error);
  }
};

// @desc    Generate quiz from document
// @route   POST /api/ai/generate-quiz
// @access  Private
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, count = 5 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const relevantChunks = getDocumentContent(document, 5);

    if (!relevantChunks) {
      return res.status(400).json({
        success: false,
        message: 'Document content is empty or not processed.',
      });
    }

    const prompt = `
Generate exactly ${count} multiple choice quiz questions from the document content below.

Return ONLY a valid JSON array. No markdown, no code fences, no explanation.

Format:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation why this is correct"
  }
]

Each question MUST have exactly 4 options, and correctAnswer MUST exactly match one of them.

Document Content:
${relevantChunks.join('\n\n')}
`;

    const response = await groqService.generateText(prompt);

    let quizData;
    try {
      quizData = parseJsonResponse(response);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        rawResponse: error.rawResponse,
      });
    }

    if (!Array.isArray(quizData) || quizData.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI did not return valid quiz questions',
      });
    }

    const createdQuiz = await Quiz.create({
      userId: req.user._id,
      documentId,
      title: `Quiz - ${document.title || document.fileName || 'Document'}`,
      questions: quizData,
      totalQuestions: quizData.length,
    });

    return res.status(201).json({
      success: true,
      quiz: createdQuiz,
    });
  } catch (error) {
    console.error('Generate Quiz Error:', error);
    next(error);
  }
};

// @desc    Generate summary from document
// @route   POST /api/ai/generate-summary
// @access  Private
export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const relevantChunks = getDocumentContent(document, 3);

    if (!relevantChunks) {
      return res.status(400).json({
        success: false,
        message: 'Document content is empty or not processed.',
      });
    }

    const prompt = `Generate a concise summary (150-200 words) of this document content:\n\n${relevantChunks.join('\n\n')}`;

    const summary = await groqService.generateText(prompt);

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Generate Summary Error:', error);
    next(error);
  }
};

// @desc    Chat with document
// @route   POST /api/ai/chat
// @access  Private
export const chat = async (req, res, next) => {
  try {
    const { documentId, message } = req.body;

    if (!documentId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and message are required',
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const relevantChunks = getDocumentContent(document, 5);

    if (!relevantChunks) {
      return res.status(400).json({
        success: false,
        message: 'Document content is empty or not processed.',
      });
    }

    const prompt = `You are helping a user chat with this document. Answer their question based on the document content below. If the answer isn't in the document, state that clearly.

User question: ${message}

Document content:
${relevantChunks.join('\n\n')}`;

    const response = await groqService.generateText(prompt);

    await ChatHistory.create({
      userId: req.user._id,
      documentId,
      userMessage: message,
      aiResponse: response,
    });

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Chat Error:', error);
    next(error);
  }
};

// @desc    Explain a concept from document
// @route   POST /api/ai/explain-concept
// @access  Private
export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;

    if (!documentId || !concept) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and concept name are required',
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const relevantChunks = getDocumentContent(document, 5);

    if (!relevantChunks) {
      return res.status(400).json({
        success: false,
        message: 'Document content is empty or not processed.',
      });
    }

    const prompt = `Explain the concept "${concept}" in detail based on this document content. Provide a clear, comprehensive explanation with examples if available.

Document content:
${relevantChunks.join('\n\n')}`;

    const explanation = await groqService.generateText(prompt);

    return res.status(200).json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error('Explain Concept Error:', error);
    next(error);
  }
};

// @desc    Get chat history for a document
// @route   GET /api/ai/chat-history/:documentId
// @access  Private
export const getChatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const chatHistory = await ChatHistory.find({
      documentId,
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: chatHistory.length,
      chatHistory,
    });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    next(error);
  }
};