import express from 'express';

import {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz,
} from '../controllers/quizController.js';

import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// IMPORTANT: Specific routes MUST come before wildcard /:documentId
router.get('/quiz/:id', getQuizById);           // GET  /api/quizzes/quiz/:id
router.post('/:id/submit', submitQuiz);         // POST /api/quizzes/:id/submit
router.get('/:id/results', getQuizResults);     // GET  /api/quizzes/:id/results
router.delete('/:id', deleteQuiz);              // DELETE /api/quizzes/:id

// Wildcard LAST — otherwise it swallows all above routes
router.get('/:documentId', getQuizzes);         // GET  /api/quizzes/:documentId

export default router;