// loadTest.js
// Demonstrates that the service supports many sensors at once, many users at
// once, and returns consistent results.
//
// Phase 1: open many sensor connections across several regions, all streaming
//          readings at the same time, and measure the round trips.
// Phase 2: pause the sensor writes to take a stable snapshot, then fire many
//          user requests for the same region at the same time and confirm they
//          all get an identical answer (consistent results).
//
// Run the service first (npm run service), then: npm run loadtest

const net = require("net");
const { REGION_NAMES, generateReading } = require("./dataModel");

const HOST = "127.0.0.1";
const PORT = process.env.PORT || 6000;
const REGIONS_USED = REGION_NAMES.slice(0, 5); // 5 regions
const TYPES = ["temp", "humidity", "wind", "rain"];
const SENSOR_PHASE_MS = 5000;
const USERS = 25; // concurrent users per region

// SCENARIO=summer simulates a hot summer afternoon so warnings are issued;
// otherwise the current date and time are used.
const simDate =
  (process.env.SCENARIO || "").toLowerCase() === "summer"
    ? new Date(2026, 0, 15, 15, 0) // January, 3pm
    : new Date();

let sent = 0;
let acked = 0;
const sensors = [];

// A streaming sensor connection.
function makeSensor(type, region) {
  return new Promise((resolve) => {
    const s = net.createConnection(PORT, HOST, () => resolve(s));
    let buf = "";
    s.setEncoding("utf8");
    s.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        buf = buf.slice(i + 1);
        acked++;
      }
    });
    s.on("error", () => {});
    s.timer = setInterval(() => {
      s.write(`${type},${generateReading(type, region, simDate)},${region}\n`);
      sent++;
    }, 200);
  });
}

// One user request, resolves with the response line.
function requestWarning(region) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(PORT, HOST, () => s.write(`request,0,${region}\n`));
    let buf = "";
    s.setEncoding("utf8");
    s.on("data", (d) => {
      buf += d;
      const i = buf.indexOf("\n");
      if (i >= 0) {
        s.end();
        resolve(buf.slice(0, i).trim());
      }
    });
    s.on("error", reject);
  });
}

async function main() {
  // Phase 1: many sensors at the same time.
  console.log(`Phase 1: starting ${REGIONS_USED.length * TYPES.length} sensors across ${REGIONS_USED.length} regions`);
  for (const r of REGIONS_USED) {
    for (const t of TYPES) sensors.push(await makeSensor(t, r));
  }
  console.log(`  ${sensors.length} sensors streaming for ${SENSOR_PHASE_MS / 1000}s...`);
  await new Promise((r) => setTimeout(r, SENSOR_PHASE_MS));
  console.log(`  readings sent: ${sent}, acknowledged: ${acked}`);

  // Pause sensor writes so the state is stable for the snapshot.
  sensors.forEach((s) => clearInterval(s.timer));
  await new Promise((r) => setTimeout(r, 300));

  // Phase 2: many users at the same time, checking consistency.
  console.log(`\nPhase 2: ${USERS} concurrent users query each region at the same time`);
  let allConsistent = true;
  for (const r of REGIONS_USED) {
    const responses = await Promise.all(
      Array.from({ length: USERS }, () => requestWarning(r))
    );
    const distinct = [...new Set(responses)];
    const consistent = distinct.length === 1;
    allConsistent = allConsistent && consistent;
    console.log(`  ${r}: ${USERS} users, ${distinct.length} distinct reply -> ${consistent ? "CONSISTENT" : "INCONSISTENT"}`);
    console.log(`     ${responses[0]}`);
  }

  sensors.forEach((s) => s.end());

  console.log(`\nSummary`);
  console.log(`  concurrent sensors: ${sensors.length}`);
  console.log(`  readings sent / acknowledged: ${sent} / ${acked}`);
  console.log(`  concurrent users per region: ${USERS} (total ${USERS * REGIONS_USED.length} requests)`);
  console.log(`  consistency: ${allConsistent ? "ALL REGIONS CONSISTENT" : "SOME INCONSISTENT"}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("load test error:", e.message);
  console.error("Is the service running? Start it with: npm run service");
  process.exit(1);
});
