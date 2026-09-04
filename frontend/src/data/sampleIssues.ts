import type { CivicIssue } from '../types/issue'

// Placeholder data matching backend/database/seed.sql — swap for a live call
// to GET /api/issues/public once the backend is connected.
export const sampleIssues: CivicIssue[] = [
  {
    id: '1',
    category: 'Garbage',
    ward: 'Colombo 06',
    landmark: 'Near Wellawatte market',
    description:
      'Large uncollected garbage pile attracting stray dogs and mosquitoes for over a week.',
    photoUrl: null,
    status: 'Pending',
    aiPriority: 'Critical',
    aiDepartment: 'Public Health',
    aiReason: 'Standing waste near a market poses a dengue and sanitation risk.',
    createdAt: '2026-09-01T08:30:00Z',
  },
  {
    id: '2',
    category: 'Road',
    ward: 'Nugegoda',
    landmark: 'Opposite the bus stand',
    description: 'Deep pothole causing two-wheeler accidents during evening traffic.',
    photoUrl: null,
    status: 'In Progress',
    aiPriority: 'Medium',
    aiDepartment: 'Roads & Infrastructure',
    aiReason: 'Accident risk but not an immediate public health hazard.',
    createdAt: '2026-08-29T14:10:00Z',
  },
  {
    id: '3',
    category: 'Lighting',
    ward: 'Maharagama',
    landmark: 'Access road to the housing scheme',
    description: 'Streetlight has been off for three weeks, area is unsafe at night.',
    photoUrl: null,
    status: 'Pending',
    aiPriority: 'Medium',
    aiDepartment: 'Electrical Maintenance',
    aiReason: 'Safety concern, not urgent health risk.',
    createdAt: '2026-08-27T19:45:00Z',
  },
  {
    id: '4',
    category: 'Water',
    ward: 'Dehiwala',
    landmark: 'Near the railway crossing',
    description: 'Burst pipe flooding the road since yesterday morning.',
    photoUrl: null,
    status: 'Resolved',
    aiPriority: 'Critical',
    aiDepartment: 'Water Supply',
    aiReason: 'Active water loss and road hazard required immediate response.',
    createdAt: '2026-08-20T09:15:00Z',
  },
]
