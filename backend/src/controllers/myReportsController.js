import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateNic } from '../validation/issuesValidation.js';
import { loginCitizenByNic } from '../services/citizenService.js';

export const login = asyncHandler(async (req, res) => {
  const nic = req.body?.nic;
  const nicError = validateNic(nic);
  if (nicError) throw AppError.badRequest({ nic: nicError });

  const session = await loginCitizenByNic(nic.trim());
  res.json({ session });
});
