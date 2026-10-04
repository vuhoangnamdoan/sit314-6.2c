// homeowners.js
// Local home owners near the forest. They get a plain-language warning to
// evacuate or prepare. This stands in for a phone app or home siren.

const { makeReceiver } = require("./makeReceiver");

makeReceiver("homeowners", "HOME OWNERS", (alert) => {
  console.log("\n=== HOME OWNER WARNING ===");
  console.log(`Fire detected near your area (${alert.dangerousSensors} sensors).`);
  console.log("Please prepare to evacuate and follow local guidance.");
  console.log(`Time: ${alert.time}`);
});
