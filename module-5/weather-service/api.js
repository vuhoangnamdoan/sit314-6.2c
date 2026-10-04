// api.js
// Local weather web-service. It accepts temperature reading submissions, stores
// them in MongoDB Atlas, and serves them back to clients. It also keeps a record
// of the latest reading and looks up live weather for a map location.
//
// Endpoints:
//   POST   /temps           create a reading
//   GET    /temps           read all readings (newest first; ?location, ?count)
//   GET    /temps/latest    read the latest reading
//   GET    /temps/:id       read one reading
//   PUT    /temps/:id       update a reading
//   DELETE /temps/:id       delete a reading
//   GET    /weather         live weather for ?location=Melbourne

const os = require("os");
const express = require("express");
const config = require("./config");
const { send } = require("./respond");
const { connect, Reading } = require("./db");
const { getWeather } = require("./weather");

const app = express();
app.use(express.json());

// In-memory record of the latest temperature reading.
let latestReading = null;

// --- Index -----------------------------------------------------------------
app.get("/", (req, res) =>
  send(res, 200, {
    service: "local weather web-service",
    endpoints: [
      "POST /temps",
      "GET /temps",
      "GET /temps/latest",
      "GET /temps/:id",
      "PUT /temps/:id",
      "DELETE /temps/:id",
      "GET /weather?location=Melbourne",
    ],
  })
);

// --- Health check ----------------------------------------------------------
// Used by the AWS load balancer to check an instance is alive. The "server"
// field is this instance's hostname, so calling it through the load balancer
// shows which instance answered, which demonstrates load balancing.
app.get("/healthcheck", (req, res) =>
  send(res, 200, { status: "ok", server: os.hostname() })
);

// --- Weather by location ---------------------------------------------------
app.get("/weather", async (req, res) => {
  const location = req.query.location || config.defaultLocation;
  const data = await getWeather(location);
  if (!data) return send(res, 502, { error: `No weather found for '${location}'` });
  send(res, 200, data);
});

// --- CREATE ----------------------------------------------------------------
app.post("/temps", async (req, res) => {
  const { temperature, location, sensorId } = req.body || {};
  if (temperature === undefined || isNaN(Number(temperature))) {
    return send(res, 400, { error: "temperature (a number) is required" });
  }
  const reading = await Reading.create({
    temperature: Number(temperature),
    location: location || config.defaultLocation,
    sensorId: sensorId || "unknown",
  });
  latestReading = reading; // this is now the latest
  send(res, 201, reading);
});

// --- READ all --------------------------------------------------------------
app.get("/temps", async (req, res) => {
  const filter = req.query.location ? { location: req.query.location } : {};
  const count = Math.min(Number(req.query.count) || 50, 200);
  const readings = await Reading.find(filter).sort({ time: -1 }).limit(count).lean();
  send(res, 200, readings);
});

// --- READ latest (must be before /temps/:id) -------------------------------
app.get("/temps/latest", async (req, res) => {
  if (!latestReading) {
    // Cache empty (e.g. just started): fall back to the database.
    latestReading = await Reading.findOne().sort({ time: -1 });
  }
  if (!latestReading) return send(res, 404, { error: "no readings yet" });
  send(res, 200, latestReading);
});

// --- READ one --------------------------------------------------------------
app.get("/temps/:id", async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id);
    if (!reading) return send(res, 404, { error: "reading not found" });
    send(res, 200, reading);
  } catch (e) {
    send(res, 400, { error: "invalid id" });
  }
});

// --- UPDATE ----------------------------------------------------------------
app.put("/temps/:id", async (req, res) => {
  const { temperature, location, sensorId } = req.body || {};
  const update = {};
  if (temperature !== undefined) update.temperature = Number(temperature);
  if (location !== undefined) update.location = location;
  if (sensorId !== undefined) update.sensorId = sensorId;

  try {
    const reading = await Reading.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!reading) return send(res, 404, { error: "reading not found" });
    // Keep the latest record in step if we edited it.
    if (latestReading && String(latestReading._id) === String(reading._id)) {
      latestReading = reading;
    }
    send(res, 200, reading);
  } catch (e) {
    send(res, 400, { error: "invalid id" });
  }
});

// --- DELETE ----------------------------------------------------------------
app.delete("/temps/:id", async (req, res) => {
  try {
    const reading = await Reading.findByIdAndDelete(req.params.id);
    if (!reading) return send(res, 404, { error: "reading not found" });
    // If we deleted the latest, refresh the record from the database.
    if (latestReading && String(latestReading._id) === String(reading._id)) {
      latestReading = await Reading.findOne().sort({ time: -1 });
    }
    send(res, 200, { deleted: reading._id });
  } catch (e) {
    send(res, 400, { error: "invalid id" });
  }
});

// --- Start -----------------------------------------------------------------
async function start() {
  await connect();
  latestReading = await Reading.findOne().sort({ time: -1 }); // load latest on boot
  app.listen(config.port, () => {
    console.log(`[api] weather service listening on http://localhost:${config.port}`);
  });
}

// Only connect and listen when run directly (node api.js). When required by a
// test, the app is exported so it can be exercised without a database.
if (require.main === module) {
  start().catch((e) => {
    console.error("[api] failed to start:", e.message);
    process.exit(1);
  });
}

module.exports = { app };
