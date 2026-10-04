// sensorClient.js
// Simulates a sensor sending temperature readings to the load-balanced API.
// Each reading is a POST /temps through the load balancer, so the writes are
// spread across the two instances and stored in the shared MongoDB.
//
// Usage:
//   node sensorClient.js http://<load-balancer-dns> [intervalMs]
// Example:
//   node sensorClient.js http://sit314-alb-123456.ap-southeast-2.elb.amazonaws.com 2000

const BASE = process.argv[2] || process.env.LB_URL;
const INTERVAL = Number(process.argv[3] || 2000);

if (!BASE) {
  console.error("Usage: node sensorClient.js http://<load-balancer-dns> [intervalMs]");
  process.exit(1);
}

let n = 0;

async function send() {
  const reading = {
    location: "Melbourne, AU",
    temperature: Math.round((15 + Math.random() * 20) * 10) / 10,
    sensorId: "sensor_lb",
  };
  try {
    const r = await fetch(`${BASE}/temps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading),
    });
    console.log(`#${++n} sent ${reading.temperature}C -> ${r.status}`);
  } catch (e) {
    console.error("error:", e.message);
  }
}

console.log(`Sending a reading to ${BASE}/temps every ${INTERVAL / 1000}s. Ctrl+C to stop.`);
setInterval(send, INTERVAL);
send();
