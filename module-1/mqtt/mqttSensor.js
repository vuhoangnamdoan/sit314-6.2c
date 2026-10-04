// mqttSensor.js
// Proof-of-concept sensor for the improved architecture. Instead of holding a
// direct TCP connection to the service, it PUBLISHES its reading to an MQTT
// broker. This decouples sensors from the service: the sensor does not know or
// care how many service instances exist, or which one handles its reading.
//
//   TYPE, REGION, SCENARIO   same as sensorNode.js
//
// Example:
//   TYPE=temp REGION=Mallee SCENARIO=summer node mqtt/mqttSensor.js

const mqtt = require("mqtt");
const { generateReading } = require("../dataModel");

const broker = "mqtt://broker.hivemq.com:1883";
const topic = "sit314/nam/weather/readings";

const type = process.env.TYPE || "temp";
const region = process.env.REGION || "Central";
const simDate =
  (process.env.SCENARIO || "").toLowerCase() === "summer"
    ? new Date(2026, 0, 15, 15, 0)
    : null;

const client = mqtt.connect(broker);

client.on("connect", () => {
  console.log(`[mqtt ${type}@${region}] connected, publishing to ${topic}`);
  setInterval(() => {
    const value = generateReading(type, region, simDate || new Date());
    client.publish(topic, JSON.stringify({ region, type, value, ts: Date.now() }));
    console.log(`[mqtt ${type}@${region}] published ${value}`);
  }, 2000);
});

client.on("error", (e) => console.error(`[mqtt ${type}@${region}] error: ${e.message}`));
