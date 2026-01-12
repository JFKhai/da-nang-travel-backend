const GooglePlaceService = require("../services/place.service");

exports.autocompletePlace = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        message: "Keyword is required",
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
      message: "Goong Places API error",
    });
  }
};

exports.getPlaceCoordinates = async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({
        message: "placeId is required",
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
      message: "Goong Places API error",
    });
  }
};