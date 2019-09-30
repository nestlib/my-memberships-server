const path = require('path');
const dotenv = require('dotenv');
/* This is config file for TypeOrm */
// const { getMetadataArgsStorage } = require('typeorm');

const nodeEnv = process.env.NODE_ENV || '';
const envs = dotenv.config({ path: `${nodeEnv}.env` }).parsed;

// const envs = process.env;

const config = {
  type: envs.DB_TYPE,
  host: envs.DB_HOST,
  database: envs.DB_DATABASE,
  username: envs.DB_USER,
  password: envs.DB_PASSWORD,
  port: envs.DB_PORT,
  logging: 'error',
  synchronize: false,
  maxQueryExecutionTime: 3000,
  cache: {
    type: 'redis',
    options: {
      port: envs.REDIS_PORT,
      host: envs.REDIS_HOST,
    },
    duration: 30000,
  },
};

/* Production and development specific settings */
if (process.env.NODE_ENV === 'production') {
  config.entities = ['dist/**/*.entity.js'];
} else {
  // config.synchronize = true;
  config.logging = 'all';
  config.migrations = ['db/migrations/*{.ts,.js}'];
  // This is for migration
  config.entities = ['src/**/!(log).entity{.ts,.js}'];
  // This is for webpack
  // config.entities = getMetadataArgsStorage().tables.map(tbl => tbl.target);
  // config.migrationsRun = true;
}

module.exports = config;
