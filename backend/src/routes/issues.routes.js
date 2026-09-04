import { Router } from 'express';
import { uploadPhoto } from '../middleware/upload.js';
import { requireAuth, attachProfile, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../utils/AppError.js';
import * as issuesController from '../controllers/issuesController.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const issuesRouter = Router();

issuesRouter.param('id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) throw AppError.badRequest({ id: 'Invalid issue id.' });
  next();
});

issuesRouter.post('/', uploadPhoto, issuesController.createIssue);
issuesRouter.get('/public', issuesController.listPublicIssues);
issuesRouter.get('/', requireAuth, attachProfile, issuesController.listIssues);
issuesRouter.get('/:id', requireAuth, attachProfile, issuesController.getIssue);
issuesRouter.patch('/:id/status', requireAuth, attachProfile, requireAdmin, issuesController.updateIssueStatus);
