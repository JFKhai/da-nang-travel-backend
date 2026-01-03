const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Category = require('./Category');
const Place = require('./Place');
const PlaceImage = require('./PlaceImage');
const PlaceReview = require('./PlaceReview');
const PlaceCategory = require('./PlaceCategory');
const Favorite = require('./Favorite');

// Define associations
// 1. USER ASSOCIATIONS
User.hasMany(Place, {
  foreignKey: 'user_id',
  as: 'places',
  onDelete: 'RESTRICT',
});

User.hasMany(PlaceReview, {
  foreignKey: 'user_id',
  as: 'reviews',
  onDelete: 'CASCADE',
});

User.belongsToMany(Place, {
  through: Favorite,
  foreignKey: 'user_id',
  otherKey: 'place_id',
  as: 'favoritePlaces',
});

// 2. CATEGORY ASSOCIATIONS
Category.belongsToMany(Place, {
  through: PlaceCategory,
  foreignKey: 'category_id',
  otherKey: 'place_id',
  as: 'places',
});

// 3. PLACE ASSOCIATIONS
Place.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'creator',
});

Place.belongsToMany(Category, {
  through: PlaceCategory,
  foreignKey: 'place_id',
  otherKey: 'category_id',
  as: 'categories',
});

Place.hasMany(PlaceImage, {
  foreignKey: 'place_id',
  as: 'images',
  onDelete: 'CASCADE',
});

Place.hasMany(PlaceReview, {
  foreignKey: 'place_id',
  as: 'reviews',
  onDelete: 'CASCADE',
});

Place.belongsToMany(User, {
  through: Favorite,
  foreignKey: 'place_id',
  otherKey: 'user_id',
  as: 'favoritedBy',
});

Place.belongsTo(PlaceImage, {
  foreignKey: 'cover_image_id',
  as: 'coverImage',
  constraints: false,
});

// 4. PLACE IMAGE ASSOCIATIONS
PlaceImage.belongsTo(Place, {
  foreignKey: 'place_id',
  as: 'place',
  onDelete: 'CASCADE',
});

PlaceImage.belongsTo(PlaceReview, {
  foreignKey: 'review_id',
  as: 'review',
  onDelete: 'CASCADE',
  constraints: true,
});

// 5. PLACE REVIEW ASSOCIATIONS
PlaceReview.belongsTo(Place, {
  foreignKey: 'place_id',
  as: 'place',
  onDelete: 'CASCADE',
});

PlaceReview.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'author',
  onDelete: 'CASCADE',
});

PlaceReview.hasMany(PlaceImage, {
  foreignKey: 'review_id',
  as: 'images',
  onDelete: 'CASCADE',
});

// 6. FAVORITE ASSOCIATIONS (Junction table)
Favorite.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});

Favorite.belongsTo(Place, {
  foreignKey: 'place_id',
  as: 'place',
  onDelete: 'CASCADE',
});

// 7. PLACE CATEGORY ASSOCIATIONS (Junction table)
PlaceCategory.belongsTo(Place, {
  foreignKey: 'place_id',
  as: 'place',
  onDelete: 'CASCADE',
});

PlaceCategory.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
  onDelete: 'CASCADE',
});

module.exports = {
  sequelize,
  User,
  Category,
  Place,
  PlaceImage,
  PlaceReview,
  PlaceCategory,
  Favorite,
};
