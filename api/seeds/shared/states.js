const chalk = require('chalk'); // eslint-disable-line import/no-unresolved
const logger = require('../../logger')('state seeder');
const { states } = require('../../util/states');

exports.seed = async knex => {
  logger.verbose(`Beginning to seed the ${chalk.cyan('states')} table`);
  const total = await knex('states').count('id').first();
  logger.verbose(`${chalk.cyan('states')} table currently has ${total.count}`);
  if (total.count.toString() === '0') {
    await knex('states').insert(states);
    logger.verbose(`Completed seeding the ${chalk.cyan('states')} table`);
  } else {
    logger.verbose(`Skipping seeding the ${chalk.cyan('states')} table`);
  }
};
