#!/usr/bin/env bash
# setup-mongo-instance.sh
# Installs and configures MongoDB on an Ubuntu 22.04 EC2 instance so the two API
# instances can use it as a shared database. Run on the MongoDB instance:
#   chmod +x setup-mongo-instance.sh && sudo ./setup-mongo-instance.sh
#
# After it finishes, follow the printed steps to create the application user.

set -e

echo "== Installing MongoDB 7.0 on Ubuntu 22.04 =="
sudo apt-get update
sudo apt-get install -y gnupg curl

# Add the MongoDB package key and repository.
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

# Make MongoDB listen on all interfaces so the API instances can reach it, and
# turn on authentication.
echo "== Configuring MongoDB to listen on all interfaces and require auth =="
sudo sed -i 's/^  bindIp:.*/  bindIp: 0.0.0.0/' /etc/mongod.conf
if ! grep -q "^security:" /etc/mongod.conf; then
  echo -e "security:\n  authorization: enabled" | sudo tee -a /etc/mongod.conf
fi

sudo systemctl enable mongod
sudo systemctl restart mongod

echo ""
echo "== Done. Now create the application user =="
echo "Run:  mongosh"
echo "Then paste:"
echo '  use admin'
echo '  db.createUser({ user: "appuser", pwd: "CHANGE_ME", roles: [ { role: "readWriteAnyDatabase", db: "admin" } ] })'
echo ""
echo "Your API instances will then use this connection string (private IP of THIS instance):"
echo '  MONGODB_URI=mongodb://appuser:CHANGE_ME@<THIS_PRIVATE_IP>:27017/?authSource=admin'
echo '  MONGODB_DB=sit314_weather'
