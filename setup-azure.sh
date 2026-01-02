#!/bin/bash

echo "=========================================="
echo "Microsoft Graph Dashboard - Azure Setup"
echo "=========================================="
echo ""
echo "This script will help you configure your Azure AD app registration."
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cp backend/env.example backend/.env
fi

echo "Step 1: Azure Portal Registration"
echo "-----------------------------------"
echo "1. Go to: https://portal.azure.com"
echo "2. Search for 'Azure Active Directory' or 'Microsoft Entra ID'"
echo "3. Click 'App registrations' → 'New registration'"
echo ""
echo "Fill in:"
echo "  - Name: Microsoft Graph Dashboard"
echo "  - Account types: 'Accounts in any organizational directory and personal Microsoft accounts'"
echo "  - Redirect URI: http://localhost:3001/auth/callback (Platform: Web)"
echo ""
read -p "Press Enter when you've registered the app and have the Client ID ready..."

echo ""
echo "Step 2: Get Your Client ID"
echo "-----------------------------------"
read -p "Enter your Application (Client) ID: " CLIENT_ID

echo ""
echo "Step 3: Create Client Secret"
echo "-----------------------------------"
echo "1. In Azure Portal, go to your app → 'Certificates & secrets'"
echo "2. Click 'New client secret'"
echo "3. Add description and expiration"
echo "4. Copy the VALUE (not the Secret ID) immediately!"
echo ""
read -p "Enter your Client Secret VALUE: " CLIENT_SECRET

echo ""
echo "Step 4: Configure API Permissions"
echo "-----------------------------------"
echo "1. Go to 'API permissions' in your app"
echo "2. Click 'Add a permission' → 'Microsoft Graph' → 'Delegated permissions'"
echo "3. Add: Calendars.Read and User.Read"
echo "4. Click 'Grant admin consent' (if you have admin rights)"
echo ""
read -p "Press Enter when API permissions are configured..."

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)

echo ""
echo "Step 5: Updating .env file"
echo "-----------------------------------"

# Update .env file
sed -i '' "s|CLIENT_ID=.*|CLIENT_ID=$CLIENT_ID|" backend/.env
sed -i '' "s|CLIENT_SECRET=.*|CLIENT_SECRET=$CLIENT_SECRET|" backend/.env
sed -i '' "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" backend/.env

echo "✓ Updated backend/.env with your credentials"
echo ""
echo "Configuration complete!"
echo ""
echo "Next steps:"
echo "1. cd backend && npm install"
echo "2. npm run dev"
echo "3. In another terminal: cd frontend && npm install && npm run dev"
echo "4. Open http://localhost:5173"
echo ""

