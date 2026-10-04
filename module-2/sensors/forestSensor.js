// forestSensor.js
// One simulated forest sensor node. It measures heat, smoke and fire at a
// point in the forest and publishes a JSON reading over MQTT every 2 seconds.
//
// The same script runs for every sensor. You pick which sensor it is and how
// it behaves with two environment variables:
//
//   SENSOR_ID   a name for this sensor        (default: sensor_1)
//   SCENARIO    "normal" or "fire"            (default: normal)
//
// Examples:
//   SENSOR_ID=sensor_north node sensors/forestSensor.js
//   SENSOR_ID=sensor_east SCENARIO=fire node sensors/forestSensor.js

const mqtt = require("mqtt");
const config = require("../config");

const sensorId = process.env.SENSOR_ID || "sensor_1";
const scenario = (process.env.SCENARIO || "normal").toLowerCase();
const topic = config.sensorTopic(sensorId);

// Return a random number between min and max.
function between(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// Produce one reading based on the scenario.
//   normal: safe forest conditions
//   fire:   heat, smoke and flame all high
function makeReading() {
  if (scenario === "fire") {
    return {
      id: sensorId,
      heat: between(60, 90), // hot
      smoke: between(70, 95), // heavy smoke
      fire: 1, // flame detected
      ts: Date.now(),
    };
  }
  return {
    id: sensorId,
    heat: between(18, 35), // ambient forest temperature
    smoke: between(0, 20), // light haze at most
    fire: 0, // no flame
    ts: Date.now(),
  };
}

const client = mqtt.connect(config.broker);

client.on("connect", () => {
  console.log(`[${sensorId}] connected to broker, scenario = ${scenario}`);
  console.log(`[${sensorId}] publishing to ${topic}`);

  setInterval(() => {
    const reading = makeReading();
    client.publish(topic, JSON.stringify(reading));
    console.log(
      `[${sensorId}] heat=${reading.heat}C smoke=${reading.smoke} fire=${reading.fire}`
    );
  }, 2000);
});

client.on("error", (err) => console.error(`[${sensorId}] error:`, err.message));
