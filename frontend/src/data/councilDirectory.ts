// The full real reference list of Sri Lanka's Municipal Councils - for the
// public Council Directory page (transparency: "who is responsible for my
// area, and who oversees them"). This is static reference data, separate
// from the live/operational council list the report form's picker uses
// (GET /api/councils, a working seeded subset - see types/council.ts).
//
// DATA ACCURACY NOTE: compiled from public sources (Wikipedia's "Municipal
// councils of Sri Lanka", the Ministry of Provincial Councils and Local
// Government) as of this build. Sources disagree between 27-29 depending on
// the exact cutoff date around the 2025 local government elections (five
// Urban Councils - Puttalam, Trincomalee, Vavuniya, Kegalle, Kalutara - were
// upgraded to Municipal Council status following that election). Treat this
// as a good-faith reference, not an authoritative legal record - verify
// against the Department of Local Government's official gazette before
// relying on it for anything official. See docs/srs/03-governance-and-roles.md.
export interface DirectoryCouncil {
  name: string
  district: string
  province: string
  newSince2025: boolean
  // Verified only where a real, current source was checked (see the phone
  // field below) - never fabricated. The head-of-administration title is
  // "Municipal Commissioner" for every Municipal Council under the
  // Municipal Councils Ordinance (1947); the current officeholder's name is
  // deliberately not listed here, since that changes with appointments and
  // an unverified name is worse than none. Contact the council directly, or
  // see docs/srs/03-governance-and-roles.md#who-actually-runs-a-municipal-council.
  contactPhone?: string
}

export const HEAD_OF_ADMINISTRATION_TITLE = 'Municipal Commissioner'

export const COUNCIL_DIRECTORY: DirectoryCouncil[] = [
  { name: 'Colombo Municipal Council', district: 'Colombo', province: 'Western Province', newSince2025: false, contactPhone: '011 269 1191' },
  { name: 'Dehiwala-Mount Lavinia Municipal Council', district: 'Colombo', province: 'Western Province', newSince2025: false },
  { name: 'Sri Jayawardenepura Kotte Municipal Council', district: 'Colombo', province: 'Western Province', newSince2025: false },
  { name: 'Kaduwela Municipal Council', district: 'Colombo', province: 'Western Province', newSince2025: false },
  { name: 'Moratuwa Municipal Council', district: 'Colombo', province: 'Western Province', newSince2025: false },
  { name: 'Negombo Municipal Council', district: 'Gampaha', province: 'Western Province', newSince2025: false },
  { name: 'Gampaha Municipal Council', district: 'Gampaha', province: 'Western Province', newSince2025: false },
  { name: 'Kalutara Municipal Council', district: 'Kalutara', province: 'Western Province', newSince2025: true },
  { name: 'Kurunegala Municipal Council', district: 'Kurunegala', province: 'North Western Province', newSince2025: false },
  { name: 'Puttalam Municipal Council', district: 'Puttalam', province: 'North Western Province', newSince2025: true },
  { name: 'Kandy Municipal Council', district: 'Kandy', province: 'Central Province', newSince2025: false },
  { name: 'Matale Municipal Council', district: 'Matale', province: 'Central Province', newSince2025: false },
  { name: 'Dambulla Municipal Council', district: 'Matale', province: 'Central Province', newSince2025: false },
  { name: 'Nuwara Eliya Municipal Council', district: 'Nuwara Eliya', province: 'Central Province', newSince2025: false },
  { name: 'Badulla Municipal Council', district: 'Badulla', province: 'Uva Province', newSince2025: false },
  { name: 'Bandarawela Municipal Council', district: 'Badulla', province: 'Uva Province', newSince2025: false },
  { name: 'Galle Municipal Council', district: 'Galle', province: 'Southern Province', newSince2025: false },
  { name: 'Matara Municipal Council', district: 'Matara', province: 'Southern Province', newSince2025: false },
  { name: 'Hambantota Municipal Council', district: 'Hambantota', province: 'Southern Province', newSince2025: false },
  { name: 'Ratnapura Municipal Council', district: 'Ratnapura', province: 'Sabaragamuwa Province', newSince2025: false },
  { name: 'Kegalle Municipal Council', district: 'Kegalle', province: 'Sabaragamuwa Province', newSince2025: true },
  { name: 'Anuradhapura Municipal Council', district: 'Anuradhapura', province: 'North Central Province', newSince2025: false },
  { name: 'Polonnaruwa Municipal Council', district: 'Polonnaruwa', province: 'North Central Province', newSince2025: false },
  { name: 'Jaffna Municipal Council', district: 'Jaffna', province: 'Northern Province', newSince2025: false },
  { name: 'Vavuniya Municipal Council', district: 'Vavuniya', province: 'Northern Province', newSince2025: true },
  { name: 'Batticaloa Municipal Council', district: 'Batticaloa', province: 'Eastern Province', newSince2025: false },
  { name: 'Kalmunai Municipal Council', district: 'Ampara', province: 'Eastern Province', newSince2025: false },
  { name: 'Akkaraipattu Municipal Council', district: 'Ampara', province: 'Eastern Province', newSince2025: false },
  { name: 'Trincomalee Municipal Council', district: 'Trincomalee', province: 'Eastern Province', newSince2025: true },
]

export const PROVINCE_ORDER = [
  'Western Province',
  'Central Province',
  'Southern Province',
  'Northern Province',
  'Eastern Province',
  'North Western Province',
  'North Central Province',
  'Uva Province',
  'Sabaragamuwa Province',
]

// Names that match the live pilot seeded in the backend (types/council.ts's
// operational GET /api/councils list) - shown as "Live in this pilot" on
// the directory page. Matched by name against whatever the backend actually
// returns, not hardcoded to a fixed list, so it stays correct as the seed
// data changes.
