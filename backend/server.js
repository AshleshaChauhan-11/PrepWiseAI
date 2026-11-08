import "dotenv/config";
import express from "express";
import cors from "cors";

import errorHandler from "./middleware/errorHandler.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

// Enable CORS for all requests
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Lightweight health check endpoint (never connects to DB)
app.get(["/api/health", "/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "PrepWiseAI Backend",
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGroqApiKey: !!process.env.GROQ_API_KEY,
      nodeEnv: process.env.NODE_ENV || "production"
    }
  });
});

app.get(["/api", "/"], (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "PrepWiseAI API is operational"
  });
});

// Database connection middleware for functional API routes
app.use(async (req, res, next) => {
  // Never connect DB for health and status endpoints
  const cleanPath = req.path.replace(/\/$/, "");
  if (
    cleanPath === "/health" ||
    cleanPath === "/api/health" ||
    cleanPath === "" ||
    cleanPath === "/api"
  ) {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message || error);
    const isMissingUri = !process.env.MONGODB_URI;
    res.status(500).json({
      success: false,
      error: isMissingUri
        ? "MongoDB URI is not configured. Please add MONGODB_URI in Vercel Project Settings -> Environment Variables."
        : "Failed to connect to MongoDB database. Check your MongoDB Atlas Network Access whitelist (allow 0.0.0.0/0).",
      statusCode: 500
    });
  }
});

// API routes (support both with and without /api prefix)
app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/documents", "/documents"], documentRoutes);
app.use(["/api/flashcards", "/flashcards"], flashcardRoutes);
app.use(["/api/quizzes", "/quizzes"], quizRoutes);
app.use(["/api/progress", "/progress"], progressRoutes);
app.use(["/api/ai", "/ai"], aiRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    statusCode: 404
  });
});

// Start the server if running locally (not in Vercel serverless)
const PORT = process.env.PORT || 8000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
