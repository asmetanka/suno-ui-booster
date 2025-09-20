#!/bin/bash

# Suno UI Booster Firefox Extension Builder
# This script packages the Firefox extension for installation

echo "Building Suno UI Booster Firefox Extension..."

# Remove any existing build files
rm -f ../suno-ui-booster-ff.xpi

# Create the XPI package (Firefox extension format)
zip -r ../suno-ui-booster-ff.xpi . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.DS_Store" \
  -x "build.sh" \
  -x "package.json"

if [ $? -eq 0 ]; then
    echo "✅ Firefox extension built successfully!"
    echo "📦 Package: ../suno-ui-booster-ff.xpi"
    echo ""
    echo "To install:"
    echo "1. Open Firefox"
    echo "2. Go to about:addons"
    echo "3. Click the gear icon and select 'Install Add-on From File...'"
    echo "4. Select the suno-ui-booster-ff.xpi file"
else
    echo "❌ Build failed!"
    exit 1
fi
