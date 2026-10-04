// mqttService.js
// Proof-of-concept service worker for the improved architecture. It SUBSCRIBES
// to the readings topic, updates the shared state, and computes the warning.
//
// The point of this design: because sensors publish to the broker rather than
// connecting to one server, you can run several of these workers at once to
// share the load, and the sensors are unaffected. Each worker prints its own id
// so you can see which worker handled a message when more than one is running.

const os = require("os");
const mqtt = require("mqtt");
const store = require("../store");
const { decideWarning } = require("../dataModel");

const broker = "mqtt://broker.hivemq.com:1883";
const topic = "sit314/nam/weather/readings";
const workerId = `${os.hostname()}#${process.pid}`;

const client = mqtt.connect(broker);

client.on("connect", () => {
  client.subscribe(topic);
  console.log(`[worker ${workerId}] connected, subscribed to ${topic}`);
});

client.on("message", (_t, message) => {
  let r;
  try {
    r = JSON.parse(message.toString());
  } catch {
    return;
  }
  store.setReading(r.region, r.type, r.value);
  const w = decideWarning(r.region, store.getState(r.region));
  console.log(`[worker ${workerId}] ${r.region} ${r.type}=${r.value} -> ${w.message}`);
});

client.on("error", (e) => console.error(`[worker ${workerId}] error: ${e.message}`));
