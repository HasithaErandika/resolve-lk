// Standalone entrypoint for the SLA-breach + auto-verify sweep - run it via
// `npm run sla:sweep`. Not wired into a live scheduler in this environment;
// a real deployment should run this hourly (e.g. a Choreo scheduled task or
// a plain cron hitting `node src/jobs/slaBreachJob.js`).
// See services/escalationService.js#runScheduledSweep and
// docs/srs/03-governance-and-roles.md#sla-targets-and-escalation.

import 'dotenv/config';
import { runScheduledSweep } from '../services/escalationService.js';

runScheduledSweep()
  .then(({ escalatedCount, autoVerifiedCount }) => {
    console.log(`SLA sweep complete: ${escalatedCount} issue(s) escalated, ${autoVerifiedCount} issue(s) auto-verified.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('SLA sweep failed:', error.message || error);
    process.exit(1);
  });
