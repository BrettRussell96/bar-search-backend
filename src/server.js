const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: 'GET'
}));

app.get("/", (request, response) => {
    response.json({
        message: "Welcome to Bar Search!"
    });
});


const mapRouter = require("./MapRouter.js");
app.use("/map", mapRouter);


app.get("*", (request, response, next) => {
    response.status(404).json({
        message: "404 Page not found."
    });
});

app.use((error, request, response, next) => {
    response.status(error.status || 500).json({
        message: "Error Occured.",
        error: error.message
    });
});

module.exports = {
    app
}