import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateNewIssue, validateStatus } from '../validation/issuesValidation.js';
import { uploadIssuePhoto } from '../services/storageService.js';
import { triageIssue } from '../services/triageService.js';
import { findOrCreateCitizenByNic, awardPoints } from '../services/citizenService.js';
import * as issueService from '../services/issueService.js';

const POINTS_PER_REPORT = 10;
const POINTS_BONUS_ON_RESOLVE = 15;

export const createIssue = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = validateNewIssue(body);
  if (Object.keys(errors).length > 0) throw AppError.badRequest(errors);

  const { nic, email, full_name: fullName, category, ward, landmark, description, latitude, longitude } = body;

  const citizen = await findOrCreateCitizenByNic({ nic: nic.trim(), email: email.trim(), fullName });

  const photoUrl = req.file ? await uploadIssuePhoto(req.file) : null;
  const triage = await triageIssue({ category, description });

  const issue = await issueService.createIssue({
    citizenId: citizen.id,
    category,
    ward,
    landmark,
    description,
    photoUrl,
    latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : null,
    longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : null,
    triage,
  });

  const contributorPoints = await awardPoints(citizen.id, POINTS_PER_REPORT);

  res.status(201).json({ ...issue, contributor_points: contributorPoints });
});

export const listPublicIssues = asyncHandler(async (req, res) => {
  const result = await issueService.listPublicIssues(req.query);
  res.json(result);
});

export const listIssues = asyncHandler(async (req, res) => {
  const result = await issueService.listIssuesForViewer(req.profile, req.query);
  res.json(req.profile.role === 'admin' ? result : { ...result, points: req.profile.points });
});

export const getIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueForViewer(req.profile, req.params.id);
  res.json(issue);
});

export const updateIssueStatus = asyncHandler(async (req, res) => {
  const status = req.body?.status;
  const statusError = validateStatus(status);
  if (statusError) throw AppError.badRequest({ status: statusError });

  const issue = await issueService.updateIssueStatus(req.params.id, status);

  if (status === 'Resolved') {
    await awardPoints(issue.citizen_id, POINTS_BONUS_ON_RESOLVE);
  }

  res.json(issue);
});
