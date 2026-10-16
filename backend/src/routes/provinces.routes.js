import { Router } from 'express';
import * as councilsController from '../controllers/councilsController.js';

export const provincesRouter = Router();

provincesRouter.get('/', councilsController.listProvinces); // public
