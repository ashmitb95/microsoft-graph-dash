# Quick Start Guide - Azure Registration

Follow these steps to register your app in Azure and connect it to the dashboard.

## Option 1: Interactive Setup Script

Run the automated setup script:

```bash
./setup-azure.sh
```

The script will guide you through each step interactively.

## Option 2: Manual Setup

### Step 1: Register App in Azure Portal

1. **Open Azure Portal**: https://portal.azure.com
2. **Search for "Azure Active Directory"** (or "Microsoft Entra ID")
3. **Click "App registrations"** in the left sidebar
4. **Click "+ New registration"**

### Step 2: Fill in Registration Form

- **Name**: `Microsoft Graph Dashboard`
- **Supported account types**: 
  - Select: **"Accounts in any organizational directory and personal Microsoft accounts"**
- **Redirect URI**:
  - Click "Add a platform" → Select **"Web"**
  - Enter: `http://localhost:3001/auth/callback`
  - Click **Register**

### Step 3: Copy Your Client ID

After registration, you'll see the **Overview** page:
- Copy the **Application (client) ID** - you'll need this!

### Step 4: Create Client Secret

1. Click **"Certificates & secrets"** in the left sidebar
2. Click **"+ New client secret"**
3. **Description**: `Dashboard Secret`
4. **Expires**: Choose 24 months (or your preference)
5. Click **Add**
6. **⚠️ IMPORTANT**: Copy the **Value** immediately (you won't see it again!)

### Step 5: Configure API Permissions

1. Click **"API permissions"** in the left sidebar
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search and add:
   - `Calendars.Read`
   - `User.Read`
6. Click **"Add permissions"**
7. Click **"Grant admin consent for [Your Organization]"** (if you have admin rights)
   - Click **Yes** to confirm

### Step 6: Update Your .env File

Open `backend/.env` and update these values:

```env
CLIENT_ID=paste-your-client-id-here
CLIENT_SECRET=paste-your-secret-value-here
TENANT_ID=common
SESSION_SECRET=generate-a-random-secret
```

**To generate SESSION_SECRET**, run:
```bash
openssl rand -base64 32
```

## Verify Your Setup

Check that your `backend/.env` has:
- ✅ CLIENT_ID (from Step 3)
- ✅ CLIENT_SECRET (from Step 4 - the **Value**)
- ✅ TENANT_ID=common
- ✅ SESSION_SECRET (generated random string)
- ✅ REDIRECT_URI=http://localhost:3001/auth/callback
- ✅ FRONTEND_URL=http://localhost:5173

## Test the Connection

1. **Install dependencies** (if not done):
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **In another terminal, start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open your browser**: http://localhost:5173

5. **Click "Sign in with Microsoft"** - you should be redirected to Microsoft login!

## Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URI in Azure Portal **exactly** matches: `http://localhost:3001/auth/callback`
- Check for typos, http vs https, trailing slashes

### "Invalid client secret"
- Make sure you copied the **Value**, not the Secret ID
- If expired, create a new secret in Azure Portal

### "Insufficient privileges"
- You need admin rights to grant consent, OR
- Users will be prompted to consent during login

## Need Help?

See `AZURE_SETUP.md` for detailed screenshots and troubleshooting.

