import { Router } from 'express';
import { requireAuth, attachProfile, requireRole } from '../middleware/auth.js';
import * as systemAdminController from '../controllers/systemAdminController.js';

export const adminRouter = Router();

// System Administrator only - the top of the provisioning chain in
// docs/srs/03-governance-and-roles.md. Not a citizen- or officer-facing
// surface; a small internal operations function.
adminRouter.use(requireAuth, attachProfile, requireRole('system_admin'));

adminRouter.post('/provincial-officers', systemAdminController.createProvincialOfficerAccount);
