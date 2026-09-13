/**
 * SkillBridge AI - Google Gemini AI Service
 * Handles AI Quiz Generation, Competency Assessments, and Skill Diagnostics
 * Built with strict JSON validation, automatic retry, and seamless SIH Demo Mode fallback.
 */

import { cleanAIJsonResponse } from '../utils/jsonCleaner.js';
import { DEMO_QUIZZES, DEMO_RECOMMENDATIONS } from '../utils/demoData.js';

const FAST_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash'
];

export function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || '').trim();
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || FAST_MODELS[0];
}

/**
 * Check if live Gemini API is configured
 */
export function isGeminiConfigured() {
  const key = getGeminiApiKey();
  return Boolean(
    key &&
    key !== '' &&
    !key.includes('your_gemini_api_key_here')
  );
}

/**
 * Call Gemini REST API with prompt and automated model cascade
 */
async function callGeminiApi(systemInstruction, userPrompt, isJson = true) {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured. Demo Mode is active.');
  }

  const key = getGeminiApiKey();
  const modelsToTry = [getGeminiModel(), ...FAST_MODELS.filter(m => m !== getGeminiModel())];

  const generationConfig = {
    temperature: isJson ? 0.2 : 0.6,
    topP: 0.85,
    topK: 40,
    maxOutputTokens: 2048
  };

  if (isJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\n${userPrompt}` }
        ]
      }
    ],
    generationConfig
  };

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) return rawText;
      } else {
        const errorText = await response.text();
        console.warn(`[SkillBridge AI] Model ${model} returned ${response.status}, attempting fallback model...`);
        lastError = `Gemini API Error (${response.status}): ${errorText.substring(0, 120)}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || 'Gemini API returned an empty response across all available models.');
}

/**
 * Generate AI Quiz from material text or specific topic
 */
export async function generateQuiz({ materialText, topic, difficulty = 'Medium', questionCount = 5 }) {
  const targetTopic = topic || 'Subject Mastery';
  const numQuestions = Math.min(10, Math.max(3, parseInt(questionCount, 10) || 5));

  // If Gemini is not configured, immediately use high-quality Demo dataset
  if (!isGeminiConfigured()) {
    console.log('[SkillBridge AI] Demo Mode active: Serving curated demo quiz for topic:', targetTopic);
    return getFallbackQuiz(targetTopic, numQuestions);
  }

  const systemInstruction = `You are an expert educational assessment generator.
Using ONLY the supplied learning material, create a quiz.

Return ONLY valid JSON.
Do not use Markdown.
Do not use code fences.
Do not include any text outside the JSON.

Schema:
{
  "title": "string",
  "topic": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}

Rules:
- Exactly four options.
- correctAnswer must be a zero-based integer from 0 to 3.
- Questions must be answerable using only the supplied material.
- Avoid duplicate questions.
- Make questions educational and meaningful.
- Include a clear explanation for why the correct option is right and the others are not.
- Generate exactly the requested number of questions (${numQuestions}).
- Target difficulty level: ${difficulty}.`;

  const userPrompt = `Learning Material / Topic Focus:
${materialText ? materialText.substring(0, 8000) : `Topic: ${targetTopic}`}

Generate exactly ${numQuestions} multiple choice questions with difficulty "${difficulty}".`;

  try {
    const rawAiResponse = await callGeminiApi(systemInstruction, userPrompt);
    return cleanAIJsonResponse(rawAiResponse, 'quiz');
  } catch (initialErr) {
    console.warn('[SkillBridge AI] First AI attempt failed or had parse error:', initialErr.message);

    // Attempt 1 retry with stricter formatting enforcement
    try {
      const retrySystemInstruction = `${systemInstruction}\nCRITICAL: The previous output failed JSON parsing. Return strictly raw JSON starting with { and ending with }.`;
      const retryResponse = await callGeminiApi(retrySystemInstruction, userPrompt);
      return cleanAIJsonResponse(retryResponse, 'quiz');
    } catch (retryErr) {
      console.error('[SkillBridge AI] Retry failed:', retryErr.message);
      // Fail-safe: fall back to built-in curated quiz so the SIH live demo never crashes
      console.log('[SkillBridge AI] Falling back to curated demo dataset for guaranteed reliability.');
      return getFallbackQuiz(targetTopic, numQuestions);
    }
  }
}

/**
 * Generate Competency Assessment Questions
 */
