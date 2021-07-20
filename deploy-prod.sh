#!/bin/bash

# Exit on any error
set -ex

export NODE_ENV=production

SCRIPT_SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

BUILD_DIR=$(mktemp -d)

cp -r "$SCRIPT_SRC_DIR" "$BUILD_DIR"/

cd "$BUILD_DIR"

# shellcheck disable=SC2046
cd $(basename "$SCRIPT_SRC_DIR")

# Clear all build directories for a fresh build
rm -rf ./build
rm -rf ./.tmp
git clean -fdx

# Build it
npm install
npm run build

rsync -avzr . ubuntu@174.138.20.136:~/deploy-production/acpa-cms-backend

ssh ubuntu@174.138.20.136 "pm2 restart /home/ubuntu/deploy-production/ecosystem.config.js"
