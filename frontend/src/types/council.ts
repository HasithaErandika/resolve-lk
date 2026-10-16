// Shape returned by GET /api/councils and /api/provinces - the live,
// operational list (a working subset seeded in the backend), as opposed to
// data/councilDirectory.ts (the full real reference list of all Sri Lankan
// Municipal Councils, used only by the informational directory page).
export interface Council {
  id: string
  name: string
  district: string
  provinceId: string
  provinceName: string | null
  operatesOwnWaterScheme: boolean
}

export interface Province {
  id: string
  name: string
}

export interface CouncilStats {
  councilId: string
  category: string
  resolvedCount: number
  resolvedWithinSlaPct: number | null
  avgResolutionHours: number | null
  openCount: number
}

export interface NearestCouncilSuggestion {
  id: string
  name: string
  distanceKm: number
}
