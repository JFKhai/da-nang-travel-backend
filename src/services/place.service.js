const { th } = require("@faker-js/faker");
const axios = require("axios");

const GOONG_API_KEY = process.env.GOONG_API_KEY;

if (!GOONG_API_KEY)  throw new Error("Missing GOONG_API_KEY in environment variables");

const GOONG_API_URL = "https://rsapi.goong.io";

async function autocomplete(keyword) {
  if (!keyword) return [];
  if (!GOONG_API_KEY) {
    throw new Error("Missing GOONG_API_KEY in environment variables");
  }

  try {
    const response = await axios.get(GOONG_API_URL + '/Place/AutoComplete', {
      params: {
        input: keyword,
        api_key: GOONG_API_KEY,
        radius: 5000,
      },
      timeout: 10000,
    });

    console.log("Goong Autocomplete Response:", response.data);

    const predictions = response?.data?.predictions || [];

    return predictions.map((item) => ({
      placeId: item.place_id ?? item.reference,
      description: item.description,
      mainText: item.structured_formatting?.main_text,
      secondaryText: item.structured_formatting?.secondary_text,
    }));
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    throw new Error(
      `Goong autocomplete failed${status ? ` (HTTP ${status})` : ""}: ${
        data ? JSON.stringify(data) : err.message
      }`
    );
  }
}

async function getPlaceCoordinates(placeId) {
  if (!placeId) throw new Error("Missing placeId");
  if (!GOONG_API_KEY) {
    throw new Error("Missing GOONG_API_KEY in environment variables");
  }

  try {
    const response = await axios.get(GOONG_API_URL + '/Place/Detail', {
      params: {
        place_id: placeId,
        api_key: GOONG_API_KEY,
      },
      timeout: 10000,
    });

    const location = response?.data?.result?.geometry?.location;
    if (!location || location.lat == null || location.lng == null) {
      throw new Error(`No coordinates found for placeId: ${placeId}`);
    }

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: response?.data?.result?.formatted_address,
    };
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    throw new Error(
      `Goong place detail failed${status ? ` (HTTP ${status})` : ""}: ${
        data ? JSON.stringify(data) : err.message
      }`
    );
  }
}

module.exports = { autocomplete, getPlaceCoordinates };