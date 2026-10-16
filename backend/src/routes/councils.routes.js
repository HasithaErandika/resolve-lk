import { Router } from 'express';
import * as councilsController from '../controllers/councilsController.js';

export const councilsRouter = Router();

// All public - the report form's council picker, the public SLA-
// transparency stats, and the nearest-council suggestion need no session.
councilsRouter.get('/', councilsController.listCouncils);
councilsRouter.get('/stats', councilsController.getStats);
councilsRouter.get('/nearest', councilsController.getNearestCouncil);
