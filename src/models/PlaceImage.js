const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlaceImage = sequelize.define(
  'place_images',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    place_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'places',
        key: 'id',
      },
    },
    review_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'place_reviews',
        key: 'id',
      },
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    public_id: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    caption: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    tableName: 'place_images',
  }
);

module.exports = PlaceImage;
