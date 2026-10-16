import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateNic, validateOtpCode } from '../validation/issuesValidation.js';
import { requestOtp, verifyOtp } from '../services/otpService.js';

export const requestOtpCode = asyncHandler(async (req, res) => {
  const nic = req.body?.nic;
  const nicError = validateNic(nic);
  if (nicError) throw AppError.badRequest({ nic: nicError });

  await requestOtp(nic.trim());
  // Deliberately the same response whether or not this NIC is registered - // see services/otpService.js.
  res.json({ message: 'A verification code has been sent.' });
});

export const verifyOtpCode = asyncHandler(async (req, res) => {
  const nic = req.body?.nic;
  const code = req.body?.code;
  const nicError = validateNic(nic);
  const codeError = validateOtpCode(code);
  if (nicError || codeError) throw AppError.badRequest({ ...(nicError && { nic: nicError }), ...(codeError && { code: codeError }) });

  const session = await verifyOtp(nic.trim(), String(code).trim());
  res.json({ session });
});
