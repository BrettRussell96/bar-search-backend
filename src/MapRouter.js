const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();


// Route to get map data based on location details
router.get("/", async (request, response) => {
    const { location } = request.query;
    const apiKey = process.env.API_KEY;

    try {
        // use Google Geocoding API to get location coordinates
        const geoResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`
        );
        const geoData = geoResponse.data;

        // Return not found response if no location data 
        if (!geoData.results || geoData.results.length === 0) {
            return response.status(404).json({
                message: "Location not found."
            });
        };
        // assign coordinate values to variables
        const { lat, lng } = geoData.results[0].geometry.location;

        // Return coordinate and address data as the response
        response.status(200).json({
            lat,
            lng,
            address: geoData.results[0].formatted_address
        });
    } catch (error) {
        console.error("Error fetching map data:", error);
        response.status(500).send("Server error");
    }
    
});


module.exports = router;