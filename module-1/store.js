// store.js
// The single source of truth for each region's latest readings. It is kept
// behind a small interface (setReading / getState / getWarning) on purpose:
// today it is an in-memory object, but because nothing else touches the data
// directly, it could be swapped for a shared store (such as Redis) so that
// several service instances share one state. That is the key change needed to
// scale the service horizontally, and it is discussed in the report.

const { REGION_NAMES, decideWarning } = require("./dataModel");

const regionData = {};
REGION_NAMES.forEach((r) => {
  regionData[r] = { temp: null, wind: null, rain: null, humidity: null };
});

// Save one reading. Returns false if the region or type is unknown.
function setReading(region, type, value) {
  if (!regionData[region]) return false;
  if (!(type in regionData[region])) return false;
  regionData[region][type] = value;
  return true;
}

function getState(region) {
  return regionData[region] || null;
}

// Work out the current warning for a region from its latest state.
function getWarning(region) {
  if (!regionData[region]) return null;
  return decideWarning(region, regionData[region]);
}

module.exports = { setReading, getState, getWarning, regionData };
