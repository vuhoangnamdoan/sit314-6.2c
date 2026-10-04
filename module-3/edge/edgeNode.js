// edgeNode.js
// The edge node. It accepts readings from the room sensors, works out the room
// state, decides the HVAC setting on a timer, calls the HVAC node, and logs
// every request and status change to MongoDB Atlas.

const express = require("express");
const config = require("../config");
const { send } = require("../respond");
const { decideHvac } = require("../decision");
const { connect, Log } = require("../db");

const app = express();
app.use(express.json());

// --- In-memory room state --------------------------------------------------
// Latest environment reading per sensor, and occupancy per chair.
const envReadings = {}; // { sensorId: { temperature, humidity, ts } }
const chairs = {}; // { chairId: occupied(bool) }
let lastCommand = null; // the previous HVAC command, to detect changes

// --- Sensor endpoints ------------------------------------------------------

// Environment sensors (temperature + humidity).
app.post("/environment", async (req, res) => {
  const { sensorId, temperature, humidity } = req.body || {};
  if (sensorId === undefined || temperature === undefined) {
    return send(res, 400, { error: "sensorId and temperature are required" });
  }
  envReadings[sensorId] = { temperature, humidity, ts: Date.now() };
  await saveLog({ type: "sensor", payload: { kind: "environment", ...req.body } });
  console.log(`[edge] environment from ${sensorId}: ${temperature}C ${humidity}%`);
  send(res, 200, { received: true });
});

// Chair sensors (a person sitting on or leaving a chair).
app.post("/chair", async (req, res) => {
  const { chairId, occupied } = req.body || {};
  if (chairId === undefined || occupied === undefined) {
    return send(res, 400, { error: "chairId and occupied are required" });
  }
  chairs[chairId] = !!occupied;
  await saveLog({ type: "sensor", payload: { kind: "chair", ...req.body } });
  console.log(`[edge] chair ${chairId} occupied=${!!occupied}`);
  send(res, 200, { received: true });
});

// --- Debug endpoints -------------------------------------------------------

app.get("/status", (req, res) => send(res, 200, buildRoomState()));

app.get("/logs", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const logs = await Log.find().sort({ time: -1 }).limit(limit).lean();
  send(res, 200, logs);
});

// --- Room state + control loop --------------------------------------------

// Average the fresh environment readings and count occupied chairs.
function buildRoomState() {
  const now = Date.now();
  const fresh = Object.values(envReadings).filter(
    (r) => now - r.ts <= config.freshnessMs
  );
  const avg = (nums) =>
    nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;

  const occupiedChairs = Object.values(chairs).filter(Boolean).length;

  return {
    avgTemp: avg(fresh.map((r) => r.temperature)),
    avgHumidity: avg(fresh.map((r) => r.humidity).filter((h) => h !== undefined)),
    occupiedChairs,
    totalChairs: config.totalChairs,
    sensorsReporting: fresh.length,
  };
}

// Runs every controlIntervalMs: decide and act.
async function controlLoop() {
  const state = buildRoomState();

  // Need at least one fresh environment reading to judge temperature.
  if (state.sensorsReporting === 0) {
    console.log("[edge] control skipped: no fresh environment readings yet");
    return;
  }

  const cfg = { ...config.comfort, totalChairs: config.totalChairs };
  const command = decideHvac(state, cfg);

  // Send the command to the HVAC node.
  let delivered = false;
  try {
    const url = `${config.hvac.host}:${config.hvac.port}/control`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    delivered = r.ok;
  } catch (e) {
    console.error("[edge] could not reach HVAC node:", e.message);
  }

  // Did the command change since last cycle?
  const changed = JSON.stringify(command) !== JSON.stringify(lastCommand);
  lastCommand = command;

  console.log(
    `[edge] state temp=${state.avgTemp}C humidity=${state.avgHumidity}% ` +
      `occupied=${state.occupiedChairs}/${state.totalChairs} -> ` +
      `${command.mode} (fan ${command.fanSpeed})${changed ? " [CHANGED]" : ""}`
  );

  await saveLog({
    type: "control",
    roomState: state,
    command,
    changed,
    reason: command.reason + (delivered ? "" : " [HVAC unreachable]"),
  });
}

// --- Logging helper --------------------------------------------------------

async function saveLog(doc) {
  try {
    await Log.create(doc);
  } catch (e) {
    console.error("[edge] log write failed:", e.message);
  }
}

// --- Start -----------------------------------------------------------------

async function start() {
  await connect();
  app.listen(config.edge.port, () => {
    console.log(`[edge] listening on ${config.edge.host}:${config.edge.port}`);
    console.log(`[edge] control loop every ${config.controlIntervalMs / 1000}s`);
    setInterval(controlLoop, config.controlIntervalMs);
  });
}

start().catch((e) => {
  console.error("[edge] failed to start:", e.message);
  process.exit(1);
});
