/**
 * SkillBridge AI - Google Gemini AI Service
 * Handles AI Quiz Generation, Competency Assessments, and Skill Diagnostics
 * Built with strict JSON validation, automatic retry, and seamless SIH Demo Mode fallback.
 */

import { cleanAIJsonResponse } from '../utils/jsonCleaner.js';
import { DEMO_QUIZZES, DEMO_RECOMMENDATIONS } from '../utils/demoData.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Check if live Gemini API is configured
 */
export function isGeminiConfigured() {
  return Boolean(
    GEMINI_API_KEY &&
    GEMINI_API_KEY.trim() !== '' &&
    !GEMINI_API_KEY.includes('your_gemini_api_key_here')
  );
}

/**
 * Call Gemini REST API with prompt
 */
async function callGeminiApi(systemInstruction, userPrompt) {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured. Demo Mode is active.');
  }

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY.trim()}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\n${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = response.statusText;
    try {
      const errJson = JSON.parse(errorText);
      errorDetail = errJson.error?.message || errorDetail;
    } catch {
      errorDetail = errorText.substring(0, 150);
    }
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  return rawText;
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
export async function chat(message) {
  // Simple chat endpoint – returns Gemini response or demo fallback
  if (!isGeminiConfigured()) {
    return { reply: 'Demo mode: I am here to assist you with SkillBridge AI. Ask any question about your learning path.' };
  }
  const systemInstruction = 'You are a helpful AI assistant for SkillBridge. Respond in plain text without markdown.';
  try {
    const raw = await callGeminiApi(systemInstruction, message);
    return { reply: raw.trim() };
  } catch (err) {
    console.error('[SkillBridge AI] Chat endpoint error:', err.message);
    return { reply: 'Sorry, I could not process your request.' };
  }
}
