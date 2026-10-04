// warningClient.js
// A user of the service. It asks for the current weather warning in a region
// every 2 seconds and prints the reply.
//
//   REGION   a Victorian district   (default: Central)
//
// Example:
//   REGION=Mallee node warningClient.js

const net = require("net");

const host = "127.0.0.1";
const port = process.env.PORT || 6000;
const region = process.env.REGION || "Central";

const client = net.createConnection(port, host, () => {
  console.log(`[user@${region}] connected`);
  setInterval(() => client.write(`request,0,${region}\n`), 2000);
});

client.setEncoding("utf8");
client.on("data", (data) => process.stdout.write(`[user@${region}] ${data}`));
client.on("error", (e) => console.error(`[user@${region}] error: ${e.message}`));
client.on("close", () => console.log(`[user@${region}] connection closed`));
