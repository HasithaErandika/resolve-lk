import { geminiClient, GEMINI_TRIAGE_MODEL } from '../lib/geminiClient.js';
import { matchNationalHighway } from '../lib/rdaRoads.js';

// Mirrors the jurisdiction table in docs/srs/03-governance-and-roles.md - // Gemini is instructed against this explicitly rather than left to guess,
// since a wrong jurisdiction call pollutes a council's SLA metrics.
const SYSTEM_PROMPT = `You are a triage assistant for Resolve LK, a civic-issue reporting platform used by Sri Lankan Municipal Councils.
Given a report's category and description, assess two things: how urgent it is, and whether it is actually the Municipal Council's
job to fix, or another authority's. Respond with ONLY a JSON object, no other text, matching exactly this shape:
{"priority": "Low" | "Medium" | "High" | "Critical", "jurisdiction": "in_council" | "redirect", "redirect_authority": "NWSDB" | "RDA" | "PRDA" | "CEB" | "Police" | "Other" | null, "department": string | null, "reason": string}

Jurisdiction rules (apply these, don't improvise):
- Garbage / Solid Waste: always "in_council".
- Drainage: always "in_council".
- Road: three tiers, most reports are the first - - "in_council" for an ordinary local/municipal street (a pothole, a residential lane) with no road classification mentioned.
  - "redirect" to "RDA" if the description clearly names a national highway - an A/B-class numbered road (e.g. "A1", "A9") or an expressway (E-class), including any explicitly flagged below as a known-highway match.
  - "redirect" to "PRDA" (Provincial Road Development Authority) if the description clearly names a C/D-class numbered provincial road. These are NOT the Municipal Council's roads and NOT RDA's either - don't default a C/D-class mention to "in_council" just because it isn't a national highway.
- Lighting: always "in_council" (the council owns the fixtures even though CEB owns the electricity supply).
- Water / Sewerage: "redirect" to "NWSDB", UNLESS told this council operates its own water scheme (see the note below), in which case "in_council".
- Public Safety: "in_council" if it's an infrastructure hazard (an unguarded excavation, a collapsed pavement). "redirect" to "Police" if it describes a crime or an active emergency.
- Other: "in_council" with "department": null - a human will review it.

When jurisdiction is "redirect", set "department" to null. When jurisdiction is "in_council", "redirect_authority" must be null.
"reason" must be one sentence explaining both the priority and the jurisdiction call in plain English.`;

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_JURISDICTIONS = ['in_council', 'redirect'];
const VALID_REDIRECT_AUTHORITIES = ['NWSDB', 'RDA', 'PRDA', 'CEB', 'Police', 'Other'];

const FALLBACK_TRIAGE = {
  priority: 'Medium',
  jurisdiction: 'in_council',
  redirect_authority: null,
  department: 'General Municipal Services',
  reason: 'Default triage - automatic assessment was unavailable for this report.',
};

function isValidTriageShape(value) {
  if (!value || !VALID_PRIORITIES.includes(value.priority) || !VALID_JURISDICTIONS.includes(value.jurisdiction)) {
    return false;
  }
  if (value.jurisdiction === 'redirect' && !VALID_REDIRECT_AUTHORITIES.includes(value.redirect_authority)) {
    return false;
  }
  if (value.jurisdiction === 'in_council' && value.redirect_authority !== null && value.redirect_authority !== undefined) {
    return false;
  }
  return typeof value.reason === 'string';
}

export async function triageIssue({ category, description, landmark, operatesOwnWaterScheme = false }) {
  try {
    const waterNote =
      category === 'Water' || category === 'Sewerage'
        ? operatesOwnWaterScheme
          ? '\nNote: this council DOES operate its own water/sewerage scheme - treat Water/Sewerage as "in_council".'
          : '\nNote: this council does NOT operate its own water/sewerage scheme - treat Water/Sewerage as "redirect" to NWSDB.'
        : '';

    const matchedHighway = category === 'Road' ? matchNationalHighway(`${description} ${landmark ?? ''}`) : null;
    const roadNote = matchedHighway
      ? `\nNote: the description/landmark matches known national highway ${matchedHighway} - this is very likely "redirect" to RDA.`
      : '';

    const response = await geminiClient.models.generateContent({
      model: GEMINI_TRIAGE_MODEL,
      contents: `Category: ${category}\nDescription: ${description}${waterNote}${roadNote}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text.trim());
    if (!isValidTriageShape(parsed)) throw new Error('Unexpected shape from Gemini triage response.');

    return {
      priority: parsed.priority,
      jurisdiction: parsed.jurisdiction,
      redirectAuthority: parsed.redirect_authority ?? null,
      department: parsed.department ?? null,
      reason: parsed.reason,
    };
  } catch (error) {
    console.error('Gemini triage failed, using fallback:', error.message);
    return {
      priority: FALLBACK_TRIAGE.priority,
      jurisdiction: FALLBACK_TRIAGE.jurisdiction,
      redirectAuthority: FALLBACK_TRIAGE.redirect_authority,
      department: FALLBACK_TRIAGE.department,
      reason: FALLBACK_TRIAGE.reason,
    };
  }
}
