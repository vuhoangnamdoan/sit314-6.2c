// config.js
// Central settings shared by every script so the sensors, receivers and
// Node-RED flow all agree on the same broker, topics and thresholds.

module.exports = {
  // Public MQTT broker (same one used in the Week 4 technical task).
  broker: "mqtt://broker.hivemq.com:1883",

  // Topic namespace. Kept unique so our messages do not clash with other
  // people using the same public broker.
  base: "sit314/nam/forest",

  // Where each sensor publishes its readings: <base>/sensors/<sensorId>
  sensorTopic: (id) => `sit314/nam/forest/sensors/${id}`,

  // Wildcard the Node-RED flow subscribes to (all sensors at once).
  sensorWildcard: "sit314/nam/forest/sensors/+",

  // One alert topic per audience.
  alertTopics: {
    homeowners: "sit314/nam/forest/alerts/homeowners",
    fireservice: "sit314/nam/forest/alerts/fireservice",
    news: "sit314/nam/forest/alerts/news",
    social: "sit314/nam/forest/alerts/social",
  },

  // Danger thresholds. A reading is "dangerous" when heat AND smoke are both
  // over their limits (the flame flag reinforces it). Values grounded in the
  // Week 4 task and common gas-sensor alarm points.
  thresholds: {
    heatC: 50, // degrees Celsius
    smoke: 60, // smoke density index (0-100)
  },

  // How many sensors must be dangerous at the SAME time before an alert is
  // raised. This is the rule that stops a single sensor from causing an alarm.
  minDangerousSensors: 2,

  // A sensor reading older than this (ms) is treated as stale and ignored by
  // the correlation check, so a sensor that has gone quiet cannot keep an
  // alarm alive forever.
  freshnessMs: 10000,
};
