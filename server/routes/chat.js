import express from 'express';
import { chat } from '../services/geminiService.js';

const router = express.Router();

// POST /api/chat
router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  try {
    const result = await chat(message);
    res.json(result);
  } catch (err) {
    console.error('[SkillBridge AI] Chat route error:', err);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
