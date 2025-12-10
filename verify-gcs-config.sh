#!/bin/bash

# Script to verify GCS bucket configuration
BUCKET_NAME="unified-inbox-app-1765383702"

# Try to find gcloud/gsutil in common locations
if [ -f "$HOME/google-cloud-sdk/bin/gsutil" ]; then
    GSUTIL="$HOME/google-cloud-sdk/bin/gsutil"
elif [ -f "/opt/homebrew/share/google-cloud-sdk/bin/gsutil" ]; then
    GSUTIL="/opt/homebrew/share/google-cloud-sdk/bin/gsutil"
elif command -v gsutil &> /dev/null; then
    GSUTIL="gsutil"
else
    echo "❌ Error: gsutil not found."
    exit 1
fi

echo "🔍 Verifying GCS Bucket Configuration..."
echo "Bucket: $BUCKET_NAME"
echo ""

echo "📋 1. Website Configuration:"
$GSUTIL web get gs://$BUCKET_NAME
echo ""

echo "📋 2. IAM Permissions (checking if allUsers has access):"
$GSUTIL iam get gs://$BUCKET_NAME | grep -A 5 "allUsers" || echo "   ⚠️  allUsers not found in IAM - bucket may not be public"
echo ""

echo "📋 3. Files in bucket:"
$GSUTIL ls -lh gs://$BUCKET_NAME/
echo ""

echo "📋 4. index.html metadata:"
$GSUTIL stat gs://$BUCKET_NAME/index.html
echo ""

echo "📋 5. Testing public access to index.html:"
curl -s -I "http://storage.googleapis.com/$BUCKET_NAME/index.html" | head -5
echo ""

echo "📋 6. Testing public access to root path:"
curl -s -I "http://storage.googleapis.com/$BUCKET_NAME/" | head -5
echo ""

echo "✅ Verification complete!"
