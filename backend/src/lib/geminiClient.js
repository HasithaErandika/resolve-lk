import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

export const geminiClient = new GoogleGenAI({ apiKey: env.geminiApiKey });
export const GEMINI_TRIAGE_MODEL = 'gemini-3.1-flash-lite';
