const { success } = require('../utils/response.util');
const placeService = require('../services/place.service');

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
