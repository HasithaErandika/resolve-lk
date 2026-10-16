import { Router } from 'express';
import * as myReportsController from '../controllers/myReportsController.js';

export const myReportsRouter = Router();

myReportsRouter.post('/otp/request', myReportsController.requestOtpCode);
myReportsRouter.post('/otp/verify', myReportsController.verifyOtpCode);
