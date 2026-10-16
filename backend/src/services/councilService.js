import crypto from 'node:crypto';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { haversineDistanceKm } from '../lib/geo.js';

function generateTempPassword() {
  // Shown once to the provisioning officer to relay out of band - never
  // emailed in plaintext. See docs/srs/07-api-specification.md
  // #post-apiprovincialmunicipal-officers.
  return crypto.randomBytes(9).toString('base64url') + 'A1!';
}

export async function listProvinces() {
  const { data, error } = await supabaseAdmin.from('provinces').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export async function listCouncils() {
  const { data, error } = await supabaseAdmin
    .from('councils')
    .select('id, name, district, province_id, operates_own_water_scheme, provinces(name)')
    .order('name');
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    district: c.district,
    provinceId: c.province_id,
    provinceName: c.provinces?.name ?? null,
    operatesOwnWaterScheme: c.operates_own_water_scheme,
  }));
}

export async function getCouncilById(councilId) {
  const { data, error } = await supabaseAdmin
    .from('councils')
    .select('id, name, province_id, operates_own_water_scheme')
    .eq('id', councilId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw AppError.badRequest({ council_id: 'Unknown council.' });
  return data;
}

// Nearest-council suggestion by straight-line (Haversine) distance to each
// council's single reference coordinate - a suggestion, never an override.
// See docs/srs/03-governance-and-roles.md#location-based-council-suggestion-haversine.
export async function findNearestCouncil(latitude, longitude) {
  const { data, error } = await supabaseAdmin
    .from('councils')
    .select('id, name, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  if (error) throw error;
  if (!data || data.length === 0) return null;

  let nearest = null;
  for (const council of data) {
    const distanceKm = haversineDistanceKm(latitude, longitude, council.latitude, council.longitude);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { id: council.id, name: council.name, distanceKm };
    }
  }
  return nearest;
}

export async function getCouncilIdsForProvince(provinceId) {
  const { data, error } = await supabaseAdmin.from('councils').select('id').eq('province_id', provinceId);
  if (error) throw error;
  return (data ?? []).map((c) => c.id);
}

// The public SLA-transparency stats that replace the citizen points system - // see docs/srs/03-governance-and-roles.md#public-transparency-replaces-citizen-contribution-points.
export async function getCouncilStats({ councilId, category } = {}) {
  let query = supabaseAdmin.from('council_sla_stats').select('*');
  if (councilId) query = query.eq('council_id', councilId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    councilId: row.council_id,
    category: row.category,
    resolvedCount: row.resolved_count,
    resolvedWithinSlaPct:
      row.resolved_count > 0 ? Math.round((row.resolved_within_sla / row.resolved_count) * 100) : null,
    avgResolutionHours: row.avg_resolution_seconds != null ? Math.round(row.avg_resolution_seconds / 3600) : null,
    openCount: row.open_count,
  }));
}

// Provisioning chain from docs/srs/03-governance-and-roles.md#roles-in-resolve-lk - // no role above Citizen ever self-registers.

export async function createMunicipalOfficer(callerProfile, { councilId, email, fullName }) {
  const council = await getCouncilById(councilId);
  if (council.province_id !== callerProfile.province_id) {
    throw AppError.forbidden('You may only provision Municipal Officers for councils in your own province.');
  }

  const tempPassword = generateTempPassword();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || null,
      contact_email: email,
      role: 'municipal_officer',
      council_id: councilId,
    },
  });
  if (error) throw error;

  return { id: data.user.id, email, tempPassword };
}

export async function createProvincialOfficer({ provinceId, email, fullName }) {
  const { data: province, error: provinceError } = await supabaseAdmin
    .from('provinces')
    .select('id')
    .eq('id', provinceId)
    .maybeSingle();
  if (provinceError) throw provinceError;
  if (!province) throw AppError.badRequest({ province_id: 'Unknown province.' });

  const tempPassword = generateTempPassword();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || null,
      contact_email: email,
      role: 'provincial_officer',
      province_id: provinceId,
    },
  });
  if (error) throw error;

  return { id: data.user.id, email, tempPassword };
}
