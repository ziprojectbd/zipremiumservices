import { devLog } from '../utils/devLogger';
import { PopupConfig, defaultPopupConfig } from '../types/popup';
import api from './axios';

export interface PopupSessionData {
  sessionId: string;
  startTime: number;
  popupShown: boolean;
  popupShownCount: number;
  lastPopupTime: number;
  userInteractions: {
    closedManually: boolean;
    clickedOffer: boolean;
    viewedImages: number;
  };
}

export interface PopupAnalytics {
  totalViews: number;
  totalInteractions: number;
  conversionRate: number;
  averageViewTime: number;
  lastUpdated: number;
}

const STORAGE_KEYS = {
  POPUP_CONFIG: 'popupConfig',
  SESSION_DATA: 'popupSessionData',
  ANALYTICS: 'popupAnalytics',
  USER_PREFERENCES: 'popupUserPreferences',
  LAST_SHOWN: 'popupLastShown'
} as const;

const DEFAULT_SESSION_DATA: PopupSessionData = {
  sessionId: '',
  startTime: 0,
  popupShown: false,
  popupShownCount: 0,
  lastPopupTime: 0,
  userInteractions: {
    closedManually: false,
    clickedOffer: false,
    viewedImages: 0
  }
};

const DEFAULT_ANALYTICS: PopupAnalytics = {
  totalViews: 0,
  totalInteractions: 0,
  conversionRate: 0,
  averageViewTime: 0,
  lastUpdated: 0
};

export class PopupConfigManager {
  private static instance: PopupConfigManager;

  private constructor() {}

  static getInstance(): PopupConfigManager {
    if (!PopupConfigManager.instance) {
      PopupConfigManager.instance = new PopupConfigManager();
    }
    return PopupConfigManager.instance;
  }

  getConfig(): PopupConfig {
    try {
      if (typeof localStorage === 'undefined') {
        return defaultPopupConfig;
      }

      const saved = localStorage.getItem(STORAGE_KEYS.POPUP_CONFIG);
      if (saved) {
        const config = JSON.parse(saved);
        const merged = { ...defaultPopupConfig, ...config };
        if (defaultPopupConfig.images.length > (config.images || []).length) {
          merged.images = defaultPopupConfig.images;
        }
        return merged;
      }
    } catch (error) {
      devLog('Error loading popup config:', error);
    }
    return defaultPopupConfig;
  }

