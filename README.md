# Microsoft Graph Dashboard

A Next.js application that connects to Microsoft Graph API to visualize calendar metadata and display numerical data as animated organic shapes.

## Features

- **OAuth 2.0 Authentication**: Secure Microsoft 365 login
- **Calendar Analytics**: Extract and display calendar metadata (duration, frequency, gaps between meetings)
- **Date Range Selection**: Configurable date range for calendar analysis (default: 7 days)
- **Organic Shape Visualization**: Animated, fluid visualization of numerical values using Framer Motion
- **Modern UI**: Clean, minimalist design with smooth animations

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript**
- **Microsoft Graph API** (`@microsoft/microsoft-graph-client`)
- **Azure MSAL** (`@azure/msal-node`) for OAuth 2.0
- **React 18** with Server Components
- **Framer Motion** for animations
- **Axios** for API calls
- **JWT Cookies** for serverless-compatible sessions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Microsoft Azure AD App Registration**:
   - Register an app in [Azure Portal](https://portal.azure.com)
   - Configure redirect URI: `http://localhost:3000/api/auth/callback` (for development)
   - Set API permissions: `Calendars.Read`, `Calendars.ReadWrite`, `User.Read`
   - Get Client ID and Client Secret

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory. You can copy from `env.example`:

```bash
cp env.example .env.local
```

Then edit `.env.local` with your actual values:

```env
# Microsoft Azure AD App Registration
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here
TENANT_ID=common

# JWT Secret (for session tokens)
JWT_SECRET=your-jwt-secret-here-change-in-production
# Or use SESSION_SECRET as fallback
SESSION_SECRET=your-session-secret-here-change-in-production

# Redirect URI
REDIRECT_URI=http://localhost:3000/api/auth/callback

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### 3. Run the Application

#### Development Mode

```bash
npm run dev
```

The application will be available at:
- http://localhost:3000

#### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
microsoft-graph/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── calendar/     # Calendar endpoints
│   │   ├── metrics/      # Metrics endpoints
│   │   ├── insights/     # Insights endpoints
│   │   └── test-events/  # Test event generation
│   ├── login/            # Login page
│   ├── dashboard/        # Dashboard page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (redirects to dashboard)
├── components/           # React components
├── lib/                  # Shared utilities
│   ├── api.ts           # API client
│   ├── auth.ts          # Auth helpers
│   └── jwtSession.ts    # JWT session management
├── services/             # Backend services
│   ├── graphService.ts
│   ├── calendarAnalyzer.ts
│   └── ...
└── middleware.ts         # Next.js middleware
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Redirect to Microsoft login
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user (requires auth)
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout

### Calendar
- `GET /api/calendar/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get calendar events and metadata
- `GET /api/calendar/metadata?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get only metadata
- `GET /api/calendar/timeseries?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get time series data

### Metrics
- `POST /api/metrics/display` - Set numerical value (body: `{ value: number }`)
- `GET /api/metrics/display` - Get current numerical value

### Insights
- `GET /api/insights?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get calendar insights

### Test Events
- `POST /api/test-events/generate` - Generate and create test calendar events
- `GET /api/test-events/preview` - Preview test events without creating them

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

The app will automatically:
- Detect Next.js
- Build and deploy
- Handle serverless functions
- Work with JWT cookies on the free plan

### Environment Variables for Production

Update these in your deployment platform:
- `CLIENT_ID` - Your Azure AD app client ID
- `CLIENT_SECRET` - Your Azure AD app client secret
- `TENANT_ID` - Your tenant ID (or 'common')
- `JWT_SECRET` - A strong random secret for JWT signing
- `REDIRECT_URI` - Your production callback URL (e.g., `https://your-app.vercel.app/api/auth/callback`)
- `NEXT_PUBLIC_APP_URL` - Your production app URL

### Azure AD Configuration for Production

1. Update Azure AD app registration:
   - Add production redirect URI: `https://your-app.vercel.app/api/auth/callback`
   - Ensure API permissions are granted and admin consent is provided

## Session Management

This app uses **JWT cookies** for session management, which:
- ✅ Works on Vercel's free plan
- ✅ No external services needed (no Redis/database required)
- ✅ Serverless-compatible
- ✅ Stateless and scalable

Sessions are stored in HTTP-only cookies and expire after 24 hours.

## Data Residency

The application is designed to be deployed on EU-based servers to ensure data residency compliance. All data processing occurs server-side, and calendar data is fetched directly from Microsoft Graph API without persistent storage.

## Troubleshooting

### Authentication Issues
- Verify Azure AD app registration settings
- Check redirect URI matches exactly (including trailing slashes)
- Ensure API permissions are granted and admin consent is provided

### Calendar Data Not Loading
- Verify user has calendar events in the selected date range
- Check Microsoft Graph API permissions
- Review server logs for API errors

### Build Errors
- Ensure all environment variables are set
- Check Node.js version (v18+)
- Clear `.next` directory and rebuild

## License

ISC

## Support

For issues or questions, please refer to the Microsoft Graph API documentation:
- [Microsoft Graph API Docs](https://docs.microsoft.com/en-us/graph/overview)
- [Azure AD Authentication](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
