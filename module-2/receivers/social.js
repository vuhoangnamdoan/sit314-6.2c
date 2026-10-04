// social.js
// Social media channel. This prints the post locally so you can see it, while
// Node-RED separately sends the same alert to a real IFTTT webhook (which can
// post to X/Twitter, send a phone notification, etc.). Keeping a local copy
// makes the channel easy to demonstrate even without the IFTTT step.

const { makeReceiver } = require("./makeReceiver");

makeReceiver("social", "SOCIAL MEDIA", (alert) => {
  console.log("\n=== SOCIAL MEDIA POST ===");
  console.log(
    `#Wildfire alert: fire detected by ${alert.dangerousSensors} forest ` +
      `sensors. Stay safe and follow official channels. #ForestFire`
  );
  console.log(`Time: ${alert.time}`);
});
