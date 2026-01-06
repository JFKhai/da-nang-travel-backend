const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlaceCategory = sequelize.define(
  'place_categories',
  {
    place_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'places',
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
  },
  {
    timestamps: false,
    tableName: 'place_categories',
  }
);

module.exports = PlaceCategory;
