import 'dotenv/config';   
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';  
import documentRoutes from './routes/documentRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// ES6 module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to handle CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'PrepWiseAI Backend', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'PrepWiseAI API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

//404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    statusCode: 404
  });
});

// Start the server if not running serverless
const PORT = process.env.PORT || 8000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

export default app;