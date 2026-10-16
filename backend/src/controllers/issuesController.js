import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateNewIssue, validateStatus } from '../validation/issuesValidation.js';
import { uploadIssuePhoto } from '../services/storageService.js';
import { triageIssue } from '../services/triageService.js';
import { findOrCreateCitizenByNic } from '../services/citizenService.js';
import { computeSlaDueDates } from '../services/slaService.js';
import { getCouncilById, findNearestCouncil } from '../services/councilService.js';
import * as issueService from '../services/issueService.js';

export const createIssue = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = validateNewIssue(body);
  if (Object.keys(errors).length > 0) throw AppError.badRequest(errors);

  const {
    nic,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    full_name: fullName,
    category,
    council_id: councilId,
    ward,
    landmark,
    description,
    latitude,
    longitude,
  } = body;

  const council = await getCouncilById(councilId);

  const [citizen, photoUrl, triage] = await Promise.all([
    findOrCreateCitizenByNic({ nic: nic.trim(), contactEmail: contactEmail.trim(), contactPhone, fullName }),
    uploadIssuePhoto(req.file),
    triageIssue({ category, description, landmark, operatesOwnWaterScheme: council.operates_own_water_scheme }),
  ]);

  const sla = computeSlaDueDates(triage.priority);
  const lat = latitude !== undefined && latitude !== '' ? Number(latitude) : null;
  const lon = longitude !== undefined && longitude !== '' ? Number(longitude) : null;

  const [issue, suggestedCouncil] = await Promise.all([
    issueService.createIssue({
      citizenId: citizen.id,
      councilId,
      category,
      ward,
      landmark,
      description,
      photoUrl,
      latitude: lat,
      longitude: lon,
      triage,
      sla,
    }),
    lat !== null && lon !== null ? findNearestCouncil(lat, lon) : Promise.resolve(null),
  ]);

  const suggestion = suggestedCouncil && suggestedCouncil.id !== councilId ? suggestedCouncil : null;

  res.status(201).json({ ...issue, suggested_council: suggestion });
});

export const listPublicIssues = asyncHandler(async (req, res) => {
  const result = await issueService.listPublicIssues(req.query);
  res.json(result);
});

export const listIssues = asyncHandler(async (req, res) => {
  const result = await issueService.listIssuesForViewer(req.profile, req.query);
  res.json(result);
});

export const getIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueForViewer(req.profile, req.params.id);
  res.json(issue);
});

export const updateIssueStatus = asyncHandler(async (req, res) => {
  const status = req.body?.status;
  const statusError = validateStatus(status);
  if (statusError) throw AppError.badRequest({ status: statusError });

  const issue = await issueService.updateIssueStatus(req.profile, req.params.id, status, req.body?.note);
  res.json(issue);
});
