# Test Event Generator Guide

This guide explains how to use the bulk calendar event generator to create test data for testing the dashboard features.

## Prerequisites

### 1. Update Azure AD Permissions

Before you can create events, you need to grant write permissions:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app registration
4. Go to **API permissions**
5. Click **+ Add a permission**
6. Select **Microsoft Graph** → **Delegated permissions**
7. Search for and add: **Calendars.ReadWrite**
8. Click **Add permissions**
9. **Important**: Click **Grant admin consent for [Your Organization]**
10. Log out and log back in to refresh your authentication token

## Using the Test Event Generator

### Via Dashboard UI

1. Log in to the dashboard
2. Scroll down to the **"Generate Test Calendar Events"** section
3. Configure your settings:
   - **Start Date**: First day to create events
   - **End Date**: Last day to create events
   - **Events Per Day**: Number of meetings per day (1-10)
   - **Min Duration**: Shortest meeting length in minutes
   - **Max Duration**: Longest meeting length in minutes
   - **Realistic Week**: Check this to generate a realistic week (skips weekends, varies meeting counts)

4. Click **"Preview Events"** to see what will be created (without actually creating them)
5. Click **"Generate Events"** to create the events in your calendar

### Via API

You can also use the API directly:

**Preview events:**
```bash
GET /api/test-events/preview?startDate=2024-01-01&endDate=2024-01-07&eventsPerDay=3
```

**Generate events:**
```bash
POST /api/test-events/generate
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "eventsPerDay": 3,
  "minDuration": 30,
  "maxDuration": 60,
  "realistic": false
}
```

## Example Configurations

### Light Schedule (2-3 meetings/day)
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "eventsPerDay": 2,
  "minDuration": 30,
  "maxDuration": 45
}
```

### Busy Schedule (5-6 meetings/day)
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "eventsPerDay": 5,
  "minDuration": 45,
  "maxDuration": 90
}
```

### Realistic Week
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "realistic": true
}
```
This generates:
- Weekdays only (Monday-Friday)
- Varying meeting counts (2-5 per day)
- More meetings on Wednesday and Friday
- Realistic meeting subjects

## Meeting Subjects Generated

The generator creates events with realistic meeting names:
- Team Standup
- Project Review
- Client Meeting
- Sprint Planning
- Code Review
- Design Discussion
- One-on-One
- Product Demo
- Strategy Session
- Weekly Sync
- And more...

## Limitations

- Maximum date range: 30 days
- Events are created during work hours (9 AM - 5 PM)
- Events are created sequentially to avoid rate limiting
- Small delay (100ms) between each event creation

## Troubleshooting

### "Insufficient permissions" error
- Make sure you've added `Calendars.ReadWrite` permission in Azure AD
- Grant admin consent
- Log out and log back in to refresh your token

### "Token expired" error
- Log out and log back in
- Your session may have expired

### Events not appearing
- Refresh your calendar view
- Check the date range you selected
- Verify events were created (check the success message)

### Rate limiting
- The generator includes delays between requests
- If you hit rate limits, wait a few minutes and try again
- Reduce the number of events per day or date range

## Cleaning Up Test Events

To remove test events:
1. Go to your Outlook/Calendar app
2. Search for events with subjects like "Team Standup", "Project Review", etc.
3. Delete them manually, or
4. Use Microsoft Graph API to delete events programmatically (future feature)

## Best Practices

1. **Start small**: Generate a few days first to test
2. **Use preview**: Always preview before generating
3. **Test date ranges**: Use future dates to avoid cluttering your current schedule
4. **Clean up**: Delete test events after testing
5. **Realistic mode**: Use "realistic week" for more natural test data

## Next Steps

After generating test events:
1. Refresh the dashboard to see your new calendar data
2. Check the calendar stats to see the analysis
3. View insights and recommendations based on your test data
4. Test the organic shape visualization with different metrics

