#!/bin/bash
# Redirect all output to a log file for debugging
exec > >(tee /var/log/startup-script.log|logger -t startup -s 2>/dev/console) 2>&1

echo "Starting GCP Startup script for Backend..."

# 1. Create a dedicated application user
useradd -m -s /bin/bash appuser

# 2. Update system and install required system dependencies
apt-get update -y
apt-get install -y git curl build-essential

# 3. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 4. Install PM2 globally
npm install -g pm2

# 5. Clone repository, setup environment, and start app as appuser
sudo -u appuser -i <<'EOF'
cd /home/appuser

# 👉 FIX 1: Avoid deleting repo blindly. Clone if new, otherwise pull latest changes.
if [ ! -d "StellarCart-" ]; then
  git clone https://github.com/1mp22is038-gif/StellarCart-.git
  cd StellarCart-/Backend
else
  cd StellarCart-/Backend
  # Pull latest code in case MIG instance just restarted
  git pull origin main
fi

# 👉 FIX 2: Set up Environment Variables (.env) with Private GCP PostgreSQL IP
cat <<EOT > .env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://app_user:StrongAppPass123@10.10.1.3:5432/app_db"
JWT_SECRET="super-secret-key-1234"
FRONTEND_URL="*"
EOT

# Install strict dependencies only
npm install --omit=dev

# 👉 FIX 4: Add restart safety (Crucial for MIGs)
# Starts if new, restarts if the process already exists on the instance
pm2 start src/index.js --name "stellar-backend" || pm2 restart stellar-backend

# 👉 FIX 3 (Part A): Ensure pm2 state is saved for the appuser
pm2 save
EOF

# 👉 FIX 5: Ensure proper permissions recursively (Safety net)
chown -R appuser:appuser /home/appuser

# 👉 FIX 3 (Part B): Standardized PM2 Startup Command Issue
# Run as root (required to write to /etc/systemd), but explicitly tied to appuser.
# Using /usr/bin/pm2 guarantees it bypasses any generic PATH issues on GCP boot.
env PATH=$PATH:/usr/bin /usr/bin/pm2 startup systemd -u appuser --hp /home/appuser

echo "Backend GCP Startup script completed successfully!"
