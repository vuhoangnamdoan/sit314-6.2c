// config.js
// Central settings for the weather service.

require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,

  // MongoDB Atlas connection, read from the environment so no credentials are
  // stored in the code. Copy .env.example to .env and paste your Week 5 URI.
  mongoUri: process.env.MONGODB_URI || "",
  dbName: process.env.MONGODB_DB || "sit314_weather",

  // Default place for the weather endpoint when no location is given.
  defaultLocation: "Melbourne, AU",
};
