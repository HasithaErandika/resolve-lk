import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as councilService from '../services/councilService.js';

export const listCouncils = asyncHandler(async (req, res) => {
  res.json({ councils: await councilService.listCouncils() });
});

export const listProvinces = asyncHandler(async (req, res) => {
  res.json({ provinces: await councilService.listProvinces() });
});

export const getStats = asyncHandler(async (req, res) => {
  const { council_id: councilId, category } = req.query;
  const stats = await councilService.getCouncilStats({ councilId, category });
  res.json({ stats });
});

export const getNearestCouncil = asyncHandler(async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw AppError.badRequest({ latitude: 'latitude and longitude query params are required.' });
  }

  const nearest = await councilService.findNearestCouncil(latitude, longitude);
  res.json({ nearest });
});
