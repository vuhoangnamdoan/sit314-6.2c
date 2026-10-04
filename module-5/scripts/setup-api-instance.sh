#!/usr/bin/env bash
# setup-api-instance.sh
# Installs Node.js and the weather-service API on an Ubuntu 22.04 EC2 instance,
# then starts it as a service. Run this on EACH of the two API instances.
#
# Before running, copy the weather-service folder to the instance, for example:
#   scp -i key.pem -r weather-service ubuntu@<INSTANCE_PUBLIC_IP>:~/
# Then on the instance:
#   chmod +x setup-api-instance.sh && sudo ./setup-api-instance.sh
#
# Set these two variables first (the MongoDB instance's PRIVATE IP and password):
MONGO_PRIVATE_IP="CHANGE_ME"
MONGO_PASSWORD="CHANGE_ME"

set -e
APP_DIR="/home/ubuntu/weather-service"

echo "== Installing Node.js 20 =="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "== Installing app dependencies =="
cd "$APP_DIR"
npm install --omit=dev

echo "== Writing .env =="
cat > "$APP_DIR/.env" <<EOF
MONGODB_URI=mongodb://appuser:${MONGO_PASSWORD}@${MONGO_PRIVATE_IP}:27017/?authSource=admin
MONGODB_DB=sit314_weather
PORT=3000
EOF

echo "== Installing systemd service so the API starts on boot =="
sudo cp "$APP_DIR/../module5-loadbalancing/scripts/weather-api.service" /etc/systemd/system/weather-api.service 2>/dev/null || \
  sudo tee /etc/systemd/system/weather-api.service > /dev/null <<'UNIT'
[Unit]
Description=SIT314 Weather API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/weather-service
ExecStart=/usr/bin/node api.js
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable weather-api
sudo systemctl restart weather-api

echo ""
echo "== Done. Check it is running: =="
echo "  systemctl status weather-api"
echo "  curl http://localhost:3000/healthcheck"
