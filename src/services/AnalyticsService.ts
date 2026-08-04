import ReactGA from 'react-ga4';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

interface AeirmistAnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
  metadata?: Record<string, any>;
}

class AeirmistAnalytics {
  private isInitialized: boolean = false;
  private GA_ID: string = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
  
  // Track if tracking is locally allowed based on user privacy settings
  private isOptedIn: boolean = true;

  constructor() {
    this.checkUserConsent();
  }

  private checkUserConsent() {
    try {
      const saved = localStorage.getItem('aeirmist_privacy_analytics');
      this.isOptedIn = saved === null ? true : saved === 'true';
    } catch (e) {
      this.isOptedIn = false;
    }
  }

  public init() {
    if (this.isInitialized || !this.GA_ID || !this.isOptedIn) return;

    try {
      ReactGA.initialize(this.GA_ID);
      this.isInitialized = true;
      console.log('Analytics Saved [GA4]');
      
      // Track Page View on init
      this.trackPageView(window.location.pathname);
      
      // Initialize Performance Monitoring
      this.initPerformanceTracking();
    } catch (e) {
      console.error('Analytics Failed to Update:', e);
    }
  }

  public setOptIn(allowed: boolean) {
    this.isOptedIn = allowed;
    localStorage.setItem('aeirmist_privacy_analytics', String(allowed));
    
    if (allowed && !this.isInitialized) {
      this.init();
    }
  }

  public trackPageView(path: string) {
    if (!this.isInitialized || !this.isOptedIn) return;
    ReactGA.send({ hitType: 'pageview', page: path });
  }

  public trackEvent({ action, category, label, value, metadata }: AeirmistAnalyticsEvent) {
    if (!this.isInitialized || !this.isOptedIn) return;

    try {
      ReactGA.event({
        category,
        action,
        label,
        value,
        ...metadata
      });
      // Optionally mirror to internal local storage for the dashboard
      this.logToDigitalInsights(action, category);
    } catch (e) {
      console.error('Event Logging Interrupted:', e);
    }
  }

  private logToDigitalInsights(action: string, category: string) {
    try {
      const logs = JSON.parse(localStorage.getItem('aeirmist_neural_insights') || '[]');
      logs.unshift({
        id: Math.random().toString(36).substr(2, 9),
        action,
        category,
        timestamp: new Date().toISOString()
      });
      // Keep only last 50 events for performance
      localStorage.setItem('aeirmist_neural_insights', JSON.stringify(logs.slice(0, 50)));
    } catch (e) {}
  }

  private initPerformanceTracking() {
    const reportFunction = (metric: any) => {
      this.trackEvent({
        action: metric.name,
        category: 'Performance',
        label: metric.id,
        value: Math.round(metric.value),
        metadata: {
          delta: metric.delta,
          entries: metric.entries
        }
      });
    };

    onCLS(reportFunction);
    onINP(reportFunction);
    onLCP(reportFunction);
    onFCP(reportFunction);
    onTTFB(reportFunction);
  }

  // --- Specialized Trackers ---
  
  public trackAuth(type: 'login' | 'signup', method: string = 'google') {
    this.trackEvent({
      action: `auth_${type}`,
      category: 'User',
      label: method,
      metadata: { timestamp: new Date().toISOString() }
    });
  }

  public trackEngagement(type: 'message' | 'call' | 'video_call' | 'story_view' | 'story_upload' | 'profile_visit' | 'search' | 'post_view', metadata?: any) {
    this.trackEvent({
      action: `engagement_${type}`,
      category: 'Interaction',
      metadata
    });
  }
}

export const analytics = new AeirmistAnalytics();
