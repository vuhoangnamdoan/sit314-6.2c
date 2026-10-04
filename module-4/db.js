// db.js
// MongoDB Atlas connection and the temperature Reading model. Every CRUD
// operation in api.js works on this collection.

const mongoose = require("mongoose");
const config = require("./config");

const readingSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    temperature: { type: Number, required: true }, // degrees Celsius
    sensorId: { type: String, default: "unknown" },
    time: { type: Date, default: Date.now },
  },
  { collection: "readings" }
);

const Reading = mongoose.model("Reading", readingSchema);

async function connect() {
  if (!config.mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and add your Atlas URI."
    );
  }
  await mongoose.connect(config.mongoUri, { dbName: config.dbName });
  console.log(`[api] connected to MongoDB (db: ${config.dbName})`);
}

module.exports = { connect, Reading };
