# Forest Fire Monitoring and Alarm System

SIT314 6.2C - Module 2 Above-and-Beyond task.
Author: Vu Hoang Nam Doan (224021565)

A prototype forest fire monitoring and alarm system built with **Node.js**, **MQTT**
and **Node-RED**, extending the Week 4 technical task. Four simulated sensors report
heat, smoke and fire; Node-RED applies the alarm rules and alerts four audiences, but
only when **two or more** sensors are dangerous at the same time. A single sensor
never raises an alarm.

## How it works

```
 sensor_north ┐
 sensor_east  ├─▶ MQTT topics ─▶ Node-RED ─▶ alert topics ─▶ home owners
 sensor_south │   sit314/nam/    (rules:      sit314/nam/     fire service
 sensor_west  ┘   forest/        2+ sensors)  forest/alerts/  news orgs
                  sensors/+                                    social media ─▶ IFTTT
```

- **Sensors** (`sensors/forestSensor.js`): one script, run four times with different
  `SENSOR_ID` values. Each publishes a JSON reading `{id, heat, smoke, fire, ts}`
  every 2 seconds. Set `SCENARIO=fire` to make a sensor report a fire.
- **Node-RED** (`node-red/flow.json`): subscribes to all sensors, keeps each sensor's
  latest state, and raises an alert only when 2+ fresh sensors are dangerous. It
  publishes the alert to four topics and posts the social-media alert to a real IFTTT
  webhook.
- **Receivers** (`receivers/*.js`): four subscribers, one per audience, that print the
  alert they receive.

## The alarm rules

A sensor reading is **dangerous** when heat > 50 C **and** smoke > 60, or when the
flame flag is set. An **official alert** is raised only when **2 or more** dangerous
sensors are seen within the last 10 seconds. These values live in `config.js` and are
mirrored in the Node-RED `Assess fleet` function.

## Setup

```bash
cd forest-fire
npm install          # installs mqtt
npm test             # runs the rule checks (should print "All 8 checks passed")
```

Install and start Node-RED (once):

```bash
sudo npm install -g --unsafe-perm node-red   # Windows: drop sudo
node-red                                      # opens http://127.0.0.1:1880
```

Import the flow: in Node-RED, menu (top right) -> Import -> select
`node-red/flow.json` -> Import -> **Deploy**.

Optional network check: `node _rt.js` confirms your machine can reach the broker.

## Running the demo

Open several terminals in the `forest-fire` folder.

**1. Start the four receivers (one terminal each):**

```bash
npm run homeowners
npm run fireservice
npm run news
npm run social
```

**2. Start four sensors, all normal at first (one terminal each):**

```bash
SENSOR_ID=sensor_north node sensors/forestSensor.js
SENSOR_ID=sensor_east  node sensors/forestSensor.js
SENSOR_ID=sensor_south node sensors/forestSensor.js
SENSOR_ID=sensor_west  node sensors/forestSensor.js
```

With all sensors normal, the Node-RED **Decision log** shows `alert=false` and the
receivers stay quiet.

**3. Show the single-sensor rule.** Stop `sensor_north` and restart it in fire mode:

```bash
SENSOR_ID=sensor_north SCENARIO=fire node sensors/forestSensor.js
```

Only one sensor is dangerous, so the Decision log shows `dangerous=1 ... alert=false`
and **no alert is sent**. This proves a single sensor cannot cause an alarm.

**4. Trigger a real alert.** Restart a second sensor in fire mode:

```bash
SENSOR_ID=sensor_east SCENARIO=fire node sensors/forestSensor.js
```

Now two sensors are dangerous. The Decision log shows `alert=true`, and all four
receiver terminals print their alert. The alert re-publishes about every 15 seconds
while the condition holds.

## IFTTT (social media) setup

The `IFTTT webhook` node posts the social-media alert to a real IFTTT applet.

1. In IFTTT, create an applet: **If** Webhooks "Receive a web request" (event name,
   e.g. `forest_fire`) **Then** your action (post to X, send a notification, etc.).
2. Get your key from <https://ifttt.com/maker_webhooks> -> Documentation.
3. In Node-RED, open the `IFTTT webhook` node and set the URL to:
   `https://maker.ifttt.com/trigger/forest_fire/with/key/YOUR_KEY`
4. Deploy. The applet fires whenever an alert is raised.
   The webhook sends `value1` = number of dangerous sensors, `value2` = sensor IDs,
   `value3` = time.

## Evidence checklist (for the write-up)

Capture screenshots of:

1. The Node-RED flow (the whole canvas).
2. Four sensors running normally + Decision log showing `alert=false`.
3. One sensor in fire mode + Decision log `dangerous=1 ... alert=false` (single-sensor
   rule, no alert sent).
4. Two sensors in fire mode + Decision log `alert=true`.
5. All four receiver terminals printing their alert.
6. The IFTTT notification/post that resulted.

## Files

```
forest-fire/
  config.js               shared broker, topics, thresholds
  detection.js            pure alarm rules (unit tested)
  sensors/forestSensor.js one sensor, run 4x
  receivers/              home owners, fire service, news, social
  node-red/flow.json      importable Node-RED flow
  test/detection.test.js  rule checks
  _rt.js                  optional connectivity check
```
