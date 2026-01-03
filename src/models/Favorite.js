const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define(
  'favorites',
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    place_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'places',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    tableName: 'favorites',
  }
);

module.exports = Favorite;
