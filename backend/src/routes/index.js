import { Router } from 'express';
import { issuesRouter } from './issues.routes.js';
import { myReportsRouter } from './myReports.routes.js';

export const apiRouter = Router();

apiRouter.use('/issues', issuesRouter);
apiRouter.use('/my-reports', myReportsRouter);
