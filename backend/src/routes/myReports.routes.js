import { Router } from 'express';
import * as myReportsController from '../controllers/myReportsController.js';

export const myReportsRouter = Router();

myReportsRouter.post('/login', myReportsController.login);
