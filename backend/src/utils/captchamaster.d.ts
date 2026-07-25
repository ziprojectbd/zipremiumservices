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
export declare class CaptchaMasterError extends Error {
    statusCode?: number | undefined;
    originalError?: unknown;
    constructor(message: string, statusCode?: number | undefined, originalError?: unknown);
}
declare class CaptchaMasterService {
    private client;
    private apiKey;
    constructor();
    /**
     * Get reseller wallet stats
     * GET /reseller/stats
     */
    getStats(): Promise<CaptchaMasterStats>;
    /**
     * Get available pricing plans
     * GET /reseller/pricing-plans
     */
    getPricingPlans(): Promise<CaptchaMasterPricingPlan[]>;
    /**
     * Get all packages purchased by reseller
     * GET /reseller/packages
     */
    getPackages(): Promise<CaptchaMasterPackage[]>;
    /**
     * Delete a purchased package
     * DELETE /reseller/packages/:id
     */
    deletePackage(id: string): Promise<void>;
    /**
     * Get all API keys
     * GET /reseller/api-keys
     */
    getApiKeys(): Promise<CaptchaMasterApiKey[]>;
    /**
     * Create a new API key
     * POST /reseller/api-keys
     */
    createApiKey(name: string): Promise<CaptchaMasterApiKey>;
    /**
     * Regenerate an API key
     * PUT /reseller/api-keys/:id/regenerate
     */
    regenerateApiKey(id: string): Promise<CaptchaMasterApiKey>;
    /**
     * Delete an API key
     * DELETE /reseller/api-keys/:id
     */
    deleteApiKey(id: string): Promise<void>;
    /**
     * Purchase a package for a customer
     * POST /reseller/purchase
     */
    purchasePackage(planId: string, customerEmail: string): Promise<CaptchaMasterPurchaseResult>;
}
export declare function getCaptchaMasterService(): CaptchaMasterService;
export declare function resetCaptchaMasterService(): void;
export default CaptchaMasterService;
//# sourceMappingURL=captchamaster.d.ts.map