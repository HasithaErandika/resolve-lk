import { geminiClient, GEMINI_TRIAGE_MODEL } from '../lib/geminiClient.js';

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

function isValidTriageShape(value) {
  return (
    value &&
    ['Low', 'Medium', 'Critical'].includes(value.priority) &&
    typeof value.department === 'string' &&
    typeof value.reason === 'string'
  );
}

export async function triageIssue({ category, description }) {
  try {
    const response = await geminiClient.models.generateContent({
      model: GEMINI_TRIAGE_MODEL,
      contents: `Category: ${category}\nDescription: ${description}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text.trim());
    if (!isValidTriageShape(parsed)) throw new Error('Unexpected shape from Gemini triage response.');

    return parsed;
  } catch (error) {
    console.error('Gemini triage failed, using fallback:', error.message);
    return FALLBACK_TRIAGE;
  }
}