export async function generateCompetencyAssessment({ competency, difficulty = 'Medium', questionCount = 5 }) {
  const numQuestions = Math.min(10, Math.max(3, parseInt(questionCount, 10) || 5));

  if (!isGeminiConfigured()) {
    console.log('[SkillBridge AI] Demo Mode active: Serving competency assessment for:', competency);
    return getFallbackAssessment(competency, numQuestions);
  }

  const systemInstruction = `You are a certified corporate competency assessor.
Generate a rigorous competency evaluation for the skill: "${competency}".

Return ONLY valid JSON.
Do not use Markdown.
Do not use code fences.
Do not include any text outside the JSON.

Schema:
{
  "title": "Assessment - ${competency}",
  "competency": "${competency}",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}

Rules:
- Exactly four options.
- correctAnswer must be a zero-based integer from 0 to 3.
- Questions should test conceptual clarity, real-world application, and problem solving.
- Include a constructive explanation.
- Generate exactly ${numQuestions} questions.
- Difficulty: ${difficulty}.`;

  const userPrompt = `Evaluate competency in: ${competency} with ${numQuestions} scenario-based and diagnostic questions.`;

  try {
    const rawAiResponse = await callGeminiApi(systemInstruction, userPrompt);
    return cleanAIJsonResponse(rawAiResponse, 'assessment');
  } catch (err) {
    console.warn('[SkillBridge AI] Assessment AI call failed, using curated assessment fallback:', err.message);
    return getFallbackAssessment(competency, numQuestions);
  }
}

/**
 * Generate AI Diagnostic Insights for Skill Gap Analysis
 */
export async function generateSkillInsights(competencyScores) {
  const scoreList = Object.entries(competencyScores)
    .map(([skill, score]) => `${skill}: ${score}%`)
    .join(', ');

  const strong = Object.entries(competencyScores).filter(([, s]) => s >= 70).map(([k]) => k);
  const gaps = Object.entries(competencyScores).filter(([, s]) => s < 60).map(([k]) => k);

  if (!isGeminiConfigured()) {
    return {
      overview: `Based on your evaluation across ${Object.keys(competencyScores).length} competencies, your overall profile demonstrates clear specialization strengths alongside targeted growth opportunities.`,
      strongSummary: strong.length > 0
        ? `Your strongest areas are ${strong.join(' and ')}, demonstrating solid foundational mastery and reliable execution.`
        : 'Foundational capabilities established; ready for accelerated skill sprints.',
      gapSummary: gaps.length > 0
        ? `Your most critical competency gaps are in ${gaps.join(' and ')}. Strengthening these will balance your profile and unlock advanced learning paths.`
        : 'No critical competency gaps below 60%. Focus on advanced mastery and cross-functional leadership.',
      actionableAdvice: [
        `Dedicate 3–4 focused hours per week to ${gaps[0] || 'foundational core skills'}.`,
        'Upload domain-specific lecture notes or documentation into Learning Hub to generate targeted practice quizzes.',
        'Complete reassessments bi-weekly to verify retention and track before-vs-current competency velocity.'
      ]
    };
  }

  const prompt = `You are an AI competency analyst for Smart India Hackathon.
Analyze the following learner scores: ${scoreList}.
Provide actionable diagnostic feedback in JSON:
{
  "overview": "2 sentence executive summary of learner status",
  "strongSummary": "Specific highlights of strong competencies",
  "gapSummary": "Analysis of skill gaps and risks",
  "actionableAdvice": ["Action step 1", "Action step 2", "Action step 3"]
}`;

  try {
    const raw = await callGeminiApi('Return pure JSON without markdown fences.', prompt);
    return cleanAIJsonResponse(raw, 'analysis');
  } catch (err) {
    console.warn('[SkillBridge AI] AI insight generation failed, using dynamic local synthesis:', err.message);
    return {
      overview: `Evaluated across ${Object.keys(competencyScores).length} key competency dimensions.`,
      strongSummary: strong.length > 0 ? `Proficient in ${strong.join(', ')}.` : 'Steady core foundation.',
      gapSummary: gaps.length > 0 ? `Targeted gap in ${gaps.join(', ')}.` : 'Balanced skill distribution.',
      actionableAdvice: [
        'Complete personalized learning recommendations.',
        'Take focused micro-quizzes on weaker topics.',
        'Track improvement velocity with reassessments.'
      ]
    };
  }
}

/**
 * Fallback Quiz Selector
 */
