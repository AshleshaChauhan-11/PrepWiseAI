import express from 'express';

import {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz
} from '../controllers/quizController.js';

import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get("/document/:documentId", getAllQuizzes);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz);
router.get('/:id/results', getQuizResults);
router.delete('/:id', deleteQuiz);

export default router;