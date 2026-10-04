# Scalable Weather Warning Service

SIT314 6.2C - Module 1 Above-and-Beyond task.
Author: Vu Hoang Nam Doan (224021565)

This project extends the Week 2 technical task (a TCP weather warning service) with
more realistic sensor data, demonstrates that it handles many sensors and many users at
once with consistent results, and improves the design for scalability.

## What was changed from Week 2

**Realistic sensor data (`dataModel.js`).** Week 2 sent flat random numbers. Here each
reading depends on the **month, the time of day and the region**: temperature follows a
seasonal curve (hotter in summer) and a daily curve (hotter in the afternoon), humidity
falls when it is hot and dry, and each Victorian district has its own climate. The warning
is based on a simple fire-danger index computed from temperature, wind, humidity and rain,
rather than the arbitrary rule in Week 2.

**A message-framing fix (`weatherService.js`).** TCP is a byte stream, so one `data` event
can carry several messages joined together or half a message. The Week 2 server assumed
one message per event, which corrupts parsing under load. This version buffers bytes and
splits on newlines, so every message is handled exactly once. The load test confirms this:
every reading sent is acknowledged.

**One clear source of truth (`store.js`).** All state goes through a small store interface,
so it could be swapped for a shared store (such as Redis) without touching the rest of the
code. This is the change needed to run several instances, and it is discussed in the report.

## Demonstrating scale (`loadTest.js`)

The load test opens many sensors across several regions streaming at the same time, then
fires many concurrent user requests for each region and checks they all get an identical
answer.

```
Phase 1: 20 sensors streaming ... readings sent / acknowledged: 480 / 480
Phase 2: 25 concurrent users query each region at the same time
  Mallee: 25 users, 1 distinct reply -> CONSISTENT
  ...
  consistency: ALL REGIONS CONSISTENT
```

This shows many sensors at once, many users at once (125 requests), and consistent
results (every user querying a region gets the same warning).

## Improved architecture (`mqtt/`)

The report proposes decoupling the sensors from the service with a **message broker**
(publish and subscribe) instead of direct TCP connections, so the service can run as
several workers that share the load. The `mqtt/` folder is a small proof-of-concept:
`mqttSensor.js` publishes readings to a broker, and `mqttService.js` subscribes and
computes the warning. Running more than one `mqttService.js` shows workers sharing the
messages, which a single TCP server cannot do.

## Setup

```bash
cd weather-warning-scalability
npm install
npm test        # data model + warning rule checks (6 pass)
```

## Running the demo

Start the service (one terminal):

```bash
npm run service
```

Start a few realistic sensors (a terminal each). Use SCENARIO=summer to drive a warning:

```bash
TYPE=temp     REGION=Mallee SCENARIO=summer node sensorNode.js
TYPE=humidity REGION=Mallee SCENARIO=summer node sensorNode.js
TYPE=wind     REGION=Mallee SCENARIO=summer node sensorNode.js
```

Ask for the warning (another terminal):

```bash
REGION=Mallee node warningClient.js
```

Run the scale demonstration:

```bash
npm run loadtest                 # current season
SCENARIO=summer npm run loadtest # summer, so warnings are issued
```

Optional, the improved-architecture proof-of-concept (needs internet for the public broker):

```bash
node mqtt/mqttService.js                 # start one or two workers
TYPE=temp REGION=Mallee SCENARIO=summer node mqtt/mqttSensor.js
```

## Evidence checklist (for the report)

1. `npm test` showing the 6 data-model checks pass.
2. A few sensors and a user running, the user receiving a warning (use SCENARIO=summer).
3. `SCENARIO=summer npm run loadtest` output: many sensors, 125 concurrent users,
   480/480 acknowledged, and ALL REGIONS CONSISTENT.
4. The MQTT proof-of-concept: one or two `mqttService.js` workers and a `mqttSensor.js`
   publishing, showing decoupled publish and subscribe.

## Files

```
weather-warning-scalability/
  dataModel.js        realistic data + fire-danger warning rule
  store.js            single source of truth for region state
  weatherService.js   improved TCP service (framing fix, validation)
  sensorNode.js       realistic sensor (month/time/region)
  warningClient.js    a user requesting warnings
  loadTest.js         many sensors + many users + consistency check
  mqtt/               improved-architecture proof-of-concept (broker + worker)
  test/dataModel.test.js
```