  saveConfig(config: Partial<PopupConfig>): void {
    try {
      const currentConfig = this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem(STORAGE_KEYS.POPUP_CONFIG, JSON.stringify(newConfig));
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.POPUP_CONFIG,
        newValue: JSON.stringify(newConfig)
      }));
    } catch (error) {
      devLog('Error saving popup config:', error);
    }
  }

  resetConfig(): void {
    localStorage.removeItem(STORAGE_KEYS.POPUP_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
    localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.LAST_SHOWN);
  }

  getSessionData(): PopupSessionData {
    try {
      if (typeof localStorage === 'undefined') {
        return { ...DEFAULT_SESSION_DATA, sessionId: this.generateSessionId() };
      }

      const sessionId = sessionStorage.getItem('ziPopupSession') || this.generateSessionId();
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);

      if (saved) {
        const data = JSON.parse(saved);
        if (data.sessionId !== sessionId) {
          return this.createNewSession(sessionId);
        }
        return data;
      }

      return this.createNewSession(sessionId);
    } catch (error) {
      devLog('Error getting session data:', error);
      return { ...DEFAULT_SESSION_DATA, sessionId: this.generateSessionId() };
    }
  }

  updateSessionData(updates: Partial<PopupSessionData>): void {
    try {
      const currentData = this.getSessionData();
      const newData = { ...currentData, ...updates };
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(newData));
    } catch (error) {
      devLog('Error updating session data:', error);
    }
  }

  recordPopupView(): void {
    const sessionData = this.getSessionData();
    const analytics = this.getAnalytics();

    this.updateSessionData({
      popupShown: true,
      popupShownCount: sessionData.popupShownCount + 1,
      lastPopupTime: Date.now()
    });

    this.saveAnalytics({
      ...analytics,
      totalViews: analytics.totalViews + 1,
      lastUpdated: Date.now()
    });

    localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString());
  }

  recordInteraction(type: 'close' | 'offer_click' | 'image_view', data?: any): void {
    const sessionData = this.getSessionData();
    const analytics = this.getAnalytics();

    let interactionUpdates = {};

    switch (type) {
      case 'close':
        interactionUpdates = {
          userInteractions: {
            ...sessionData.userInteractions,
            closedManually: true
          }
        };
        break;
      case 'offer_click':
        interactionUpdates = {
          userInteractions: {
            ...sessionData.userInteractions,
            clickedOffer: true
          }
        };
        break;
      case 'image_view':
        interactionUpdates = {
          userInteractions: {
            ...sessionData.userInteractions,
            viewedImages: sessionData.userInteractions.viewedImages + 1
          }
        };
        break;
    }

    this.updateSessionData(interactionUpdates);

    this.saveAnalytics({
      ...analytics,
      totalInteractions: analytics.totalInteractions + 1,
      conversionRate: analytics.totalViews > 0 ? (analytics.totalInteractions / analytics.totalViews) * 100 : 0,
      lastUpdated: Date.now()
    });
  }

  getAnalytics(): PopupAnalytics {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      devLog('Error loading analytics:', error);
    }
    return DEFAULT_ANALYTICS;
  }

  private saveAnalytics(analytics: PopupAnalytics): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
    } catch (error) {
      devLog('Error saving analytics:', error);
    }
  }

  async shouldShowPopup(): Promise<boolean> {
    try {
      if (typeof localStorage === 'undefined') {
        devLog('localStorage not available, showing popup by default');
        return true;
      }

      let dbEnabled = null;
      try {
        const response = await api.get('/public/popup-settings');
        const data = response.data;
        if (data.success) {
          dbEnabled = data.data.enabled;
          if (!dbEnabled) {
            devLog('Popup disabled in database settings');
            return false;
          } else {
            devLog('Popup enabled in database settings, forcing local config to enabled');
            this.saveConfig({ enabled: true });
          }
        }
      } catch (error) {
        devLog('Error checking popup settings:', error);
      }

      const config = this.getConfig();
      const sessionData = this.getSessionData();
      const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);

      if (dbEnabled === true) {
        devLog('Using database enabled status, ignoring local config');
      } else if (!config.enabled) {
        devLog('Popup disabled in local config');
        return false;
      }

      if (config.images.length === 0) {
        devLog('No images configured, not showing popup');
        return false;
      }

      devLog('Popup checks passed - showing popup');
      return true;
    } catch (error) {
      devLog('Error in shouldShowPopup:', error);
      return true;
    }
  }

  getUserPreferences(): Record<string, any> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      devLog('Error loading user preferences:', error);
    }
    return {};
  }

  saveUserPreferences(preferences: Record<string, any>): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      devLog('Error saving user preferences:', error);
    }
  }

  private createNewSession(sessionId: string): PopupSessionData {
    const sessionData: PopupSessionData = {
      ...DEFAULT_SESSION_DATA,
      sessionId,
      startTime: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(sessionData));
    sessionStorage.setItem('ziPopupSession', sessionId);
    return sessionData;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportData(): Record<string, any> {
    return {
      config: this.getConfig(),
      sessionData: this.getSessionData(),
      analytics: this.getAnalytics(),
      userPreferences: this.getUserPreferences(),
      lastShown: localStorage.getItem(STORAGE_KEYS.LAST_SHOWN)
    };
  }

  clearAllData(): void {
    this.resetConfig();
  }
}

export const popupConfigManager = PopupConfigManager.getInstance();

export const getPopupConfig = () => popupConfigManager.getConfig();
export const savePopupConfig = (config: Partial<PopupConfig>) => popupConfigManager.saveConfig(config);
export const shouldShowPopup = () => popupConfigManager.shouldShowPopup();
export const recordPopupView = () => popupConfigManager.recordPopupView();
export const recordPopupInteraction = (type: 'close' | 'offer_click' | 'image_view', data?: any) =>
  popupConfigManager.recordInteraction(type, data);
