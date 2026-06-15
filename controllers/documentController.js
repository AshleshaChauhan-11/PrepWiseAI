import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';

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
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        statusCode: 400
      });
    }

    // construct url to upload file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    // create document record
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: fileUrl,
      fileSize: req.file.size,
      status: 'processing'
    });

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

// helper function to process PDF and update document record
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    const chunks = chunkText(text, 500, 50);

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: 'ready'
    });

    console.log(`Document ${documentId} processed successfully`);

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, { status: 'failed' });
  }
};
// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
try{
  const documents = await Document.aggregate([
    { $match: { userId:req.user._id }},
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
        extractedText: 0,
        chunks: 0,
        flashcards: 0,
        quizzes: 0
      }
    },
    {
      $sort:{uploadDate: -1}
    }
  ]);
  res.status(200).json({
    success: true,
    data: documents
  });
}
  catch (error){
  next(error);
  }
};

// @desc    Get single document with chunks
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res, next) => {

};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {

};

// @desc    Update document title
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res, next) => { 

};
