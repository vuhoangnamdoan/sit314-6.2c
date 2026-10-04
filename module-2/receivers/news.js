// news.js
// News organisations. They get a short, broadcast-ready bulletin they can
// turn into an alert on TV or their website.

const { makeReceiver } = require("./makeReceiver");

makeReceiver("news", "NEWS", (alert) => {
  console.log("\n=== NEWS BULLETIN ===");
  console.log(
    `BREAKING: Forest fire detected. ${alert.dangerousSensors} monitoring ` +
      `stations report high heat and smoke. Authorities have been alerted.`
  );
  console.log(`Time: ${alert.time}`);
});
