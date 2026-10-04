// makeReceiver.js
// Small helper so every audience receiver is just a few lines. It subscribes
// to one alert topic and runs a handler for each alert message received.

const mqtt = require("mqtt");
const config = require("../config");

// group:   which audience, e.g. "fireservice" (must exist in config.alertTopics)
// label:   friendly name shown in the console
// onAlert: function(alert) called with the parsed alert payload
function makeReceiver(group, label, onAlert) {
  const topic = config.alertTopics[group];
  const client = mqtt.connect(config.broker);

  client.on("connect", () => {
    client.subscribe(topic);
    console.log(`[${label}] listening for alerts on ${topic}`);
  });

  client.on("message", (_topic, message) => {
    let alert;
    try {
      alert = JSON.parse(message.toString());
    } catch {
      alert = { message: message.toString() };
    }
    onAlert(alert);
  });

  client.on("error", (err) => console.error(`[${label}] error:`, err.message));
}

module.exports = { makeReceiver };
