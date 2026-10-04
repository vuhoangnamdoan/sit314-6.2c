// dataModel.test.js
// Checks the realistic data model and the warning rule. No framework needed.
//   node test/dataModel.test.js   (or: npm test)

const assert = require("assert");
const {
  generateReading,
  computeFireDanger,
  decideWarning,
} = require("../dataModel");

let passed = 0;
function check(name, fn) {
  fn();
  console.log(`  ok - ${name}`);
  passed++;
}

const summerNoon = new Date(2026, 0, 15, 15, 0); // January, 3pm (month index 0)
const winterNight = new Date(2026, 6, 15, 3, 0); // July, 3am

// --- realistic data --------------------------------------------------------
check("summer afternoon is hotter than winter night (same region)", () => {
  const hot = generateReading("temp", "Mallee", summerNoon, false);
  const cold = generateReading("temp", "Mallee", winterNight, false);
  assert.ok(hot > cold, `${hot} should be > ${cold}`);
});

check("hotter, drier region reads warmer than a cool wet one", () => {
  const mallee = generateReading("temp", "Mallee", summerNoon, false);
  const gippsland = generateReading("temp", "East Gippsland", summerNoon, false);
  assert.ok(mallee > gippsland);
});

check("humidity is lower on a hot summer afternoon than a winter night", () => {
  const dry = generateReading("humidity", "Mallee", summerNoon, false);
  const damp = generateReading("humidity", "Mallee", winterNight, false);
  assert.ok(dry < damp);
});

// --- fire danger + warning -------------------------------------------------
check("hot, dry, windy state gives an Extreme rating and a warning", () => {
  const w = decideWarning("Mallee", { temp: 42, wind: 45, humidity: 10, rain: 0 });
  assert.strictEqual(w.danger, "Extreme");
  assert.strictEqual(w.warning, true);
});

check("cool, damp, calm state gives a Low rating and no warning", () => {
  const w = decideWarning("East Gippsland", { temp: 14, wind: 8, humidity: 80, rain: 20 });
  assert.strictEqual(w.warning, false);
  assert.ok(["Low", "Moderate"].includes(w.danger));
});

check("computeFireDanger is deterministic for the same inputs", () => {
  const a = computeFireDanger({ temp: 30, wind: 20, humidity: 40, rain: 2 });
  const b = computeFireDanger({ temp: 30, wind: 20, humidity: 40, rain: 2 });
  assert.deepStrictEqual(a, b);
});

console.log(`\nAll ${passed} checks passed.`);
