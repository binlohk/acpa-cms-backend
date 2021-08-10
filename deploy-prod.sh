#!/bin/bash

# Exit on any error
set -ex

SCRIPT_SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

BUILD_DIR=$(mktemp -d)

cp -r "$SCRIPT_SRC_DIR" "$BUILD_DIR"/

cd "$BUILD_DIR"

# shellcheck disable=SC2046
cd $(basename "$SCRIPT_SRC_DIR")

# Clear all build directories for a fresh build
rm -rf ./build
rm -rf ./.tmp

# hack to preserve .env
cp .env env.tmp
git clean -fdx
mv env.tmp .env

# Build it
npm install
npm run build --clean
ls -a

rsync -avzr . ubuntu@174.138.20.136:~/deploy-production/acpa-cms-backend

## Deploy nginx and pm2 config
rsync -v --rsync-path="sudo rsync" --chown=root:root --chmod=0644 ./deployment/app.acpa.training ubuntu@174.138.20.136:/etc/nginx/sites-available/app.acpa.training
rsync -v --rsync-path="sudo rsync" --chown=ubuntu:ubuntu --chmod=0644 ./deployment/ecosystem.config.js ubuntu@174.138.20.136:/home/ubuntu/deploy-production/ecosystem.config.js

ssh ubuntu@174.138.20.136 "pm2 restart /home/ubuntu/deploy-production/ecosystem.config.js && sudo nginx -s reload"


