import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';

export interface GraphServiceConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export class GraphService {
  private msalClient: ConfidentialClientApplication;
  private config: GraphServiceConfig;

  constructor(config: GraphServiceConfig) {
    this.config = config;
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthUrl(state?: string): Promise<string> {
    const authCodeUrlParameters = {
      scopes: [
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ],
      redirectUri: this.config.redirectUri,
      state: state || '',
    };

    try {
      const url = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
      return url;
    } catch (error: any) {
      throw new Error(`Failed to get auth URL: ${error.message}`);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async acquireTokenByCode(code: string): Promise<AuthenticationResult> {
    const tokenRequest = {
      code,
      scopes: [
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ],
      redirectUri: this.config.redirectUri,
    };

    try {
      const response = await this.msalClient.acquireTokenByCode(tokenRequest);
      if (!response) {
        throw new Error('Failed to acquire token');
      }
      return response;
    } catch (error: any) {
      throw new Error(`Token acquisition failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthenticationResult> {
    const tokenRequest = {
      refreshToken,
      scopes: [
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ],
    };

    try {
      const response = await this.msalClient.acquireTokenByRefreshToken(tokenRequest);
      if (!response) {
        throw new Error('Failed to refresh token');
      }
      return response;
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get Microsoft Graph client with access token
   */
  getGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const client = this.getGraphClient(accessToken);
    return await client.api('/me').get();
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const client = this.getGraphClient(accessToken);
    
    // Format dates for Graph API (ISO 8601)
    const startDateTime = new Date(startDate).toISOString();
    const endDateTime = new Date(endDate).toISOString();

    try {
      const response = await client
        .api(`/me/calendarview`)
        .query({
          startDateTime,
          endDateTime,
        })
        .select('id,subject,start,end,organizer,attendees,isAllDay,bodyPreview')
        .orderby('start/dateTime')
        .get();

      return response.value || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(
    accessToken: string,
    event: {
      subject: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      body?: { contentType: string; content: string };
      attendees?: Array<{ emailAddress: { address: string; name?: string } }>;
    }
  ): Promise<any> {
    const client = this.getGraphClient(accessToken);

    try {
      const response = await client.api('/me/events').post(event);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Create multiple calendar events in bulk
   */
  async createCalendarEventsBulk(
    accessToken: string,
    events: Array<{
      subject: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      body?: { contentType: string; content: string };
    }>
  ): Promise<{ created: number; failed: number; errors: any[] }> {
    let created = 0;
    let failed = 0;
    const errors: any[] = [];

    // Create events sequentially to avoid rate limiting
    for (const event of events) {
      try {
        await this.createCalendarEvent(accessToken, event);
        created++;
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        failed++;
        errors.push({ event: event.subject, error: error.message });
      }
    }

    return { created, failed, errors };
  }
}

