# Local Weather Web-Service

SIT314 6.2C - Module 4 Above-and-Beyond task.
Author: Vu Hoang Nam Doan (224021565)

A local weather web-service built with **Node.js**, **Express** and **MongoDB Atlas**,
extending the Week 7 and Week 8 technical tasks. It accepts temperature reading
submissions, stores them in the database, and serves them back to clients. It keeps a
record of the latest reading, and it looks up live weather for a map location using the
`weather-js` module.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/temps` | Create a temperature reading |
| GET | `/temps` | Read all readings, newest first (`?location`, `?count`) |
| GET | `/temps/latest` | Read the latest reading |
| GET | `/temps/:id` | Read one reading |
| PUT | `/temps/:id` | Update a reading |
| DELETE | `/temps/:id` | Delete a reading |
| GET | `/weather?location=Melbourne` | Live weather for a location |

Every response uses the same shape: `{ status, data, timestamp }`.

## How it works

`api.js` is an Express server. Each CRUD route reads or writes the `readings` collection
in MongoDB Atlas through Mongoose (`db.js`). The API also keeps the latest reading in
memory, updated whenever a reading is created, updated or deleted, so `GET /temps/latest`
is always current. The weather lookup (`weather.js`) uses the `weather-js` module first,
as the task specifies. Because `weather-js` scrapes MSN Weather and often returns nothing
now, it falls back to the free Open-Meteo API so the endpoint always returns real data.

`client.js` is a demonstration client that runs through every operation in order and
prints the results.

## Setup

```bash
cd weather-service
npm install                 # installs express, mongoose, dotenv, weather-js
cp .env.example .env        # then edit .env
```

Open `.env` and paste your MongoDB Atlas connection string (you can reuse the cluster
from the Week 5 task):

```
MONGODB_URI=mongodb+srv://USER:PASS@YOURCLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=sit314_weather
```

## Running

Start the API (one terminal):

```bash
npm start
```

Run the client (a second terminal):

```bash
npm run client
```

The client creates two readings, reads them all, reads the latest, reads one, updates it,
deletes it, and finishes with a weather lookup, printing each result.

## Trying the endpoints by hand

You can also use curl or a browser:

```bash
# create a reading
curl -X POST http://localhost:3000/temps \
  -H "Content-Type: application/json" \
  -d '{"location":"Melbourne, AU","temperature":24.5,"sensorId":"sensor_a"}'

# read all, latest, and one
curl http://localhost:3000/temps
curl http://localhost:3000/temps/latest
curl http://localhost:3000/temps/PASTE_AN_ID

# update and delete
curl -X PUT http://localhost:3000/temps/PASTE_AN_ID -H "Content-Type: application/json" -d '{"temperature":31}'
curl -X DELETE http://localhost:3000/temps/PASTE_AN_ID

# weather for a location
curl "http://localhost:3000/weather?location=Sydney"
```

## Evidence checklist (for the write-up)

1. `npm start` showing the API connected to MongoDB Atlas.
2. `npm run client` output showing the full run: create, read all, read latest, read one,
   update, read after update, delete, read after delete.
3. The `GET /temps/latest` result, showing the latest reading is tracked.
4. The `GET /weather?location=...` result, showing live weather for a location.
5. The MongoDB Atlas `readings` collection with the stored documents.
6. Optional: a browser hitting `GET /temps` to show the JSON response format.

## Files

```
weather-service/
  api.js            Express server: CRUD, latest tracking, weather endpoint
  db.js             MongoDB Atlas connection + Reading model
  weather.js        weather-js lookup with Open-Meteo fallback
  respond.js        standard response helper
  client.js         demonstration client
  config.js         port, database and default location
  .env.example      template for your Atlas URI
```
