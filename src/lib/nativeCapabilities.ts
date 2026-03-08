import { Capacitor } from '@capacitor/core';

/** Whether the app is running as a native Capacitor app (not in browser) */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/** Whether it's running on Android specifically */
export const isAndroid = () => Capacitor.getPlatform() === 'android';

/** Whether it's running on iOS specifically */
export const isIOS = () => Capacitor.getPlatform() === 'ios';
