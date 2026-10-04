# Load-Balanced MongoDB API on Amazon EC2

SIT314 6.2C - Module 5 Above-and-Beyond task.
Author: Vu Hoang Nam Doan (224021565)

This task deploys the Module 4 weather-service (the CRUD-to-MongoDB bridge) onto Amazon
EC2, replicated across two instances behind a load balancer, with MongoDB self-hosted on
its own EC2 instance. Sensors and clients send requests to the load balancer, which
spreads them across the two API instances.

## Architecture

```
 clients / sensors ─▶ Application Load Balancer ─┬─▶ EC2 API instance 1 ─┐
                        (port 80)                └─▶ EC2 API instance 2 ─┴─▶ EC2 MongoDB
```

- Two EC2 instances run the same weather-service API on port 3000.
- One EC2 instance runs MongoDB, shared by both API instances.
- An Application Load Balancer (ALB) receives all traffic and forwards it to whichever
  API instance is free, using `GET /healthcheck` to know which instances are healthy.

## What was reused and added

The API is the Module 4 `weather-service`, unchanged except for one addition: a
`GET /healthcheck` endpoint that returns the instance's hostname.

```js
app.get("/healthcheck", (req, res) =>
  send(res, 200, { status: "ok", server: os.hostname() })
);
```

The load balancer uses this endpoint for health checks, and because the response
contains the hostname, calling it through the load balancer shows which instance
answered. That is how the load balancing is demonstrated.

## Security groups

Create three security groups first, so the parts can talk to each other but nothing
extra is exposed:

- **alb-sg** (load balancer): inbound HTTP port 80 from anywhere (0.0.0.0/0).
- **api-sg** (API instances): inbound port 3000 from **alb-sg** only, and port 22 (SSH)
  from your IP.
- **mongo-sg** (database): inbound port 27017 from **api-sg** only, and port 22 from your IP.

## Part A: the MongoDB instance

1. Launch an EC2 instance: Ubuntu 22.04, t3.micro, security group **mongo-sg**, your key pair.
2. SSH in, copy `scripts/setup-mongo-instance.sh` across, and run it with `sudo`.
3. When it finishes, run `mongosh` and create the application user it prints (choose a real
   password).
4. Note the instance's **private IP**. The API instances will connect to it.

## Part B: the two API instances

Do these steps on each of the two instances.

1. Launch an EC2 instance: Ubuntu 22.04, t3.micro, security group **api-sg**, your key pair.
   Launch two of them (or launch one, then "Launch more like this").
2. Copy the `weather-service` folder to the instance:
   `scp -i key.pem -r weather-service ubuntu@<INSTANCE_PUBLIC_IP>:~/`
3. SSH in, edit `scripts/setup-api-instance.sh` to set `MONGO_PRIVATE_IP` and
   `MONGO_PASSWORD`, then run it with `sudo`. It installs Node.js, installs the app,
   writes the `.env`, and starts the API as a service.
4. Check it works locally on the instance:
   `curl http://localhost:3000/healthcheck` should return the instance hostname.

## Part C: the load balancer

1. Create a **target group** (type: Instances, protocol HTTP, port 3000). Set the health
   check path to `/healthcheck`. Register both API instances.
2. Create an **Application Load Balancer** (internet-facing), security group **alb-sg**,
   listener on HTTP port 80 forwarding to the target group.
3. Wait until both targets show **healthy** in the target group.

## Part D: demonstrate it working

Copy the load balancer's DNS name from the AWS console (looks like
`sit314-alb-1234.ap-southeast-2.elb.amazonaws.com`).

1. Confirm the service answers through the load balancer:
   `curl http://<load-balancer-dns>/healthcheck`
2. Run the load-balance test, which calls the load balancer many times and counts which
   instance answered each request:
   `node lbTest.js http://<load-balancer-dns> 20`
   You should see both instance hostnames appear, which proves the requests are being
   spread across the two instances.
3. Simulate a sensor uploading data through the load balancer:
   `node sensorClient.js http://<load-balancer-dns> 2000`
   Then read it back: `curl http://<load-balancer-dns>/temps`
4. Check the shared database has the readings from both instances.

## Evidence checklist (for the write-up)

1. The two API instances and the MongoDB instance running in the EC2 console.
2. The three security groups.
3. The target group showing both instances **healthy**.
4. The load balancer with its listener and DNS name.
5. `curl .../healthcheck` returning a hostname (run it twice to catch two different names),
   or the output of `node lbTest.js` showing the distribution across both instances.
6. `node sensorClient.js` sending readings through the load balancer.
7. `curl .../temps` (or the database) showing the stored readings.

## Cleanup (important)

To avoid charges after capturing evidence: delete the load balancer and target group,
then terminate the three EC2 instances.

## Files

```
module5-loadbalancing/
  lbTest.js         calls the load balancer repeatedly and tallies which instance answered
  sensorClient.js   simulates a sensor uploading readings through the load balancer
  scripts/
    setup-mongo-instance.sh   install and configure MongoDB on its EC2 instance
    setup-api-instance.sh     install and run the API on each API EC2 instance
    weather-api.service       systemd unit so the API starts on boot
```

The API code itself is in `./weather-service` (the Module 4 service, with `/healthcheck` added).
