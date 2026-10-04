// fireservice.js
// The fire service dispatch. They get the technical detail they need to
// respond: which sensors are dangerous and the readings behind the alert.

const { makeReceiver } = require("./makeReceiver");

makeReceiver("fireservice", "FIRE SERVICE", (alert) => {
  console.log("\n=== FIRE SERVICE DISPATCH ===");
  console.log(`Confirmed fire event. Dispatch a unit.`);
  console.log(`Dangerous sensors (${alert.dangerousSensors}): ${alert.sensorIds}`);
  console.log(`Readings: ${JSON.stringify(alert.readings)}`);
  console.log(`Time: ${alert.time}`);
});
