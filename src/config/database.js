const { Sequelize } = require('sequelize');

const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_HOST', 'DB_DIALECT'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,

    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
  }
);

module.exports = sequelize;
