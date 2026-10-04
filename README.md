# SIT314 6.2C - Above and Beyond Evidence

Author: Vu Hoang Nam Doan (224021565)

Source code for the SIT314 6.2C Above-and-Beyond task. Each module is a
self-contained project in its own folder, matching the modules in the
`module_evidence` submission document.

## Modules

| Folder | Module | What it is | Stack |
|--------|--------|------------|-------|
| `module-1/` | Module 1 | Weather-warning service extended with a realistic data model, TCP framing fix, a load test, and a `store.js` interface for a shared store | Node.js, TCP, MQTT |
| `module-2/` | Module 2 | Forest fire monitoring: 4 sensors over MQTT, alerts 4 receiver groups only when 2+ sensors read dangerous | Node.js, MQTT, Node-RED |
| `module-3/` | Module 3 | Smart seminar room HVAC: sensors + edge decision loop + HVAC node, logged to MongoDB Atlas | Node.js, Express, MongoDB |
| `module-4/` | Module 4 | Local weather web-service: full CRUD, latest reading, weather by location | Node.js, Express, MongoDB, weather-js |
| `module-5/` | Module 5 | Load-balanced deployment of the weather-service on AWS EC2 behind a load balancer | AWS EC2, ALB, Auto Scaling, MongoDB |

Module 6 is a written security analysis with no code, so it lives in the
submission document only and has no folder here.

## Code reused between modules

Module 5 deploys the Module 4 weather-service. To keep each folder complete and
runnable on its own, `module-5/weather-service/` holds its own copy of that
service (the `/healthcheck` endpoint it needs is already in `api.js`). The copy
is the source of truth for the Module 5 deployment; Module 4 remains the
standalone version. If you change the service, update both copies.

## Running each project

Each folder has its own `README.md` with setup and run steps. In general:

1. `cd` into the folder and run `npm install`.
2. For the Express projects (Modules 3, 4, 5), copy `.env.example` to `.env` and
   add your MongoDB connection string. The `.env` file is not committed.
3. Follow that folder's README.

## Notes

- `node_modules/` and `.env` are excluded from the repository. Run `npm install`
  to restore dependencies, and create `.env` from `.env.example`.
