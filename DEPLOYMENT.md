# Deployment Guide: Frontend to GCP Cloud Storage

## Prerequisites

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # macOS with Homebrew
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   
   # Add to PATH (add to ~/.zshrc or ~/.bash_profile):
   export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"
   ```

2. **Authenticate with GCP** (REQUIRED before deployment):
   ```bash
   # Authenticate (will open browser)
   /opt/homebrew/share/google-cloud-sdk/bin/gcloud auth login
   
   # Set your GCP project
   /opt/homebrew/share/google-cloud-sdk/bin/gcloud config set project YOUR_PROJECT_ID
   
   # Verify authentication
   /opt/homebrew/share/google-cloud-sdk/bin/gcloud auth list
   ```

## Deployment Steps

### Step 1: Build the Application ✅ (Already completed)
```bash
npm install
npm run build
```

### Step 2: Create GCS Bucket ✅ (Already completed)
- Bucket name: `cloud-team-ui`
- Created via GCP Console

### Step 3: Configure Bucket Settings

Run these commands to configure static website hosting:

```bash
# Configure static website hosting (main page and error page both set to index.html for React Router)
gsutil web set -m index.html -e index.html gs://cloud-team-ui

# Make all objects publicly readable
gsutil iam ch allUsers:objectViewer gs://cloud-team-ui
```

**Note:** The bucket itself can remain "Not public" - we're only making the objects (files) inside publicly readable, which is the recommended security practice.

### Step 4: Upload Build Files

```bash
# Navigate to project root
cd /Users/beverlyqin/Documents/CloudComputing/app/app

# Upload all files from dist/ to the bucket
gsutil -m cp -r dist/* gs://cloud-team-ui/

# Set correct content types for proper file serving
gsutil -m setmeta -h "Content-Type:text/html" gs://cloud-team-ui/*.html
gsutil -m setmeta -h "Content-Type:text/css" gs://cloud-team-ui/*.css
gsutil -m setmeta -h "Content-Type:application/javascript" gs://cloud-team-ui/*.js
```

### Step 5: Verify Deployment

```bash
# Check website configuration
gsutil web get gs://cloud-team-ui

# Test access
curl http://storage.googleapis.com/cloud-team-ui/index.html
```

## Quick Deployment (Using Script)

After installing gcloud CLI, you can use the automated script:

```bash
./deploy-to-gcs.sh
```

## Access Your Site

After deployment, your site will be available at:

- **HTTP**: `http://storage.googleapis.com/cloud-team-ui/index.html`
- **HTTP (root)**: `http://storage.googleapis.com/cloud-team-ui/`

## Important Notes

1. **React Router**: The error page is configured to serve `index.html` for all routes, which allows React Router to handle client-side routing correctly.

2. **API Configuration**: Before building for production, update `src/config/api.js` with your backend API URL:
   ```javascript
   const COMPOSITE_MS_IP = 'YOUR_BACKEND_IP_OR_DOMAIN';
   ```

3. **CORS**: If your backend API is on a different domain, ensure CORS is properly configured on your backend services.

4. **HTTPS & Custom Domain**: For HTTPS and custom domains, you'll need to set up Cloud CDN (optional step 6).

## Troubleshooting

### gsutil command not found
- Install Google Cloud SDK (see Prerequisites)
- Add to PATH: `export PATH=$PATH:~/google-cloud-sdk/bin`

### Permission denied errors
- Ensure you're authenticated: `gcloud auth login`
- Check project: `gcloud config get-value project`
- Verify bucket permissions in GCP Console

### 404 errors on routes
- Ensure error page is set to `index.html`: `gsutil web set -e index.html gs://cloud-team-ui`

## Next Steps (Optional)

### Set Up Cloud CDN for HTTPS

1. Create a Cloud CDN backend bucket pointing to `cloud-team-ui`
2. Configure cache policies
3. Enable HTTPS
4. Set up custom domain if desired

See: https://cloud.google.com/cdn/docs/setting-up-cdn-with-bucket

