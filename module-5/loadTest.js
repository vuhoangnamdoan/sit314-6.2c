// loadTest.js
// Generates sustained load against the load balancer so both instances take
// traffic. Use it to populate the "RequestCount per target" graph in the target
// group's Monitoring tab (or CloudWatch), which shows the load split across the
// two instances. Each request uses a fresh connection so it spreads properly.
//
// Usage:
//   node loadTest.js http://<load-balancer-dns> [durationSeconds] [concurrency]
// Example (60 seconds, 20 parallel workers):
//   node loadTest.js http://sit314-alb-123456.ap-southeast-2.elb.amazonaws.com 60 20

const http = require("http");
const https = require("https");
const { URL } = require("url");

const BASE = process.argv[2] || process.env.LB_URL;
const DURATION = Number(process.argv[3] || 60);
const CONCURRENCY = Number(process.argv[4] || 20);

if (!BASE) {
  console.error("Usage: node loadTest.js http://<load-balancer-dns> [durationSeconds] [concurrency]");
  process.exit(1);
}

const tally = {};
let total = 0;
let errors = 0;

function oneRequest() {
  return new Promise((resolve) => {
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
            const s = (j.data && j.data.server) || "unknown";
            tally[s] = (tally[s] || 0) + 1;
          } catch {
            errors++;
          }
          total++;
          resolve();
        });
      }
    );
    req.on("error", () => {
      errors++;
      total++;
      resolve();
    });
    req.end();
  });
}

async function worker(deadline) {
  while (Date.now() < deadline) {
    await oneRequest();
  }
}

async function main() {
  console.log(
    `Load test: ${CONCURRENCY} parallel workers for ${DURATION}s against ${BASE}/healthcheck\n`
  );
  const deadline = Date.now() + DURATION * 1000;

  // Progress line every 5 seconds.
  const timer = setInterval(() => {
    console.log(`  ...${total} requests so far`);
  }, 5000);

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(deadline)));
  clearInterval(timer);

  console.log(`\nTotal requests: ${total}  (errors: ${errors})`);
  console.log(`Throughput: ${Math.round(total / DURATION)} req/s`);
  console.log("\nHandled by:");
  for (const [server, n] of Object.entries(tally)) {
    console.log(`  ${server}: ${n} (${Math.round((n / total) * 100)}%)`);
  }
  console.log(
    "\nNow open the target group Monitoring tab (RequestCount per target) to see the split."
  );
}

main().catch((e) => {
  console.error("error:", e.message);
  process.exit(1);
});
