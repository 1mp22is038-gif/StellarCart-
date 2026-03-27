#!/bin/bash
cd /home/ubuntu/StellarCart-/Backend
npm install --unsafe-perm
npx prisma generate
npx prisma db push
