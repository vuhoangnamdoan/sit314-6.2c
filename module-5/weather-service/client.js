// client.js
// Demonstrates the weather service by running through every operation in order:
// create, read all, read latest, read one, update, delete, and a weather lookup.
// Run the API first (npm start), then run this in another terminal (npm run client).

const BASE = `http://localhost:${process.env.PORT || 3000}`;

// Small helper: call the API and return the parsed JSON, printing a heading.
async function call(label, method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  console.log(`\n=== ${label} (${method} ${path}) -> ${res.status} ===`);
  console.log(JSON.stringify(json.data, null, 2));
  return json.data;
}

async function main() {
  // CREATE two readings. The second becomes the latest.
  const first = await call("CREATE reading 1", "POST", "/temps", {
    location: "Melbourne, AU",
    temperature: 23.5,
    sensorId: "sensor_a",
  });
  await call("CREATE reading 2", "POST", "/temps", {
    location: "Melbourne, AU",
    temperature: 26.1,
    sensorId: "sensor_b",
  });

  // READ all readings.
  await call("READ all", "GET", "/temps");

  // READ the latest reading.
  await call("READ latest", "GET", "/temps/latest");

  const id = first._id;

  // READ one by id.
  await call("READ one", "GET", `/temps/${id}`);

  // UPDATE that reading.
  await call("UPDATE reading 1", "PUT", `/temps/${id}`, { temperature: 30.0 });

  // READ it again to confirm the update.
  await call("READ one (after update)", "GET", `/temps/${id}`);

  // DELETE that reading.
  await call("DELETE reading 1", "DELETE", `/temps/${id}`);

  // READ all again to confirm it is gone.
  await call("READ all (after delete)", "GET", "/temps");

  // WEATHER for a map location.
  await call("WEATHER lookup", "GET", "/weather?location=Melbourne");

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("client error:", e.message);
  console.error("Is the API running? Start it with: npm start");
  process.exit(1);
});
