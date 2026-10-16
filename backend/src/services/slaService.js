// Fixed priority -> target-hours table, from docs/srs/03-governance-and-roles.md#sla-targets-and-escalation.
// Due-dates are computed once, at submission time, and never recomputed - // see the same doc for why (a priority correction shouldn't move a deadline
// that's already been communicated).
const SLA_TARGET_HOURS = {
  Critical: { ackHours: 24, resolveHours: 24 * 3 },
  High: { ackHours: 48, resolveHours: 24 * 7 },
  Medium: { ackHours: 24 * 3, resolveHours: 24 * 14 },
  Low: { ackHours: 24 * 5, resolveHours: 24 * 30 },
};

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function computeSlaDueDates(priority, submittedAt = new Date()) {
  const target = SLA_TARGET_HOURS[priority] ?? SLA_TARGET_HOURS.Medium;
  const base = submittedAt instanceof Date ? submittedAt : new Date(submittedAt);

  return {
    slaAckDueAt: addHours(base, target.ackHours).toISOString(),
    slaResolveDueAt: addHours(base, target.resolveHours).toISOString(),
  };
}

export { SLA_TARGET_HOURS };
