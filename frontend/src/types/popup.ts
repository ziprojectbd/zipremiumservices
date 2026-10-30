export interface PopupManagement {
  _id: string;
  imageUrl: string;
  altText: string;
  offerUrl?: string;
  showDuration?: number;
}

export interface PopupConfig {
  enabled: boolean;
  images: PopupManagement[];
  autoSlideInterval: number;
  autoCloseAfterLast: boolean;
  autoCloseDelay: number;
  showDuration?: number;
  autoClose?: boolean;
  showOncePerSession?: boolean;
  resetOnNewVisit?: boolean;
  showOnSpecificPages?: string[];
  hideOnMobile?: boolean;
  animationType?: string;
  position?: string;
  allowManualClose?: boolean;
  trackingEnabled?: boolean;
  customStyles?: object;
  lastUpdated?: number;
}

export const defaultPopupConfig: PopupConfig = {
  enabled: false,
  images: [
    {
      _id: '3',
      imageUrl: '/images/spider-man.png',
      altText: 'Spider Man',
      offerUrl: '/special-offer'
    },
    {
      _id: '4',
      imageUrl: '/images/payment-system.png',
      altText: 'Payment System',
      offerUrl: '/special-offer'
    }
  ],
  showDuration: 5000,
  autoClose: true,
  showOncePerSession: true,
  resetOnNewVisit: false,
  showOnSpecificPages: ['/', '/shop'],
  hideOnMobile: false,
  animationType: 'fade',
  position: 'center',
  allowManualClose: true,
  trackingEnabled: true,
  customStyles: {},
  lastUpdated: Date.now(),
  autoSlideInterval: 3,
  autoCloseAfterLast: false,
  autoCloseDelay: 3
};
