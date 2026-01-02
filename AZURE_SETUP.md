# Microsoft Azure AD App Registration Guide

This guide walks you through registering your application in Azure AD to enable Microsoft Graph API access.

## Step 1: Access Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Microsoft account (must have permissions to create app registrations)
3. If you don't have an Azure subscription, you can use a free account

## Step 2: Navigate to App Registrations

1. In the Azure Portal search bar, type "Azure Active Directory" or "Microsoft Entra ID"
2. Click on **Azure Active Directory** (or **Microsoft Entra ID**)
3. In the left sidebar, click on **App registrations**
4. Click **+ New registration** button at the top

## Step 3: Register the Application

Fill in the registration form:

1. **Name**: `Microsoft Graph Dashboard` (or any name you prefer)
2. **Supported account types**: 
   - Select **"Accounts in any organizational directory and personal Microsoft accounts"** (most flexible for testing)
   - Or **"Single tenant"** if you only want your organization's users
3. **Redirect URI**:
   - Platform: Select **Web**
   - URI: `http://localhost:3001/auth/callback`
   - Click **Register**

## Step 4: Note Your Application Details

After registration, you'll see the **Overview** page. Copy these values:

1. **Application (client) ID** - This is your `CLIENT_ID`
2. **Directory (tenant) ID** - This is your `TENANT_ID` (you can use "common" for multi-tenant)

**Important**: Keep this page open or copy these values - you'll need them for your `.env` file.

## Step 5: Create Client Secret

1. In the left sidebar, click on **Certificates & secrets**
2. Click **+ New client secret**
3. **Description**: `Dashboard App Secret` (or any description)
4. **Expires**: Choose an expiration (for development, 24 months is fine)
5. Click **Add**

**⚠️ CRITICAL**: Copy the **Value** of the secret immediately - you won't be able to see it again!

This value is your `CLIENT_SECRET`.

## Step 6: Configure API Permissions

1. In the left sidebar, click on **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add the following permissions:
   - `Calendars.Read` - Read user's calendars
   - `User.Read` - Sign in and read user profile
6. Click **Add permissions**

## Step 7: Grant Admin Consent (if required)

1. Still on the **API permissions** page
2. If you see a yellow warning about admin consent:
   - Click **Grant admin consent for [Your Organization]**
   - Click **Yes** to confirm
3. The status should change to green checkmarks with "Granted for [Your Organization]"

**Note**: If you're using a personal Microsoft account or don't have admin rights, you may need to request consent from an admin, or the user will be prompted to consent during login.

## Step 8: Configure Redirect URIs (if needed)

1. In the left sidebar, click on **Authentication**
2. Under **Platform configurations**, you should see your redirect URI
3. To add additional URIs (for production):
   - Click **+ Add a platform**
   - Select **Web**
   - Add your production URL: `https://your-production-domain.com/auth/callback`
   - Click **Configure**

## Step 9: Update Your .env File

Now update your backend `.env` file with the values you collected:

```env
# From Step 4: Application (client) ID
CLIENT_ID=your-application-client-id-here

# From Step 5: Client secret value
CLIENT_SECRET=your-client-secret-value-here

# From Step 4: Directory (tenant) ID, or use "common" for multi-tenant
TENANT_ID=common

# Server Configuration
PORT=3001
NODE_ENV=development
SESSION_SECRET=generate-a-random-secret-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Redirect URI (must match what you configured in Azure)
REDIRECT_URI=http://localhost:3001/auth/callback
```

## Step 10: Generate Session Secret

For the `SESSION_SECRET`, generate a random string:

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use an online generator: https://randomkeygen.com/

## Verification Checklist

Before testing, verify:

- [ ] Application registered in Azure AD
- [ ] Client ID copied to `.env`
- [ ] Client Secret copied to `.env` (the **Value**, not the Secret ID)
- [ ] Redirect URI matches exactly: `http://localhost:3001/auth/callback`
- [ ] API permissions added: `Calendars.Read` and `User.Read`
- [ ] Admin consent granted (if required)
- [ ] Session secret generated and added to `.env`

## Troubleshooting

### "AADSTS50011: The redirect URI specified in the request does not match"
- **Solution**: Ensure the redirect URI in Azure Portal exactly matches `http://localhost:3001/auth/callback` (including http, no trailing slash, correct port)

### "AADSTS7000215: Invalid client secret"
- **Solution**: Make sure you copied the **Value** of the secret, not the Secret ID. If expired, create a new secret.

### "Insufficient privileges to complete the operation"
- **Solution**: You need admin rights to grant consent, or the user will be prompted during login

### "AADSTS65005: The application requires access to a service"
- **Solution**: Ensure API permissions are added and admin consent is granted

## Next Steps

Once registration is complete:

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:5173`
4. Click "Sign in with Microsoft"
5. You should be redirected to Microsoft login

## Production Setup

When deploying to production, you'll need to:

1. Add production redirect URI in Azure Portal
2. Update `REDIRECT_URI` in production `.env` to match
3. Update `FRONTEND_URL` to your production frontend URL
4. Consider using Azure Key Vault for storing secrets in production

## Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/overview)
- [OAuth 2.0 Flow Explanation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

