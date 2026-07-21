const { Sequelize } = require('sequelize');
const { databaseUrl } = require('./security');
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

module.exports = sequelize;
