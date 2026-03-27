#!/bin/bash
cd /home/ubuntu/StellarCart-/Backend
pm2 restart stellar-backend || pm2 start src/index.js --name "stellar-backend"
pm2 save
