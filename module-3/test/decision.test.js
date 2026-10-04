// decision.test.js
// Plain Node.js checks for the HVAC decision logic. No test framework needed.
// Run with:  node test/decision.test.js   (or: npm test)

const assert = require("assert");
const config = require("../config");
const { decideHvac } = require("../decision");

const cfg = { ...config.comfort, totalChairs: config.totalChairs };
let passed = 0;

function check(name, fn) {
  fn();
  console.log(`  ok - ${name}`);
  passed++;
}

check("empty room -> HVAC off", () => {
  const c = decideHvac(
    { avgTemp: 28, avgHumidity: 70, occupiedChairs: 0, totalChairs: 6 },
    cfg
  );
  assert.strictEqual(c.mode, "off");
  assert.strictEqual(c.fanSpeed, 0);
});

check("occupied and hot -> cool", () => {
  const c = decideHvac(
    { avgTemp: 27, avgHumidity: 45, occupiedChairs: 3, totalChairs: 6 },
    cfg
  );
  assert.strictEqual(c.mode, "cool");
});

check("occupied and cold -> heat", () => {
  const c = decideHvac(
    { avgTemp: 16, avgHumidity: 45, occupiedChairs: 2, totalChairs: 6 },
    cfg
  );
  assert.strictEqual(c.mode, "heat");
});

check("occupied and comfortable -> ventilate", () => {
  const c = decideHvac(
    { avgTemp: 22, avgHumidity: 45, occupiedChairs: 2, totalChairs: 6 },
    cfg
  );
  assert.strictEqual(c.mode, "ventilate");
});

check("high humidity -> dehumidify on and fan boosted", () => {
  const low = decideHvac(
    { avgTemp: 22, avgHumidity: 40, occupiedChairs: 2, totalChairs: 6 },
    cfg
  );
  const high = decideHvac(
    { avgTemp: 22, avgHumidity: 75, occupiedChairs: 2, totalChairs: 6 },
    cfg
  );
  assert.strictEqual(high.dehumidify, true);
  assert.ok(high.fanSpeed > low.fanSpeed);
});

check("fan speed scales with occupancy", () => {
  const few = decideHvac(
    { avgTemp: 27, avgHumidity: 45, occupiedChairs: 1, totalChairs: 6 },
    cfg
  );
  const many = decideHvac(
    { avgTemp: 27, avgHumidity: 45, occupiedChairs: 6, totalChairs: 6 },
    cfg
  );
  assert.ok(many.fanSpeed > few.fanSpeed);
});

console.log(`\nAll ${passed} checks passed.`);
