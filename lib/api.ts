import axios from 'axios';

// Use relative paths for Next.js API routes
const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface CalendarMetadata {
  dateRange: {
    start: string;
    end: string;
  };
  totalEvents: number;
  totalDuration: number;
  averageDuration: number;
  eventsPerDay: { [date: string]: number };
  gaps: Array<{
    start: string;
    end: string;
    duration: number;
  }>;
  averageGap: number;
  totalMeetingHours: number;
}

export interface CalendarResponse {
  events: any[];
  metadata: CalendarMetadata;
}

export const api = {
  // Auth endpoints
  checkAuth: () => apiClient.get('/auth/status'),
  getUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),

  // Calendar endpoints
  getCalendarEvents: (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<CalendarResponse>('/calendar/events', { params });
  },
  getCalendarMetadata: (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<{ metadata: CalendarMetadata }>('/calendar/metadata', { params });
  },
  getTimeSeries: (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<{ timeSeries: any }>('/calendar/timeseries', { params });
  },

  // Metrics endpoints
  setMetricValue: (value: number) =>
    apiClient.post('/metrics/display', { value }),
  getMetricValue: () => apiClient.get<{ value: number | null; hasValue: boolean }>('/metrics/display'),
};

export const auth = {
  login: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/login';
    }
  },
  logout: async () => {
    try {
      await api.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
};

export default apiClient;

