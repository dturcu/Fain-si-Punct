#!/bin/bash

# ============================================================================
# ShopHub Automated Deployment Script
# Run this on your local machine (with network access)
# ============================================================================

set -e  # Exit on any error

echo "🚀 ShopHub Automated Deployment Script"
echo "======================================"
echo ""

# ============================================================================
# STEP 1: Create NEW Supabase Project
# ============================================================================
echo "📦 STEP 1: Creating NEW Supabase Project..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Authenticate with Supabase (using your access token)
export SUPABASE_ACCESS_TOKEN="sbp_c3c876dd6c0821346352c65179d7d2fe107599e0"

# Generate strong database password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | cut -c1-25)
echo "Generated DB password: $DB_PASSWORD"

# Create the project
echo "Creating project 'shophub'..."
SUPABASE_RESPONSE=$(npx supabase projects create \
    --name shophub \
    --region us-east-1 \
    --db-password "$DB_PASSWORD" \
    --json)

# Extract project details
SUPABASE_PROJECT_ID=$(echo $SUPABASE_RESPONSE | jq -r '.id')
SUPABASE_PROJECT_URL="https://$SUPABASE_PROJECT_ID.supabase.co"
SUPABASE_API_KEY=$(echo $SUPABASE_RESPONSE | jq -r '.api_keys.anon')
SUPABASE_SERVICE_KEY=$(echo $SUPABASE_RESPONSE | jq -r '.api_keys.service_role')

echo "✅ Supabase Project Created!"
echo "   Project ID: $SUPABASE_PROJECT_ID"
echo "   URL: $SUPABASE_PROJECT_URL"
echo "   DB Password: $DB_PASSWORD"
echo ""

# ============================================================================
# STEP 2: Import Database Schema
# ============================================================================
echo "🗄️  STEP 2: Importing Database Schema..."
echo ""

# Wait for database to be ready
echo "Waiting for database to initialize (this may take a minute)..."
sleep 60

# Link to the new Supabase project
npx supabase link \
    --project-ref $SUPABASE_PROJECT_ID \
    --password "$DB_PASSWORD"

# Push the schema
echo "Importing schema from supabase/schema.sql..."
npx supabase db push

echo "✅ Database Schema Imported!"
echo ""

# ============================================================================
# STEP 3: Create NEW Vercel Project
# ============================================================================
echo "⚡ STEP 3: Creating NEW Vercel Project..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Create the Vercel project
echo "Creating project 'shophub' on Vercel..."
VERCEL_PROJECT=$(vercel projects create shophub --team dturcus-projects --json)
VERCEL_PROJECT_NAME=$(echo $VERCEL_PROJECT | jq -r '.name')
VERCEL_PROJECT_ID=$(echo $VERCEL_PROJECT | jq -r '.id')

echo "✅ Vercel Project Created!"
echo "   Project Name: $VERCEL_PROJECT_NAME"
echo "   Project ID: $VERCEL_PROJECT_ID"
echo ""

# ============================================================================
# STEP 4: Configure Environment Variables
# ============================================================================
echo "🔐 STEP 4: Configuring Environment Variables..."
echo ""

# Link local project to Vercel
vercel link --project-id $VERCEL_PROJECT_ID --yes

# Add environment variables
echo "Adding Supabase credentials to Vercel..."
vercel env add NEXT_PUBLIC_SUPABASE_URL "production,preview,development" <<< "$SUPABASE_PROJECT_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "production,preview,development" <<< "$SUPABASE_API_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY "production,preview,development" <<< "$SUPABASE_SERVICE_KEY"

echo "✅ Environment Variables Configured!"
echo ""

# ============================================================================
# STEP 5: Deploy to Vercel
# ============================================================================
echo "🚀 STEP 5: Deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

# Get the deployment URL
VERCEL_URL=$(vercel projects inspect $VERCEL_PROJECT_ID --json | jq -r '.targets.production.url')

echo "✅ Deployment Complete!"
echo ""

# ============================================================================
# STEP 6: Save Credentials
# ============================================================================
echo "💾 STEP 6: Saving Credentials..."
echo ""

cat > SHOPHUB_CREDENTIALS.txt << EOF
🎉 ShopHub Deployment Complete!
================================

SUPABASE CREDENTIALS
====================
Project ID: $SUPABASE_PROJECT_ID
Project URL: $SUPABASE_PROJECT_URL
Anon Key: $SUPABASE_API_KEY
Service Role Key: $SUPABASE_SERVICE_KEY
DB Password: $DB_PASSWORD

VERCEL CREDENTIALS
==================
Project Name: $VERCEL_PROJECT_NAME
Project ID: $VERCEL_PROJECT_ID
Live URL: $VERCEL_URL

NEXT STEPS
==========
1. Test the deployment with:
   curl $VERCEL_URL/api/health

2. Create admin user:
   curl -X POST $VERCEL_URL/api/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "admin@shophub.com",
       "password": "SecurePassword123",
       "firstName": "Shop",
       "lastName": "Admin"
     }'

3. Seed 15,000 test products:
   npm run seed

4. Import from Excel manifest:
   npm run import manifest_new.xlsx

================================
EOF

echo "✅ Credentials saved to: SHOPHUB_CREDENTIALS.txt"
echo ""
echo "================================"
echo "🎉 ShopHub Deployment Successful!"
echo "================================"
echo ""
echo "Your new ShopHub instance is live at:"
echo "🌐 $VERCEL_URL"
echo ""
echo "Keep SHOPHUB_CREDENTIALS.txt safe - it contains sensitive info!"
echo ""
