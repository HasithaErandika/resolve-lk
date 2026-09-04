import { Router } from 'express';
import { isValidNic } from '../lib/nic.js';
import { loginCitizenByNic } from '../lib/citizens.js';

export const myReportsRouter = Router();

// POST /api/my-reports/login — PUBLIC. A citizen types only their NIC.
// Returns a real Supabase session (access_token/refresh_token) for the
// frontend to adopt via supabase.auth.setSession() — no password field is
// ever shown. See lib/citizens.js#loginCitizenByNic for how this works.
myReportsRouter.post('/login', async (req, res) => {
  const { nic } = req.body;

  if (!nic || !isValidNic(nic)) {
    return res.status(400).json({
      errors: { nic: 'Please enter a valid NIC number — either 9 digits followed by V/X, or 12 digits.' },
    });
  }

  const { session, error } = await loginCitizenByNic(nic.trim());

  if (error) {
    return res.status(404).json({ error });
  }

  res.json({ session });
});
