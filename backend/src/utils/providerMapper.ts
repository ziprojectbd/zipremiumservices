/**
 * Centralized provider mapper for SMM order submission.
 */

export interface ProviderItem {
  smmServiceId?: string;
  link?: string;
  quantity: number;
  customData?: Record<string, string> | Record<string, unknown>;
}

/**
 * Convert a cart item into the SMM provider API payload.
 */
export function mapOrderToProvider(
  provider: string,
  item: ProviderItem,
): Record<string, unknown> {
  switch (provider) {
    case 'oneservicebd':
      return {
        service: item.smmServiceId || '',
        link: item.link || '',
        quantity: item.quantity,
        ...(item.customData?.country
          ? { country: item.customData.country }
          : {}),
        ...(item.customData?.device ? { device: item.customData.device } : {}),
        ...(item.customData?.traffic_type
          ? { 'traffic-type': item.customData.traffic_type }
          : {}),
        ...(item.customData?.keyword
          ? { keyword: item.customData.keyword }
          : {}),
      };

    default:
      return {
        service: item.smmServiceId || '',
        link: item.link || '',
        quantity: item.quantity,
      };
  }
}

/**
 * Returns the API endpoint for a given provider.
 */
export function getProviderEndpoint(provider: string): string {
  switch (provider) {
    case 'oneservicebd':
      return 'https://oneservicebd.com/api/v2';
    default:
      return '';
  }
}
