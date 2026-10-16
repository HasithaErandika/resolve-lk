// Resolve LK - seed script for officer accounts, citizen accounts, and
// sample issues. Run with `node database/seed.mjs` from `backend/`, AFTER:
//   1. migrations 001-008 have been applied, and
//   2. seed.sql has been run (provinces + councils must already exist).
//
// This has to be a Node script rather than plain SQL because officer and
// citizen accounts are real Supabase Auth users (auth.users rows can't be
// hand-inserted correctly via the SQL editor - Supabase Auth owns that
// schema). It uses the same supabaseAdmin (service-role) client pattern as
// the backend itself - see src/lib/supabaseClient.js.
//
// Seeded officer accounts get a shared temporary password so you can log
// in and look around. CHANGE THESE before using this against anything but
// a local/throwaway Supabase project - see the printed warning at the end.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { computeSlaDueDates } from '../src/services/slaService.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy backend/.env.example to backend/.env and fill them in.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OFFICER_TEMP_PASSWORD = 'ChangeMe123!';

async function getCouncilsByName() {
  const { data, error } = await supabaseAdmin
    .from('councils')
    .select('id, name, province_id, provinces(name)');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No councils found - run seed.sql before seed.mjs.');
  }
  return Object.fromEntries(data.map((c) => [c.name, c]));
}

async function getProvincesByName() {
  const { data, error } = await supabaseAdmin.from('provinces').select('id, name');
  if (error) throw error;
  return Object.fromEntries(data.map((p) => [p.name, p]));
}

async function createAuthUser({ email, password, fullName, role, nic, contactEmail, contactPhone, councilId, provinceId }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: password ?? undefined, // undefined => passwordless (citizens)
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      nic: nic ?? null,
      contact_email: contactEmail ?? email,
      contact_phone: contactPhone ?? null,
      role,
      council_id: councilId ?? '',
      province_id: provinceId ?? '',
    },
  });
  if (error) {
    if (error.message?.toLowerCase().includes('already been registered')) {
      console.log(`  (already exists, skipping) ${email}`);
      return null;
    }
    throw error;
  }
  console.log(`  created ${role}: ${email}`);
  return data.user;
}

