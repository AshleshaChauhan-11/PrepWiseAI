import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import path from 'path';

// @desc    Upload PDF document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF file",
        statusCode: 400
      });
    }

    const { title } = req.body;

    if (!title) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        statusCode: 400
      });
    }

    // Store relative file path instead of absolute URL
    const relativeFilePath = path.relative(process.cwd(), req.file.path);

    // Create document record
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: relativeFilePath,
      fileSize: req.file.size,
      status: 'processing'
    });

    // Process PDF in background
    processPDF(document._id, req.file.path).catch((error) => {
      console.error("Error processing PDF:", error);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded successfully. Processing may take a few moments."
    });

  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

// Helper function to process PDF and update document record
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    const chunks = chunkText(text, 500, 50);

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: 'ready'
    });

    // Clean up the uploaded file after processing to save storage
    await fs.unlink(filePath).catch(() => {});

    console.log(`Document ${documentId} processed successfully`);

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, { status: 'failed' });
    // Clean up file on error
    await fs.unlink(filePath).catch(() => {});
  }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $lookup: {
          from: 'flashcards',
          localField: '_id',
          foreignField: 'documentId',
          as: 'flashcards'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'documentId',
          as: 'quizzes'
        }
      },
      {
        $addFields: {
          flashcardCount: { $size: '$flashcards' },
          quizCount: { $size: '$quizzes' }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          title: 1,
          fileName: 1,
          fileSize: 1,
          status: 1,
          uploadDate: 1,
          flashcardCount: 1,
          quizCount: 1
        }
      },
      {
        $sort: { uploadDate: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single document with chunks
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404
      });
    }

    // Check if user owns this document
    if (document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this document",
        statusCode: 403
      });
    }

    // Check if document is still processing
    if (document.status === 'processing') {
      return res.status(202).json({
        success: false,
        error: "Document is still being processed. Please try again in a moment.",
        statusCode: 202
      });
    }

    if (document.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: "Document processing failed. Please upload again.",
        statusCode: 400
      });
    }

    // Fetch related flashcards and quizzes
    const flashcards = await Flashcard.find({ documentId: id });
    const quizzes = await Quiz.find({ documentId: id });

    res.status(200).json({
      success: true,
      data: {
        ...document.toObject(),
        flashcards,
        quizzes
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404
      });
    }

    // Check if user owns this document
    if (document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this document",
        statusCode: 403
      });
    }

    // Delete all associated flashcards
    await Flashcard.deleteMany({ documentId: id });

    // Delete all associated quizzes
    await Quiz.deleteMany({ documentId: id });

    // Delete the document from database
    await Document.findByIdAndDelete(id);

    // Delete the file from filesystem if it exists
    if (document.filePath) {
      await fs.unlink(document.filePath).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: "Document and all associated flashcards/quizzes deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update document title
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400
      });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid document title",
        statusCode: 400
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404
      });
    }

    // Check if user owns this document
    if (document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this document",
        statusCode: 403
      });
    }

    // Update the document
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      { title: title.trim() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedDocument,
      message: "Document title updated successfully"
    });

  } catch (error) {
    next(error);
  }
};