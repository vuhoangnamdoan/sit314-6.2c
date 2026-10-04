// config.js
// Central settings shared by every node so the sensors, edge and HVAC node
// all agree on ports, endpoints, thresholds and the control cadence.

require("dotenv").config();

module.exports = {
  // Where each server listens.
  edge: { host: "http://localhost", port: 3000 },
  hvac: { host: "http://localhost", port: 3001 },

  // MongoDB Atlas. The connection string is read from the environment so no
  // credentials are stored in the code. Copy .env.example to .env and paste
  // your Week 5 Atlas URI there.
  mongoUri: process.env.MONGODB_URI || "",
  dbName: process.env.MONGODB_DB || "sit314_hvac",

  // How often the edge node averages recent readings and issues one HVAC
  // command (milliseconds).
  controlIntervalMs: 15000,

  // A room reading is only used if it arrived within this window.
  freshnessMs: 20000,

  // Comfort rules (degrees Celsius and % relative humidity).
  comfort: {
    coolAbove: 24, // warmer than this -> cool
    heatBelow: 19, // cooler than this -> heat
    targetTemp: 22, // temperature the HVAC aims for
    humidityHigh: 60, // above this -> dehumidify and raise fan
  },

  // Total chairs in the room, used to scale fan speed with how full it is.
  totalChairs: 6,
};