async function createIssue(supabase, { citizenId, councilId, category, ward, landmark, description, photoUrl, status, priority, jurisdiction, redirectAuthority, department, reason, createdAt, escalated, reopenedCount }) {
  const created = createdAt ?? new Date();
  const sla = computeSlaDueDates(priority, created);

  const { data, error } = await supabase
    .from('civic_issues')
    .insert({
      citizen_id: citizenId,
      council_id: councilId,
      category,
      ward,
      landmark,
      description,
      photo_url: photoUrl ?? null,
      status,
      ai_priority: priority,
      ai_jurisdiction: jurisdiction,
      ai_redirect_authority: redirectAuthority ?? null,
      ai_department: department,
      ai_reason: reason,
      sla_ack_due_at: sla.slaAckDueAt,
      sla_resolve_due_at: sla.slaResolveDueAt,
      escalated: escalated ?? false,
      escalated_at: escalated ? new Date().toISOString() : null,
      reopened_count: reopenedCount ?? 0,
      created_at: created.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;

  await supabase.from('issue_status_history').insert({
    issue_id: data.id,
    from_status: null,
    to_status: 'Submitted',
    changed_by: null,
    note: 'Seed data',
    created_at: created.toISOString(),
  });
  if (status !== 'Submitted') {
    await supabase.from('issue_status_history').insert({
      issue_id: data.id,
      from_status: 'Submitted',
      to_status: status,
      changed_by: null,
      note: 'Seed data - status set directly for demonstration',
      created_at: new Date().toISOString(),
    });
  }

  return data.id;
}

async function main() {
  console.log('Seeding provinces/councils lookup...');
  const provinces = await getProvincesByName();
  const councils = await getCouncilsByName();

  console.log('\nCreating Provincial Officer accounts...');
  for (const provinceName of Object.keys(provinces)) {
    const slug = provinceName.toLowerCase().replace(/\s+province$/, '').replace(/\s+/g, '-');
    await createAuthUser({
      email: `po.${slug}@resolve-lk.gov.lk`,
      password: OFFICER_TEMP_PASSWORD,
      fullName: `Provincial Officer - ${provinceName}`,
      role: 'provincial_officer',
      provinceId: provinces[provinceName].id,
    });
  }

  console.log('\nCreating Municipal Officer accounts...');
  for (const councilName of Object.keys(councils)) {
    const slug = councilName.toLowerCase().replace(/municipal council/i, '').trim().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '');
    await createAuthUser({
      email: `mo.${slug}@resolve-lk.gov.lk`,
      password: OFFICER_TEMP_PASSWORD,
      fullName: `Municipal Officer - ${councilName}`,
      role: 'municipal_officer',
      councilId: councils[councilName].id,
    });
  }

  console.log('\nCreating System Administrator account...');
  await createAuthUser({
    email: 'admin@resolve-lk.gov.lk',
    password: OFFICER_TEMP_PASSWORD,
    fullName: 'System Administrator',
    role: 'system_admin',
  });

  console.log('\nCreating citizen accounts (no password - NIC + OTP only)...');
  const citizens = [
    { nic: '851234567V', fullName: 'Nimal Perera', email: 'nimal.perera@example.com' },
    { nic: '926543210V', fullName: 'Kamala Silva', email: 'kamala.silva@example.com' },
    { nic: '199912345678', fullName: 'Ruwan Fernando', email: 'ruwan.fernando@example.com' },
    { nic: '200256789012', fullName: 'Dilani Wickramasinghe', email: 'dilani.w@example.com' },
  ];
  const citizenUsers = {};
  for (const c of citizens) {
    const user = await createAuthUser({
      email: c.email,
      password: null,
      fullName: c.fullName,
      role: 'citizen',
      nic: c.nic,
      contactEmail: c.email,
    });
    if (user) citizenUsers[c.nic] = user;
  }

  // If any citizens already existed from a prior run, look them up so the
  // issue-seeding step below still has ids to work with.
  const { data: existingCitizens } = await supabaseAdmin
    .from('profiles')
    .select('id, nic')
    .in('nic', citizens.map((c) => c.nic));
  for (const row of existingCitizens ?? []) {
    if (!citizenUsers[row.nic]) citizenUsers[row.nic] = { id: row.id };
  }

  console.log('\nCreating sample issues...');
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const colombo = councils['Colombo Municipal Council'].id;
  const kotte = councils['Sri Jayawardenepura Kotte Municipal Council'].id;
  const dehiwala = councils['Dehiwala-Mount Lavinia Municipal Council'].id;
  const kandy = councils['Kandy Municipal Council'].id;
  const galle = councils['Galle Municipal Council'].id;
  const nic = (n) => citizenUsers[citizens[n].nic].id;

  await createIssue(supabaseAdmin, {
    citizenId: nic(0),
    councilId: colombo,
    category: 'Garbage',
    ward: 'Colombo 06',
    landmark: 'Near Wellawatte market',
    description: 'Large uncollected garbage pile attracting stray dogs and mosquitoes for over a week.',
    status: 'Submitted',
    priority: 'Critical',
    jurisdiction: 'in_council',
    department: 'Public Health',
    reason: 'Standing waste near a market poses a dengue and sanitation risk.',
    createdAt: daysAgo(0.5),
  });

  await createIssue(supabaseAdmin, {
    citizenId: nic(1),
    councilId: colombo,
    category: 'Road',
    ward: 'Colombo 03',
    landmark: 'Opposite the bus stand',
    description: 'Deep pothole causing two-wheeler accidents during evening traffic.',
    status: 'In Progress',
    priority: 'High',
    jurisdiction: 'in_council',
    department: 'Roads & Infrastructure',
    reason: 'Accident risk on a busy road but not an immediate public-health hazard.',
    createdAt: daysAgo(3),
  });

  await createIssue(supabaseAdmin, {
    citizenId: nic(2),
    councilId: kotte,
    category: 'Water',
    ward: 'Nugegoda',
    landmark: 'Main water line near the flyover',
    description: 'Burst pipe flooding the road since yesterday morning.',
    status: 'Submitted',
    priority: 'Medium',
    jurisdiction: 'redirect',
    redirectAuthority: 'NWSDB',
    department: null,
    reason: 'This is a main water supply line, operated by the National Water Supply and Drainage Board, not the Municipal Council.',
    createdAt: daysAgo(1),
  });

  await createIssue(supabaseAdmin, {
    citizenId: nic(3),
    councilId: dehiwala,
    category: 'Drainage',
    ward: 'Dehiwala',
    landmark: 'Near the railway crossing',
    description: 'Blocked drain causing stagnant water to pool along the road, mosquito breeding risk.',
    status: 'Verified',
    priority: 'Critical',
    jurisdiction: 'in_council',
    department: 'Public Health',
    reason: 'Standing water is a dengue-breeding risk requiring immediate clearance.',
    createdAt: daysAgo(10),
  });

  await createIssue(supabaseAdmin, {
    citizenId: nic(0),
    councilId: dehiwala,
    category: 'Lighting',
    ward: 'Dehiwala',
    landmark: 'Access road to the housing scheme',
    description: 'Streetlight repaired once but went dark again after two days - same fault as before.',
    status: 'Reopened',
    priority: 'Low',
    jurisdiction: 'in_council',
    department: 'Electrical Maintenance',
    reason: 'Minor safety concern, not urgent, but this is a repeat failure.',
    createdAt: daysAgo(20),
    reopenedCount: 1,
  });

  await createIssue(supabaseAdmin, {
    citizenId: nic(1),
    councilId: kandy,
    category: 'Public Safety',
    ward: 'Kandy Town',
    landmark: 'Roadside excavation near the clock tower',
    description: 'Unguarded excavation pit left open on a pedestrian route for over a week, no barrier or warning sign.',
    status: 'Acknowledged',
    priority: 'High',
    jurisdiction: 'in_council',
    department: 'Public Safety',
    reason: 'An unguarded excavation on a pedestrian route is an active injury risk.',
    createdAt: daysAgo(9),
    escalated: true,
  });

  await createIssue(supabaseAdmin, {
    citizenId: nic(2),
    councilId: galle,
    category: 'Garbage',
    ward: 'Galle Fort',
    landmark: 'Behind the bus terminal',
    description: 'Overflowing public bin not collected for several days near a food market area.',
    status: 'Submitted',
    priority: 'Medium',
    jurisdiction: 'in_council',
    department: 'Public Health',
    reason: 'Routine sanitation issue, not yet an acute health risk.',
    createdAt: daysAgo(0.2),
  });

  console.log('\nDone.');
  console.log(`\nSeeded officer accounts share the temporary password: ${OFFICER_TEMP_PASSWORD}`);
  console.log('CHANGE THIS before using seed.mjs against anything but a local/throwaway Supabase project.');
  console.log('Citizen accounts have no password - access is via NIC + OTP through /api/my-reports/otp/*.');
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message || error);
  process.exit(1);
});
