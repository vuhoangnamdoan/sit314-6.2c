// sensorNode.js
// A simulated weather sensor. It generates realistic values (based on the
// month, time of day and region, see dataModel.js) and sends them to the
// service over TCP every 2 seconds, newline-terminated.
//
//   TYPE     temp | humidity | wind | rain   (default: temp)
//   REGION   a Victorian district            (default: Central)
//
// Example:
//   TYPE=temp REGION=Mallee node sensorNode.js

const net = require("net");
const { generateReading } = require("./dataModel");

const host = "127.0.0.1";
const port = process.env.PORT || 6000;
const type = process.env.TYPE || "temp";
const region = process.env.REGION || "Central";

// SCENARIO=summer simulates a hot summer afternoon (so warnings can be shown);
// otherwise the real current date and time are used.
const simDate =
  (process.env.SCENARIO || "").toLowerCase() === "summer"
    ? new Date(2026, 0, 15, 15, 0)
    : null;

const client = net.createConnection(port, host, () => {
  console.log(`[${type}@${region}] connected`);
  setInterval(() => {
    const value = generateReading(type, region, simDate || new Date());
    client.write(`${type},${value},${region}\n`);
    console.log(`[${type}@${region}] sent ${value}`);
  }, 2000);
});

client.setEncoding("utf8");
client.on("data", (data) => process.stdout.write(`[${type}@${region}] ack: ${data}`));
client.on("error", (e) => console.error(`[${type}@${region}] error: ${e.message}`));
client.on("close", () => console.log(`[${type}@${region}] connection closed`));
