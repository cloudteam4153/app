#!/bin/bash

# Deployment script for GCP Cloud Storage
# Bucket name: cloud-team-ui

BUCKET_NAME="cloud-team-ui"
PROJECT_ROOT="/Users/beverlyqin/Documents/CloudComputing/app/app"

# Try to find gcloud/gsutil in common locations
if [ -f "/opt/homebrew/share/google-cloud-sdk/bin/gsutil" ]; then
    GSUTIL="/opt/homebrew/share/google-cloud-sdk/bin/gsutil"
elif command -v gsutil &> /dev/null; then
    GSUTIL="gsutil"
else
    echo "❌ Error: gsutil not found. Please install Google Cloud SDK:"
    echo "   https://cloud.google.com/sdk/docs/install"
    echo "   Or: brew install --cask google-cloud-sdk"
    exit 1
fi

echo "🚀 Deploying to GCP Cloud Storage..."
echo "Bucket: $BUCKET_NAME"
echo ""

# Check if dist folder exists
if [ ! -d "$PROJECT_ROOT/dist" ]; then
    echo "❌ Error: dist folder not found. Please run 'npm run build' first."
    exit 1
fi

# Check authentication
if ! $GSUTIL ls gs://$BUCKET_NAME &> /dev/null; then
    echo "❌ Error: Not authenticated or no access to bucket."
    echo "   Please run: gcloud auth login"
    echo "   Then set your project: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "✅ Step 1: Configuring static website hosting..."
$GSUTIL web set -m index.html -e index.html gs://$BUCKET_NAME

echo "✅ Step 2: Making objects publicly readable..."
$GSUTIL iam ch allUsers:objectViewer gs://$BUCKET_NAME

echo "✅ Step 3: Uploading files..."
cd "$PROJECT_ROOT"
$GSUTIL -m cp -r dist/* gs://$BUCKET_NAME/

echo "✅ Step 4: Setting correct content types..."
$GSUTIL -m setmeta -h "Content-Type:text/html" gs://$BUCKET_NAME/*.html
$GSUTIL -m setmeta -h "Content-Type:text/css" gs://$BUCKET_NAME/*.css
$GSUTIL -m setmeta -h "Content-Type:application/javascript" gs://$BUCKET_NAME/*.js

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is available at:"
echo "   http://storage.googleapis.com/$BUCKET_NAME/index.html"
echo "   http://storage.googleapis.com/$BUCKET_NAME/"
echo ""
echo "📋 To verify website configuration:"
echo "   $GSUTIL web get gs://$BUCKET_NAME"

