const { success } = require('../utils/response.util');
const placeService = require('../services/place.service');
const GooglePlaceService = require('../services/place.service');

exports.getPlaces = async (req, res, next) => {
  try {
    const result = await placeService.getPlaces(req.query);

    res.status(200).send(success(result, 'Lấy danh sách địa điểm thành công'));
  } catch (err) {
    next(err);
  }
};

exports.getPlaceById = async (req, res, next) => {
  try {
    const placeId = req.params.id;

    const place = await placeService.getPlaceById(placeId);

    res.status(200).send(success(place, 'Lấy chi tiết địa điểm thành công'));
  } catch (err) {
    next(err);
  }
};

exports.createPlace = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const place = await placeService.createPlace({
      userId,
      body: req.body,
      files: req.files,
    });

    res.status(201).send(success(place, 'Tạo địa điểm thành công'));
  } catch (err) {
    next(err);
  }
};

exports.updatePlace = async (req, res, next) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const placeId = req.params.id;

    const place = await placeService.updatePlace({
      placeId,
      userId,
      userRole,
      body: req.body,
      files: req.files,
    });

    res.status(200).send(success(place, 'Cập nhật địa điểm thành công'));
  } catch (err) {
    next(err);
  }
};

exports.softDeletePlace = async (req, res, next) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const placeId = req.params.id;

    const result = await placeService.softDeletePlace({
      placeId,
      userId,
      userRole,
    });

    res.status(200).send(success(result, 'Xóa địa điểm thành công'));
  } catch (err) {
    next(err);
  }
};

exports.autocompletePlace = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        message: 'Keyword is required',
      });
    }

    const data = await GooglePlaceService.autocomplete(keyword);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Goong Places API error',
    });
  }
};

exports.getPlaceCoordinates = async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({
        message: 'placeId is required',
      });
    }
    const data = await GooglePlaceService.getPlaceCoordinates(placeId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Goong Places API error',
    });
  }
};

exports.getRelatedPlaces = async (req, res, next) => {
  try {
    const { categoryIds, excludePlaceId, limit } = req.query;

    // Parse categoryIds from comma-separated string or array
    let parsedCategoryIds = categoryIds;
    if (typeof categoryIds === 'string') {
      parsedCategoryIds = categoryIds.split(',').filter((id) => id.trim() !== '');
    }

    const places = await placeService.getRelatedPlaces({
      categoryIds: parsedCategoryIds,
      excludePlaceId,
    });

    res.status(200).send(success(places, 'Lấy danh sách địa điểm liên quan thành công'));
  } catch (err) {
    next(err);
  }
};
