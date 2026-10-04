// db.js
// MongoDB Atlas connection and the Log model. The edge node uses this to keep
// a log of requests made and of HVAC status changes.

const mongoose = require("mongoose");
const config = require("./config");

// One flexible log collection. "type" tells the two kinds apart:
//   "sensor"  a reading received from a sensor node (a request made)
//   "control" a control cycle: room state in, HVAC command out (status change)
const logSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    time: { type: Date, default: Date.now },
    payload: { type: Object }, // sensor reading, for "sensor" logs
    roomState: { type: Object }, // averaged inputs, for "control" logs
    command: { type: Object }, // HVAC command, for "control" logs
    changed: { type: Boolean }, // did the command change since last cycle
    reason: { type: String }, // plain-language explanation
  },
  { collection: "logs" }
);

const Log = mongoose.model("Log", logSchema);

async function connect() {
  if (!config.mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and add your Atlas URI."
    );
  }
  await mongoose.connect(config.mongoUri, { dbName: config.dbName });
  console.log(`[edge] connected to MongoDB Atlas (db: ${config.dbName})`);
}

module.exports = { connect, Log };
