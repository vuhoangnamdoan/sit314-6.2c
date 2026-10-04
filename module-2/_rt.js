// _rt.js  (optional connectivity check - safe to delete)
// Quick round-trip test: connects to the broker, publishes one reading and
// confirms it is received back. Use it to prove your machine can reach the
// broker before running the full demo.
//   node _rt.js
const mqtt = require("mqtt");
const cfg = require("./config");

const client = mqtt.connect(cfg.broker);
const topic = cfg.sensorTopic("rt_test");
let got = false;

const timer = setTimeout(() => {
  console.log(got ? "" : "TIMEOUT - no message (check network/broker)");
  process.exit(got ? 0 : 1);
}, 8000);

client.on("connect", () => {
  console.log("connected to", cfg.broker);
  client.subscribe(topic, () => {
    client.publish(
      topic,
      JSON.stringify({ id: "rt_test", heat: 72, smoke: 81, fire: 1, ts: Date.now() })
    );
  });
});

client.on("message", (t, m) => {
  console.log("round-trip OK on", t, "=>", m.toString());
  got = true;
  clearTimeout(timer);
  client.end();
  process.exit(0);
});

client.on("error", (e) => {
  console.log("error:", e.message);
  process.exit(1);
});
