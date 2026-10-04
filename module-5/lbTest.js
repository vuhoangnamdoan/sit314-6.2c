// lbTest.js
// Demonstrates the load balancer spreading requests across the two API
// instances. It calls the load balancer's /healthcheck endpoint many times and
// counts how many responses came from each instance (by hostname). If more than
// one hostname appears, load balancing is working.
//
// It opens a FRESH connection for each request (agent: false) so requests are
// not all sent down one kept-alive connection to the same instance.
//
// Usage:
//   node lbTest.js http://<load-balancer-dns> [count]
// Example:
//   node lbTest.js http://sit314-alb-123456.ap-southeast-2.elb.amazonaws.com 20

const http = require("http");
const https = require("https");
const { URL } = require("url");

const BASE = process.argv[2] || process.env.LB_URL;
const COUNT = Number(process.argv[3] || 20);

if (!BASE) {
  console.error("Usage: node lbTest.js http://<load-balancer-dns> [count]");
  process.exit(1);
}

// One request on its own connection, returns the handling instance's hostname.
function whichServer() {
  return new Promise((resolve, reject) => {
    const u = new URL("/healthcheck", BASE);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      u,
      { agent: false, headers: { Connection: "close" } },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          try {
            const j = JSON.parse(body);
            resolve((j.data && j.data.server) || "unknown");
          } catch {
            resolve("unknown");
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log(`Sending ${COUNT} requests to ${BASE}/healthcheck\n`);
  const tally = {};

  for (let i = 1; i <= COUNT; i++) {
    const server = await whichServer();
    tally[server] = (tally[server] || 0) + 1;
    console.log(`  #${String(i).padStart(2, "0")} handled by ${server}`);
  }

  console.log("\nDistribution:");
  for (const [server, n] of Object.entries(tally)) {
    console.log(`  ${server}: ${n} (${Math.round((n / COUNT) * 100)}%)`);
  }

  console.log(
    Object.keys(tally).length > 1
      ? "\nLoad balancing confirmed: requests were served by more than one instance."
      : "\nOnly one instance answered. Send more requests, or check both targets are healthy."
  );
}

main().catch((e) => {
  console.error("error:", e.message);
  console.error("Is the load balancer DNS correct and are the instances healthy?");
  process.exit(1);
});
