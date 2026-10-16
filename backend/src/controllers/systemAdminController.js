import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createProvincialOfficer } from '../services/councilService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createProvincialOfficerAccount = asyncHandler(async (req, res) => {
  const { province_id: provinceId, email, full_name: fullName } = req.body || {};
  const errors = {};
  if (!provinceId || !UUID_REGEX.test(provinceId)) errors.province_id = 'A valid province is required.';
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (Object.keys(errors).length > 0) throw AppError.badRequest(errors);

  const officer = await createProvincialOfficer({ provinceId, email: email.trim(), fullName });
  res.status(201).json(officer);
});
