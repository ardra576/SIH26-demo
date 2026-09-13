import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRouter from './routes/health.js';
import materialsRouter from './routes/materials.js';
import quizRouter from './routes/quiz.js';
import assessmentRouter from './routes/assessment.js';
import analysisRouter from './routes/analysis.js';
import { isGeminiConfigured } from './services/geminiService.js';
import chatRouter from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Mount API Routes
app.use('/api/health', healthRouter);
app.use('/api/process-material', materialsRouter);
app.use('/api/generate-quiz', quizRouter);
app.use('/api/evaluate-quiz', quizRouter); // supports both /api/evaluate-quiz and /api/generate-quiz/evaluate
app.use('/api/generate-assessment', assessmentRouter);
app.use('/api/analyze-skills', analysisRouter);
app.use('/api/recommend-learning', analysisRouter);
app.use('/api/chat', chatRouter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SkillBridge AI API',
    tagline: 'Learn Smarter. Identify Skills. Grow Faster.',
    hackathon: 'Smart India Hackathon 2026',
    status: 'Running',
    geminiActive: isGeminiConfigured(),
    docs: '/api/health'
  });
});

// JSON 404 handler - Never return HTML
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requestedUrl: req.originalUrl
  });
});

// Global JSON error handler - Never crash or leak stack traces to client
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected error occurred on the server.',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n==================================================');
  console.log(`ðŸŒŸ SkillBridge AI Server is active on port ${PORT}`);
  console.log(`ðŸ”— API Base: http://localhost:${PORT}/api/health`);
  console.log(`ðŸ¤– Mode: ${isGeminiConfigured() ? 'Gemini Live AI' : 'SIH Demo Mode (Active & Safe)'}`);
  console.log('==================================================\n');
});

