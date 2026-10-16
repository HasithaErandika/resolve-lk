import { Router } from 'express';
import { requireAuth, attachProfile, requireRole } from '../middleware/auth.js';
import * as provincialController from '../controllers/provincialController.js';

export const provincialRouter = Router();

provincialRouter.use(requireAuth, attachProfile, requireRole('provincial_officer'));

provincialRouter.get('/escalations', provincialController.getEscalations);
provincialRouter.post('/municipal-officers', provincialController.createMunicipalOfficerAccount);
