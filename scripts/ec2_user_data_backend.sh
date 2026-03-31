#!/bin/bash
# Redirect all output to a log file for debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting EC2 User Data script for Backend..."

# 1. Update system and install required system dependencies
apt-get update -y
apt-get install -y git curl build-essential

# 2. Install Node.js 18 (matches the version in before_install.sh)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 3. Install PM2 globally
npm install -g pm2

# 4. Clone the repository and set up the application as the 'ubuntu' user
sudo -u ubuntu -i <<'EOF'
cd /home/ubuntu

# Remove the directory if it already exists to avoid clone errors on restart
rm -rf StellarCart-

# Clone the repository
# NOTE: If your repository is private, you will need to embed a Personal Access Token (PAT)
# Example: git clone https://<your-token>@github.com/1mp22is038-gif/StellarCart-.git
git clone https://github.com/1mp22is038-gif/StellarCart-.git

cd StellarCart-/Backend

# 5. Set up Environment Variables (.env)
# ⚠️ REPLACE THE PLACEHOLDERS BELOW WITH YOUR ACTUAL PRODUCTION VALUES
cat <<EOT > .env
NODE_ENV=production
PORT=5000
DATABASE_URL="your_production_postgresql_database_url_here"
JWT_SECRET="your_production_jwt_secret_here"
FRONTEND_URL="http://your-frontend-domain.com"
EOT

# 6. Install dependencies and set up Prisma
npm install
npx prisma generate

# Note: Automatically pushing schema changes to prod database with `db push` 
# might cause data loss if you have a complex schema. Using `prisma migrate deploy` is normally better for production.
npx prisma db push

# 7. Start the application with PM2
pm2 start src/index.js --name "stellar-backend"

# Save the PM2 process list so it can resurrect on reboot
pm2 save
EOF

# 8. Set up PM2 to start on system boot
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "Backend EC2 User Data script completed successfully!"
