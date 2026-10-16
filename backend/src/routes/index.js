import { Router } from 'express';
import { issuesRouter } from './issues.routes.js';
import { myReportsRouter } from './myReports.routes.js';
import { councilsRouter } from './councils.routes.js';
import { provincesRouter } from './provinces.routes.js';
import { provincialRouter } from './provincial.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

apiRouter.use('/issues', issuesRouter);
apiRouter.use('/my-reports', myReportsRouter);
apiRouter.use('/councils', councilsRouter);
apiRouter.use('/provinces', provincesRouter);
apiRouter.use('/provincial', provincialRouter);
apiRouter.use('/admin', adminRouter);
