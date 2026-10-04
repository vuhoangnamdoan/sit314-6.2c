// weatherService.js
// Improved version of the Week 2 weather warning service.
//
// Two problems in the Week 2 server are fixed here:
//   1. Message framing. TCP is a byte stream, so one "data" event can carry
//      several messages joined together or half a message. The Week 2 code
//      assumed one message per event, which corrupts parsing once many sensors
//      send quickly. This version buffers bytes and splits on newlines, so each
//      message is handled exactly once no matter how the bytes arrive.
//   2. Validation. Unknown regions, unknown types and non-numeric values are
//      rejected instead of writing bad data into the state.
//
// Messages are newline-terminated: "type,value,region\n", for example
//   temp,32.5,Mallee\n
//   request,0,Mallee\n

const net = require("net");
const store = require("./store");
const { REGION_NAMES } = require("./dataModel");

const port = process.env.PORT || 6000;
let processed = 0;
let requests = 0;

function handleLine(socket, line) {
  const parts = line.split(",");
  const type = parts[0];
  const region = parts[2] || "Central";

  // A user asking for the current warning.
  if (type === "request") {
    const w = store.getWarning(region);
    socket.write((w ? w.message : `[${region}] unknown region`) + "\n");
    requests++;
    return;
  }

  // A sensor submitting a reading.
  const value = parseFloat(parts[1]);
  if (Number.isNaN(value) || !REGION_NAMES.includes(region)) {
    socket.write("error: bad message\n");
    return;
  }
  const ok = store.setReading(region, type, value);
  if (ok) processed++;
  socket.write((ok ? "ok" : "error: unknown type") + "\n");
}

const server = net.createServer((socket) => {
  socket.setEncoding("utf8");
  let buffer = "";

  socket.on("data", (chunk) => {
    buffer += chunk;
    let idx;
    // Process every complete, newline-terminated message in the buffer.
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line) handleLine(socket, line);
    }
  });

  socket.on("error", () => {}); // ignore abrupt client disconnects
});

server.on("error", (e) => console.error("[service] server error:", e.message));

server.listen(port, () => {
  console.log(`[service] weather warning service listening on port ${port}`);
});

// Simple throughput counter so the load test's effect is visible.
setInterval(() => {
  console.log(`[service] readings stored: ${processed}, warnings served: ${requests}`);
}, 5000);
