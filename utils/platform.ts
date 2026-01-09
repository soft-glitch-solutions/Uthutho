// utils/platform.ts
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = !isWeb;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';