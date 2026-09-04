import { GoogleGenAI } from '@google/genai';

const { GEMINI_API_KEY } = process.env;

let client = null;

function getClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in the environment.');
  }
  if (!client) client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `You are a municipal engineer triaging civic issue reports for a Sri Lankan local council.
Given a report's category and description, assess public danger and respond with ONLY a JSON object,
no other text, matching exactly this shape:
{"priority": "Low" | "Medium" | "Critical", "department": string, "reason": string}
"reason" must be one sentence explaining the priority in plain English.`;

const FALLBACK_TRIAGE = {
  priority: 'Medium',
  department: 'General Municipal Services',
  reason: 'Default triage — automatic assessment was unavailable for this report.',
};

/**
 * Calls Gemini to triage a civic issue report. Falls back to a safe default
 * if the API call fails or returns something we can't parse, so a bad AI
 * response never blocks a citizen's submission.
 */
export async function triageIssue({ category, description }) {
  try {
    const response = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Category: ${category}\nDescription: ${description}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text.trim());

    if (
      !['Low', 'Medium', 'Critical'].includes(parsed.priority) ||
      typeof parsed.department !== 'string' ||
      typeof parsed.reason !== 'string'
    ) {
      throw new Error('Unexpected shape from Gemini triage response.');
    }

    return parsed;
  } catch (error) {
    console.error('Gemini triage failed, using fallback:', error.message);
    return FALLBACK_TRIAGE;
  }
}
