#!/bin/bash

# Deployment script for GCP Cloud Storage
# Bucket name: cloud-team-ui

BUCKET_NAME="unified-inbox-app-1765383702"
PROJECT_ROOT="/Users/beverlyqin/Documents/CloudComputing/app/app"

# Try to find gcloud/gsutil in common locations
if [ -f "$HOME/google-cloud-sdk/bin/gsutil" ]; then
    GSUTIL="$HOME/google-cloud-sdk/bin/gsutil"
elif [ -f "/opt/homebrew/share/google-cloud-sdk/bin/gsutil" ]; then
    GSUTIL="/opt/homebrew/share/google-cloud-sdk/bin/gsutil"
elif command -v gsutil &> /dev/null; then
    GSUTIL="gsutil"
else
    echo "❌ Error: gsutil not found. Please install Google Cloud SDK:"
    echo "   https://cloud.google.com/sdk/docs/install"
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

echo "✅ Step 3: Cleaning up old asset files..."
# Delete old JS files (keep CSS as it's less likely to change frequently)
# Get list of current JS files in dist to know what to keep
cd "$PROJECT_ROOT"
CURRENT_JS_FILE=$(ls dist/assets/*.js 2>/dev/null | xargs -n1 basename | head -1)
if [ -n "$CURRENT_JS_FILE" ]; then
    echo "   Keeping: $CURRENT_JS_FILE"
    # Delete all JS files except the current one
    $GSUTIL ls gs://$BUCKET_NAME/assets/*.js 2>/dev/null | while read old_file; do
        old_filename=$(basename "$old_file")
        if [ "$old_filename" != "$CURRENT_JS_FILE" ]; then
            echo "   Deleting old file: $old_filename"
            $GSUTIL rm "$old_file" 2>/dev/null || true
        fi
    done
else
    echo "   No JS files found in dist, skipping cleanup"
fi

echo "✅ Step 4: Uploading files with cache-control headers..."
cd "$PROJECT_ROOT"
# Upload with aggressive no-cache headers to prevent caching issues
$GSUTIL -m -h "Cache-Control:no-cache, no-store, must-revalidate, max-age=0" cp -r dist/* gs://$BUCKET_NAME/

echo "✅ Step 5: Setting correct content types and cache headers..."
# Set content types and cache headers for all files
$GSUTIL -m setmeta -h "Content-Type:text/html" -h "Cache-Control:no-cache, no-store, must-revalidate, max-age=0" gs://$BUCKET_NAME/*.html

# Set for CSS files
for css_file in $(cd "$PROJECT_ROOT" && find dist -name "*.css"); do
    css_basename=$(basename "$css_file")
    $GSUTIL setmeta -h "Content-Type:text/css" -h "Cache-Control:no-cache, no-store, must-revalidate, max-age=0" "gs://$BUCKET_NAME/assets/$css_basename" 2>/dev/null || true
done

# Set for JS files
for js_file in $(cd "$PROJECT_ROOT" && find dist -name "*.js"); do
    js_basename=$(basename "$js_file")
    $GSUTIL setmeta -h "Content-Type:application/javascript" -h "Cache-Control:no-cache, no-store, must-revalidate, max-age=0" "gs://$BUCKET_NAME/assets/$js_basename" 2>/dev/null || true
done

echo "✅ Step 6: Verifying upload..."
# Verify index.html exists and has correct content
if $GSUTIL ls gs://$BUCKET_NAME/index.html &> /dev/null; then
    echo "   ✓ index.html uploaded successfully"
    # Check if it references the current JS file
    if [ -n "$CURRENT_JS_FILE" ]; then
        if $GSUTIL cat gs://$BUCKET_NAME/index.html | grep -q "$CURRENT_JS_FILE"; then
            echo "   ✓ index.html references correct JS file: $CURRENT_JS_FILE"
        else
            echo "   ⚠️  Warning: index.html may not reference the latest JS file"
        fi
    fi
else
    echo "   ❌ Error: index.html not found after upload"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is available at:"
echo "   http://storage.googleapis.com/$BUCKET_NAME/index.html"
echo "   http://storage.googleapis.com/$BUCKET_NAME/"
echo ""
echo "⚠️  IMPORTANT: Due to GCS caching, use this cache-busting URL:"
echo "   http://storage.googleapis.com/$BUCKET_NAME/index.html?v=latest"
echo "   (Bookmark this URL to always get the latest version)"
echo ""
echo "📋 To verify website configuration:"
echo "   $GSUTIL web get gs://$BUCKET_NAME"

