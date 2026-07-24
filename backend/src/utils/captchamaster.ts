/**
 * ============================================================
 * CAPTCHAMASTER API SERVICE
 * ============================================================
 *
 * Secure server-side service for interacting with CaptchaMaster API.
 * NEVER exposed to the client - all calls go through our API routes.
 *
 * Security:
 * - API key stored in environment variable only
 * - All methods are server-only
 * - No sensitive data logged
 * - Rate limiting applied at route level
 *
 * Base URL: https://captchamaster.com/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { devLog, devError } from './devLogger.js';

// ============================================================
// TYPES
// ============================================================

export interface CaptchaMasterStats {
  totalCustomers: number;
  activeCustomers: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalCredits: number;
  totalUsed: number;
  usagePercentage: number;
}

export interface CaptchaMasterPricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

export interface CaptchaMasterPackage {
  id: string;
  planId: string;
  planName: string;
  credits: number;
  price: number;
  customerEmail: string;
  status: 'active' | 'expired' | 'suspended';
  expiresAt: string;
  createdAt: string;
}

export interface CaptchaMasterApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastUsed?: string;
}

export interface CaptchaMasterPurchaseResult {
  orderId: string;
  packageId: string;
  credits: number;
  status: string;
  endDate?: string;
  apiKey?: string;
}

interface CaptchaMasterApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================================
// ERROR CLASS
// ============================================================

export class CaptchaMasterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CaptchaMasterError';
  }
}

// ============================================================
// SERVICE
// ============================================================

class CaptchaMasterService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    const apiKey = process.env.CAPTCHAMASTER_API_KEY;
    if (!apiKey) {
      throw new CaptchaMasterError(
        'CAPTCHAMASTER_API_KEY environment variable is not configured'
      );
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://captchamaster.org/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000,
    });

    // Response interceptor for centralized error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string; error?: string }>) => {
        const statusCode = error.response?.status;
        const serverMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message;

        let message: string;
        switch (statusCode) {
          case 401:
            message = 'CaptchaMaster API authentication failed. Check API key.';
            break;
          case 403:
            message = 'CaptchaMaster API access denied.';
            break;
          case 404:
            message = 'CaptchaMaster resource not found.';
            break;
          case 429:
            message = 'CaptchaMaster API rate limit exceeded. Try again later.';
            break;
          case 500:
          case 502:
          case 503:
            message = 'CaptchaMaster API server error. Please try again later.';
            break;
          default:
            message = serverMessage || 'An unexpected error occurred with CaptchaMaster API.';
        }

        devError(`[CaptchaMaster] API error (${statusCode}):`, serverMessage);
        throw new CaptchaMasterError(message, statusCode, error);
      }
    );
  }

  /**
   * Get reseller wallet stats
   * GET /reseller/stats
   */
  async getStats(): Promise<CaptchaMasterStats> {
    devLog('[CaptchaMaster] Fetching stats...');
    const response = await this.client.get<{ success: boolean; stats?: CaptchaMasterStats; message?: string; error?: string }>('/reseller/stats');
    const result = response.data;

    if (!result.success || !result.stats) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to fetch stats');
    }

    return result.stats;
  }

  /**
   * Get available pricing plans
   * GET /reseller/pricing-plans
   */
  async getPricingPlans(): Promise<CaptchaMasterPricingPlan[]> {
    devLog('[CaptchaMaster] Fetching pricing plans...');
    const response = await this.client.get<{ success: boolean; plans?: any[]; message?: string; error?: string }>('/reseller/pricing-plans');
    const result = response.data;

    if (!result.success || !result.plans) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to fetch pricing plans');
    }

    return result.plans.map((p: any) => ({
      id: p._id || p.id,
      name: p.code || p.name,
      credits: p.dailyLimit || p.count || 0,
      price: p.price,
      currency: 'USD',
      features: [`${p.recognition} recognition`, `${p.validity} validity`],
    }));
  }

  /**
   * Get all packages purchased by reseller
   * GET /reseller/packages
   */
  async getPackages(): Promise<CaptchaMasterPackage[]> {
    devLog('[CaptchaMaster] Fetching packages...');
    const response = await this.client.get<{ success: boolean; packages?: any[]; message?: string; error?: string }>('/reseller/packages');
    const result = response.data;

    if (!result.success || !result.packages) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to fetch packages');
    }

    return result.packages.map((p: any) => ({
      id: p._id || p.id,
      planId: p.packageCode || '',
      planName: p.packageName || p.name || 'Unknown',
      credits: p.credits || 0,
      price: p.price || 0,
      customerEmail: p.customerEmail || '',
      status: p.status || 'active',
      expiresAt: p.endDate || '',
      createdAt: p.createdAt || '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      key: p.key || '',
    }));
  }

  /**
   * Delete a purchased package
   * DELETE /reseller/packages/:id
   */
  async deletePackage(id: string): Promise<void> {
    devLog('[CaptchaMaster] Deleting package:', id);
    const response = await this.client.delete<CaptchaMasterApiResponse<null>>(`/reseller/packages/${id}`);
    const result = response.data;

    if (!result.success) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to delete package');
    }
  }

  /**
   * Get all API keys
   * GET /reseller/api-keys
   */
  async getApiKeys(): Promise<CaptchaMasterApiKey[]> {
    devLog('[CaptchaMaster] Fetching API keys...');
    const response = await this.client.get<{ success: boolean; apiKeys?: any[]; message?: string; error?: string }>('/reseller/api-keys');
    const result = response.data;

    if (!result.success || !result.apiKeys) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to fetch API keys');
    }

    return result.apiKeys.map((k: any) => ({
      id: k._id || k.id,
      name: k.name,
      key: k.key,
      status: k.status,
      createdAt: k.createdAt,
      lastUsed: k.lastUsedAt || k.lastUsed,
    }));
  }

  /**
   * Create a new API key
   * POST /reseller/api-keys
   */
  async createApiKey(name: string): Promise<CaptchaMasterApiKey> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new CaptchaMasterError('API key name is required');
    }
    if (name.length > 100) {
      throw new CaptchaMasterError('API key name must be 100 characters or less');
    }

    devLog('[CaptchaMaster] Creating API key:', name);
    const response = await this.client.post<{ success: boolean; apiKey?: any; message?: string; error?: string }>('/reseller/api-keys', { name });
    const result = response.data;

    if (!result.success || !result.apiKey) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to create API key');
    }

    const k = result.apiKey;
    return {
      id: k._id || k.id,
      name: k.name,
      key: k.key,
      status: k.status,
      createdAt: k.createdAt,
      lastUsed: k.lastUsedAt || k.lastUsed,
    };
  }

  /**
   * Regenerate an API key
   * PUT /reseller/api-keys/:id/regenerate
   */
  async regenerateApiKey(id: string): Promise<CaptchaMasterApiKey> {
    if (!id) {
      throw new CaptchaMasterError('API key ID is required');
    }

    devLog('[CaptchaMaster] Regenerating API key:', id);
    const response = await this.client.put<{ success: boolean; apiKey?: any; message?: string; error?: string }>(`/reseller/api-keys/${id}/regenerate`);
    const result = response.data;

    if (!result.success || !result.apiKey) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to regenerate API key');
    }

    const k = result.apiKey;
    return {
      id: k._id || k.id,
      name: k.name,
      key: k.key,
      status: k.status,
      createdAt: k.createdAt,
      lastUsed: k.lastUsedAt || k.lastUsed,
    };
  }

  /**
   * Delete an API key
   * DELETE /reseller/api-keys/:id
   */
  async deleteApiKey(id: string): Promise<void> {
    if (!id) {
      throw new CaptchaMasterError('API key ID is required');
    }

    devLog('[CaptchaMaster] Deleting API key:', id);
    const response = await this.client.delete<CaptchaMasterApiResponse<null>>(`/reseller/api-keys/${id}`);
    const result = response.data;

    if (!result.success) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to delete API key');
    }
  }

  /**
   * Purchase a package for a customer
   * POST /reseller/purchase
   */
  async purchasePackage(planId: string, customerEmail: string): Promise<CaptchaMasterPurchaseResult> {
    if (!planId) {
      throw new CaptchaMasterError('Plan ID is required');
    }
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      throw new CaptchaMasterError('A valid customer email is required');
    }

    devLog('[CaptchaMaster] Purchasing package - plan:', planId, 'customer:', customerEmail);
    const response = await this.client.post<{ success: boolean; message?: string; package?: any; apiKey?: any; balance?: number; error?: string }>(
      `/reseller/purchase/${planId}`,
      { customerEmail }
    );
    const result = response.data;

    if (!result.success || !result.package) {
      throw new CaptchaMasterError(result.error || result.message || 'Failed to purchase package');
    }

    const pkg = result.package;
    return {
      orderId: pkg._id || pkg.id,
      packageId: pkg._id || pkg.id,
      credits: pkg.credits || 0,
      status: pkg.status || 'active',
      endDate: pkg.endDate || '',
      apiKey: result.apiKey?.key || '',
    };
  }
}

// Singleton instance
let instance: CaptchaMasterService | null = null;

export function getCaptchaMasterService(): CaptchaMasterService {
  if (!instance) {
    instance = new CaptchaMasterService();
  }
  return instance;
}

// For testing purposes
export function resetCaptchaMasterService(): void {
  instance = null;
}

export default CaptchaMasterService;
