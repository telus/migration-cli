const Bluebird = require('bluebird');
const contentTypePayloads = require('../../../../../lib/migration-payloads/content-type');
const migrationChunks = require('../../../../../lib/migration-chunks');
const migrationSteps = require('../../../../../lib/migration-steps');
const validatePayloads = require('../../../../../lib/migration-payloads/validation');
const migrationPlan = require('../../../../../lib/migration-plan');

module.exports = Bluebird.coroutine(function * (migration, existingCts) {
  const steps = yield migrationSteps(migration);
  const chunks = migrationChunks(steps);
  const plan = migrationPlan(chunks);
  const payloads = contentTypePayloads(plan, existingCts);
  const errors = validatePayloads(payloads);
  return errors;
});
