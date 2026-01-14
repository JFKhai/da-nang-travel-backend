const express = require("express");
const router = express.Router();
const placeController = require("../controllers/place.controller");

router.get("/autocomplete", placeController.autocompletePlace);
router.get("/coordinates", placeController.getPlaceCoordinates);

module.exports = router;
