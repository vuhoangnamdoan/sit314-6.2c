function decideHvac(state, cfg) {
  const { avgTemp, avgHumidity, occupiedChairs, totalChairs } = state;

  // No one in the room: turn everything off to save energy.
  if (!occupiedChairs || occupiedChairs <= 0) {
    return {
      mode: "off",
      fanSpeed: 0,
      targetTemp: null,
      dehumidify: false,
      reason: "Room empty, HVAC off to save energy",
    };
  }

  // Pick heating, cooling or ventilation from the temperature.
  let mode, reason;
  if (avgTemp > cfg.coolAbove) {
    mode = "cool";
    reason = `Too warm (${avgTemp}C > ${cfg.coolAbove}C), cooling`;
  } else if (avgTemp < cfg.heatBelow) {
    mode = "heat";
    reason = `Too cold (${avgTemp}C < ${cfg.heatBelow}C), heating`;
  } else {
    mode = "ventilate";
    reason = `Comfortable (${avgTemp}C), ventilating only`;
  }

  // Fan speed scales with how full the room is (more people, more load).
  const ratio = totalChairs > 0 ? occupiedChairs / totalChairs : 0;
  let fanSpeed = 1 + Math.round(ratio * 2); // 1..3

  // High humidity: switch on dehumidify and give the fan a boost.
  const dehumidify = avgHumidity > cfg.humidityHigh;
  if (dehumidify) {
    fanSpeed = Math.min(3, fanSpeed + 1);
    reason += `; humidity ${avgHumidity}% high, dehumidifying`;
  }

  return {
    mode,
    fanSpeed,
    targetTemp: cfg.targetTemp,
    dehumidify,
    reason,
  };
}

module.exports = { decideHvac };
