# Smart Seminar Room HVAC System

SIT314 6.2C - Module 3 Above-and-Beyond task.
Author: Vu Hoang Nam Doan (224021565)

A prototype smart seminar room air-conditioning system built with **Node.js**,
**Express** and **MongoDB Atlas**, extending the Week 5 and Week 6 technical tasks.
Room sensors report the environment and activity, an edge node decides the HVAC
setting from both, and the HVAC node applies it. Every request and status change is
logged to MongoDB Atlas.

## How it works

```
 environment sensors ─(POST /environment)─┐
   temp + humidity                        │
                                          ▼
 chair sensors ───────(POST /chair)────▶ EDGE NODE ──(POST /control)──▶ HVAC NODE
   occupancy                              │  decides every 15s            sets mode,
                                          │  from temp, humidity,         fan, target
                                          ▼  and occupancy
                                    MongoDB Atlas
                                    (requests + status changes)
```

All nodes talk over HTTP, which suits this task's low data rate and relaxed timing.

## Components

**Environment sensors** (`sensors/environmentSensor.js`): report temperature and
humidity to the edge node every 3 seconds. Run more than one for redundancy; the edge
averages them. A `SCENARIO` flag (`normal`, `hot`, `cold`, `humid`) sets the conditions.

**Chair sensors** (`sensors/chairSensor.js`): each represents one chair and reports when
a person sits on or leaves it. A `SCENARIO` flag (`auto`, `occupied`, `empty`) controls
behaviour; `auto` toggles occupancy on its own to mimic people coming and going.

**Edge node** (`edge/edgeNode.js`): accepts sensor readings, keeps the current room
state (average temperature, average humidity, occupied chairs), and every 15 seconds
decides the HVAC command and sends it to the HVAC node. It logs every sensor request
and every control cycle to MongoDB Atlas.

**HVAC node** (`hvac/hvacNode.js`): receives the command on `POST /control` and
simulates the unit by printing the mode, fan speed, target temperature and dehumidify
state.

## Decision rules

The edge decides from both the environment and the activity (`decision.js`):

- **Room empty** (no chairs in use): HVAC **off**, to save energy.
- **Occupied and too warm** (over 24 C): **cool**.
- **Occupied and too cold** (under 19 C): **heat**.
- **Occupied and comfortable**: **ventilate** only.
- **Humidity high** (over 60%): turn on **dehumidify** and raise the fan.
- **Fan speed scales with occupancy**: a fuller room gets a stronger fan.

These values are in `config.js` and are covered by unit tests in `test/decision.test.js`.

## Setup

```bash
cd hvac-seminar-room
npm install                 # installs express, mongoose, dotenv
cp .env.example .env        # then edit .env
```

Open `.env` and paste your MongoDB Atlas connection string (you can reuse the cluster
from the Week 5 task):

```
MONGODB_URI=mongodb+srv://USER:PASS@YOURCLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=sit314_hvac
```

Check the rules pass:

```bash
npm test                    # should print "All 6 checks passed"
```

## Running the demo

Open a terminal per node, all in the `hvac-seminar-room` folder.

**1. Start the HVAC node:**

```bash
npm run hvac
```

**2. Start the edge node** (connects to Atlas, starts the 15s control loop):

```bash
npm run edge
```

**3. Start two environment sensors** (redundancy):

```bash
SENSOR_ID=env_a node sensors/environmentSensor.js
SENSOR_ID=env_b node sensors/environmentSensor.js
```

**4. Start a few chair sensors:**

```bash
CHAIR_ID=chair_1 SCENARIO=occupied node sensors/chairSensor.js
CHAIR_ID=chair_2 SCENARIO=occupied node sensors/chairSensor.js
CHAIR_ID=chair_3 SCENARIO=empty    node sensors/chairSensor.js
```

Within 15 seconds the edge prints the room state and the command, and the HVAC node
prints the setting it applied.

### Scenarios to show

- **Empty room -> off:** run all chairs with `SCENARIO=empty`. The edge sends `off`.
- **Warm and occupied -> cool:** environment sensors with `SCENARIO=hot`, chairs
  `occupied`. The edge sends `cool` with a fan speed that grows as more chairs fill.
- **Cold and occupied -> heat:** environment sensors with `SCENARIO=cold`.
- **Humid -> dehumidify:** environment sensors with `SCENARIO=humid`. The command
  turns on `dehumidify` and raises the fan.

## Checking the log and state

- `GET http://localhost:3000/status` shows the current room state.
- `GET http://localhost:3000/logs?limit=20` shows the most recent log entries.
- In MongoDB Atlas, open the `sit314_hvac` database, `logs` collection, to see the
  `sensor` and `control` documents.

## Evidence checklist (for the write-up)

1. `npm test` output showing all 6 rule checks pass.
2. All five nodes running (HVAC, edge, two environment sensors, chair sensors) with the
   edge printing state and command.
3. The edge log showing a decision, for example `cool (fan 2) [CHANGED]`.
4. A scenario change: empty room -> `off`, and warm+occupied -> `cool`.
5. The humid scenario turning on `dehumidify`.
6. The MongoDB Atlas `logs` collection showing `sensor` and `control` documents.
7. `GET /status` and `GET /logs` responses in the browser or terminal.

## Endpoints

| Node | Method | Path | Purpose |
|------|--------|------|---------|
| Edge | POST | `/environment` | Receive a temperature + humidity reading |
| Edge | POST | `/chair` | Receive a chair occupancy change |
| Edge | GET | `/status` | Current room state |
| Edge | GET | `/logs` | Recent log entries |
| HVAC | POST | `/control` | Set the HVAC configuration |
| HVAC | GET | `/status` | Current HVAC configuration |

Every response uses the same shape: `{ status, data, timestamp }`.

## Files

```
hvac-seminar-room/
  config.js                 shared ports, endpoints, thresholds, control cadence
  decision.js               pure HVAC decision logic (unit tested)
  db.js                     MongoDB Atlas connection + Log model
  respond.js                standard response helper
  edge/edgeNode.js          edge node (endpoints, control loop, logging)
  hvac/hvacNode.js          HVAC actuator node
  sensors/environmentSensor.js   temperature + humidity sensor
  sensors/chairSensor.js         chair occupancy sensor
  test/decision.test.js     rule checks
  .env.example              template for your Atlas URI
```
