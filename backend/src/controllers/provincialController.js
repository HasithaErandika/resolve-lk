import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listEscalations } from '../services/escalationService.js';
import { createMunicipalOfficer } from '../services/councilService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getEscalations = asyncHandler(async (req, res) => {
  const result = await listEscalations(req.profile, req.query);
  res.json(result);
});

export const createMunicipalOfficerAccount = asyncHandler(async (req, res) => {
  const { council_id: councilId, email, full_name: fullName } = req.body || {};
  const errors = {};
  if (!councilId || !UUID_REGEX.test(councilId)) errors.council_id = 'A valid council is required.';
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (Object.keys(errors).length > 0) throw AppError.badRequest(errors);

  const officer = await createMunicipalOfficer(req.profile, { councilId, email: email.trim(), fullName });
  res.status(201).json(officer);
});
