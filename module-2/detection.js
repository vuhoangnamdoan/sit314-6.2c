// detection.js
// Pure decision logic for the alarm. Kept free of MQTT so it can be unit
// tested, and so the exact same rules can be pasted into the Node-RED
// function nodes.

function isDangerous(reading, thresholds) {
  const hotAndSmoky =
    reading.heat > thresholds.heatC && reading.smoke > thresholds.smoke;
  const flame = reading.fire === 1;
  return hotAndSmoky || flame;
}

function evaluateFleet(states, now, config) {
  const dangerousIds = [];

  for (const id of Object.keys(states)) {
    const { reading, ts } = states[id];
    const fresh = now - ts <= config.freshnessMs;
    if (fresh && isDangerous(reading, config.thresholds)) {
      dangerousIds.push(id);
    }
  }

  return {
    dangerousIds,
    count: dangerousIds.length,
    alert: dangerousIds.length >= config.minDangerousSensors,
  };
}

module.exports = { isDangerous, evaluateFleet };
