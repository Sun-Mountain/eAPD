const truncate = require('../shared/delete-everything');
const states = require('../shared/states');

const files = require('./files');
const roles = require('../shared/roles-and-activities');
const adminRole = require('./roles');
const testStates = require('./states');
const affiliations = require('./affiliations');
const certifications = require('./certifications');
const apds = require('../shared/apds');

exports.seed = async knex => {
  // Don't seed this data if we're not in a test environment.
  if (process.env.NODE_ENV !== 'test') {
    return;
  }

  // Call specific seeds from here.
  await truncate.seed(knex);
  await states.seed(knex);
  await files.seed(knex);
  await roles.seed(knex);
  await adminRole.seed(knex);
  await testStates.seed(knex);
  await affiliations.seed(knex);
  await certifications.seed(knex);

  // seed APDs in mongo
  await apds.seed();
};
