// detection.test.js
// Plain Node.js checks for the alarm rules. No test framework needed.
// Run with:  node test/detection.test.js   (or: npm test)

const assert = require("assert");
const config = require("../config");
const { isDangerous, evaluateFleet } = require("../detection");

const T = config.thresholds;
let passed = 0;

function check(name, fn) {
  fn();
  console.log(`  ok - ${name}`);
  passed++;
}

const safe = { heat: 25, smoke: 10, fire: 0 };
const hot = { heat: 70, smoke: 80, fire: 1 };
const now = 1000000;
const fresh = now; // same time = fresh

// --- isDangerous ------------------------------------------------------------
check("safe reading is not dangerous", () => {
  assert.strictEqual(isDangerous(safe, T), false);
});
check("hot + smoky + flame is dangerous", () => {
  assert.strictEqual(isDangerous(hot, T), true);
});
check("high heat but low smoke is NOT dangerous", () => {
  assert.strictEqual(isDangerous({ heat: 70, smoke: 10, fire: 0 }, T), false);
});
check("flame flag alone is dangerous", () => {
  assert.strictEqual(isDangerous({ heat: 25, smoke: 10, fire: 1 }, T), true);
});

// --- evaluateFleet ----------------------------------------------------------
check("no sensors -> no alert", () => {
  const r = evaluateFleet({}, now, config);
  assert.strictEqual(r.alert, false);
});

check("ONE dangerous sensor -> NO alert (single sensor rule)", () => {
  const states = {
    s1: { reading: hot, ts: fresh },
    s2: { reading: safe, ts: fresh },
  };
  const r = evaluateFleet(states, now, config);
  assert.strictEqual(r.count, 1);
  assert.strictEqual(r.alert, false);
});

check("TWO dangerous sensors -> alert", () => {
  const states = {
    s1: { reading: hot, ts: fresh },
    s2: { reading: hot, ts: fresh },
    s3: { reading: safe, ts: fresh },
  };
  const r = evaluateFleet(states, now, config);
  assert.strictEqual(r.count, 2);
  assert.strictEqual(r.alert, true);
});

check("stale dangerous readings are ignored", () => {
  const states = {
    s1: { reading: hot, ts: now - (config.freshnessMs + 1) }, // too old
    s2: { reading: hot, ts: fresh },
  };
  const r = evaluateFleet(states, now, config);
  assert.strictEqual(r.count, 1);
  assert.strictEqual(r.alert, false);
});

console.log(`\nAll ${passed} checks passed.`);