function getFallbackQuiz(topic, count = 5) {
  const normalized = (topic || '').toLowerCase();
  let selected = DEMO_QUIZZES.python;

  if (normalized.includes('data') || normalized.includes('sql') || normalized.includes('stat')) {
    selected = DEMO_QUIZZES['data-analysis'];
  } else if (normalized.includes('comm') || normalized.includes('speak') || normalized.includes('writing')) {
    selected = DEMO_QUIZZES.communication;
  } else if (normalized.includes('problem') || normalized.includes('algo') || normalized.includes('logic')) {
    selected = DEMO_QUIZZES['problem-solving'];
  } else if (normalized.includes('lead') || normalized.includes('manage') || normalized.includes('strategy')) {
    selected = DEMO_QUIZZES.leadership;
  }

  const questions = selected.questions.slice(0, count);
  return {
    title: selected.title,
    topic: selected.topic,
    questions,
    isDemo: true
  };
}

/**
 * Fallback Assessment Selector
 */
function getFallbackAssessment(competency, count = 5) {
  const norm = (competency || '').toLowerCase();
  let selected = DEMO_QUIZZES.python;

  if (norm.includes('data')) selected = DEMO_QUIZZES['data-analysis'];
  else if (norm.includes('comm')) selected = DEMO_QUIZZES.communication;
  else if (norm.includes('problem')) selected = DEMO_QUIZZES['problem-solving'];
  else if (norm.includes('lead')) selected = DEMO_QUIZZES.leadership;

  return {
    title: `Competency Assessment: ${competency || selected.topic}`,
    competency: competency || selected.topic,
    questions: selected.questions.slice(0, count),
    isDemo: true
  };
}

/**
 * SkillBridge AI General-Purpose Educational & Career Assistant
 */
export async function chat(message, history = []) {
  const query = (message || '').trim();
  if (!query) {
    return { reply: "Hello! I am your SkillBridge AI Assistant. Ask me any question in mathematics, programming, science, engineering, or career guidance." };
  }

  if (!isGeminiConfigured()) {
    return {
      reply: "SkillBridge AI Assistant is active! GEMINI_API_KEY is not currently set in environment variables. Please set GEMINI_API_KEY in Render to receive live AI answers.",
      error: "GEMINI_API_KEY is not configured"
    };
  }

  const systemInstruction = "You are SkillBridge AI Assistant, a helpful general-purpose educational and career assistant. Answer the user's actual question directly, accurately, and clearly. You can help with mathematics, equations, programming, science, engineering, technology, education, careers, reasoning, and general knowledge. For equations and mathematical problems, solve them step by step and verify the result. Stay relevant to the user's question. Do not unnecessarily redirect the user to quizzes, assessments, or SkillBridge features. Maintain conversation context for follow-up questions. For any harmful, illegal, or dangerous requests, refuse briefly and safely without providing instructions that could cause harm. For normal educational and technical questions, answer thoroughly and clearly.";

  // Build multi-turn conversation contents for session context memory
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const h of recentHistory) {
      if (h && h.role === 'user' && typeof h.text === 'string' && h.text.trim()) {
        contents.push({
          role: 'user',
          parts: [{ text: h.text.trim() }]
        });
      } else if (h && (h.role === 'assistant' || h.role === 'model') && typeof h.text === 'string' && h.text.trim() && !h.isError) {
        contents.push({
          role: 'model',
          parts: [{ text: h.text.trim() }]
        });
      }
    }
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: query }]
  });

  const key = getGeminiApiKey();
  const modelsToTry = [getGeminiModel(), ...FAST_MODELS.filter(m => m !== getGeminiModel())];

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      topP: 0.85,
      topK: 40,
      maxOutputTokens: 2048
    }
  };

  let lastError = null;
  let isQuotaExceeded = false;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const candidate = result.candidates?.[0];
        const rawText = candidate?.content?.parts?.map(p => p.text || '').join('').trim();

        if (rawText) {
          return { reply: rawText };
        }

        if (candidate?.finishReason === 'SAFETY') {
          return { reply: "I cannot fulfill this request as it involves sensitive or unsafe content. Please feel free to ask any educational, mathematical, programming, or career question." };
        }
      } else {
        const errorText = await response.text();
        console.warn(`[SkillBridge AI] Chat with model ${model} returned ${response.status}: ${errorText.substring(0, 120)}`);
        if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
          isQuotaExceeded = true;
        }
        lastError = `Gemini status ${response.status}: ${errorText.substring(0, 120)}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  console.error('[SkillBridge AI] All candidate Gemini models failed:', lastError);

  if (isQuotaExceeded) {
    return {
      reply: "The Gemini AI rate limit/quota has been reached. Please try again in a few moments. All other SkillBridge AI features (Quizzes, Assessments, Diagnostics) remain active.",
      error: "Gemini API Quota Exceeded (429)"
    };
  }

  return {
    reply: "The AI service is temporarily unavailable. Please try your question again in a moment.",
    error: lastError
  };
}
