const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();


// Route to get map data based on location details
router.get("/", async (request, response) => {
    const { location, sort = 'distance' } = request.query;
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

        const result = geoData.results[0];

        // Check that the location is within AUS
        const isWithinAus = result.address_components.some(component => 
            component.short_name === 'AU' || component.long_name === 'Australia'
        );

        if (!isWithinAus) {
            return response.status(400).json({
                message: "Location is not within Australia."
            });
        };
        
        const { lat, lng } = result.geometry.location;

        const radius = 5000;
        const types = ["bar", "night_club"];
        const placesResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${types.join('|')}&key=${apiKey}`
        );

        let places = placesResponse.data.results;

        if (sort === 'rating') {
            places = places.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else {
            places = places.map((place) => ({
                ...place,
                distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)

            }));
            places = places.sort((a, b) => a.distance - b.distance);
        };

        const enrichedPlaces = places.map((place) => ({
            name: place.name ,
            address: place.vicinity,
            distance: place.distance ? `${place.distance.toFixed(2)} metres` : 'N/A',
            rating: place.rating || 'N/A',
            website: place.website || 'N/A',
            openingHours : place.opening_hours ? place.opening_hours.weekday_text : 'N/A',
            images: place.photos ? place.photos.map(photo => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`) : [],
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            }
        }));

        // Return coordinate and address data as the response
        response.status(200).json({
            center: {
                lat,
                lng,
                address: result.formatted_address
            },
            places: enrichedPlaces
        });
    } catch (error) {
        console.error("Error fetching map data:", error);
        response.status(500).send("Server error");
    }
    
});


// Route to get autocomplete suggestions for addresses or suburbs
router.get("/autocomplete", async (request, response) => {
    const input = request.query.input;
    const apiKey = process.env.API_KEY;

    if(!input) {
        return response.status(400).json({
            message: "Input parameter is required"
        })
    }

    try {
        // Use the Google Places Autocomplete API for suggestions
        const autocompleteResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&components=country:au&types=(regions)&key=${apiKey}`
        );
        const suggestions = autocompleteResponse.data.predictions;

        // Send suggestions as the response
        response.json(suggestions);
    } catch (error) {
        console.error("Error fetching autocomplete data:", error);
        response.status(500).send("Server error");
    }
});


module.exports = router;