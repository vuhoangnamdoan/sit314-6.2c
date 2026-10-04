// hvacNode.js
// The HVAC (Heating, Ventilation and Air Conditioning) node. It exposes an
// endpoint the edge node calls to set the current room configuration. Since we
// have no physical unit, it simulates the HVAC by printing what it would do.

const express = require("express");
const config = require("../config");
const { send } = require("../respond");

const app = express();
app.use(express.json());

// The unit's current configuration, updated on every control request.
let currentConfig = {
  mode: "off",
  fanSpeed: 0,
  targetTemp: null,
  dehumidify: false,
};

// Receive a new configuration from the edge node.
app.post("/control", (req, res) => {
  const { mode, fanSpeed, targetTemp, dehumidify } = req.body || {};
  if (!mode) return send(res, 400, { error: "mode is required" });

  currentConfig = {
    mode,
    fanSpeed: fanSpeed ?? 0,
    targetTemp: targetTemp ?? null,
    dehumidify: !!dehumidify,
  };

  // Simulated actuation.
  console.log(
    `[hvac] SET -> mode=${currentConfig.mode} fan=${currentConfig.fanSpeed} ` +
      `target=${currentConfig.targetTemp ?? "-"}C dehumidify=${currentConfig.dehumidify}`
  );

  send(res, 200, currentConfig);
});

// Allow the configuration to be polled for debugging.
app.get("/status", (req, res) => send(res, 200, currentConfig));

app.listen(config.hvac.port, () => {
  console.log(`[hvac] listening on ${config.hvac.host}:${config.hvac.port}`);
});
