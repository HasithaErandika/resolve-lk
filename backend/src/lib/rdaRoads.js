// Small reference list of major Class A/B national highways and Class E
// expressways maintained by the Road Development Authority (RDA) - used as
// a hint for jurisdiction triage on "Road" reports, not a source of truth.
// See docs/srs/03-governance-and-roles.md#road-authority-reference-list for
// why this is a heuristic and what it doesn't cover (no C/D provincial-road
// list exists in an equivalent accessible form).
// Source: RDA - National Highways (Class A, B & E Roads) gazetted list,
// https://rda.gov.lk/index.php?Itemid=123&id=24&lang=en&option=com_content&view=article

const NATIONAL_HIGHWAYS = [
  { code: 'A1', names: ['a1', 'colombo-kandy road', 'kandy road'] },
  { code: 'A2', names: ['a2', 'galle road', 'colombo-matara road'] },
  { code: 'A3', names: ['a3', 'negombo road', 'colombo-puttalam road'] },
  { code: 'A4', names: ['a4', 'high level road', 'ratnapura road'] },
  { code: 'A9', names: ['a9', 'kandy-jaffna road'] },
  { code: 'E01', names: ['e01', 'southern expressway'] },
  { code: 'E02', names: ['e02', 'central expressway'] },
  { code: 'E03', names: ['e03', 'katunayake expressway', 'colombo-katunayake expressway'] },
  { code: 'E04', names: ['e04', 'outer circular highway', 'colombo outer circular'] },
  { code: 'E16', names: ['e16', 'ruwanpura expressway'] },
];

// Case-insensitive match against a report's free-text description/landmark.
// Returns the matched highway's code (e.g. "A9") or null.
export function matchNationalHighway(text) {
  if (!text) return null;
  const haystack = text.toLowerCase();
  const hit = NATIONAL_HIGHWAYS.find((road) => road.names.some((name) => haystack.includes(name)));
  return hit?.code ?? null;
}
