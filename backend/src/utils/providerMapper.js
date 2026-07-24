/**
 * Centralized provider mapper for SMM order submission.
 *
 * Converts a cart item (with customData, link, quantity) into the payload
 * that the SMM provider API expects. Adding a new provider only requires
 * adding a new case here — no changes to order.controller.js needed.
 */

/**
 * @param {string} provider
 * @param {{ smmServiceId?: string, link?: string, quantity: number, customData?: Record<string, any> }} item
 * @returns {Record<string, any>}
 */
export function mapOrderToProvider(provider, item) {
  switch (provider) {
    case "oneservicebd":
      return {
        service: item.smmServiceId || "",
        link: item.link || "",
        quantity: item.quantity,
        ...(item.customData?.country ? { country: item.customData.country } : {}),
        ...(item.customData?.device ? { device: item.customData.device } : {}),
        ...(item.customData?.traffic_type
          ? { "traffic-type": item.customData.traffic_type }
          : {}),
        ...(item.customData?.keyword ? { keyword: item.customData.keyword } : {}),
      };

    // Future providers:
    // case "justanotherpanel":
    //   return { ... };

    default:
      return {
        service: item.smmServiceId || "",
        link: item.link || "",
        quantity: item.quantity,
      };
  }
}

/**
 * Returns the API endpoint for a given provider.
 * @param {string} provider
 * @returns {string}
 */
export function getProviderEndpoint(provider) {
  switch (provider) {
    case "oneservicebd":
      return "https://oneservicebd.com/api/v2";
    default:
      return "";
  }
}
