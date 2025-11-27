import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';

const REVENUECAT_IOS_API_KEY = Constants.expoConfig?.extra?.REVENUECAT_IOS_API_KEY || '';
const DEFAULT_PRO_ENTITLEMENT_ID = 'BetterSkin Pro';

export const PRO_ENTITLEMENT_ID =
  Constants.expoConfig?.extra?.REVENUECAT_PRO_ENTITLEMENT_ID || DEFAULT_PRO_ENTITLEMENT_ID;

export async function initRevenueCat(appUserId?: string | null) {
  if (Platform.OS !== 'ios') {
    console.log('RevenueCat is iOS-only, skipping initialization');
    return;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

    if (!REVENUECAT_IOS_API_KEY) {
      console.warn('RevenueCat iOS API key not found in app.json');
      return;
    }

    Purchases.configure({
      apiKey: REVENUECAT_IOS_API_KEY,
      appUserID: appUserId ?? undefined,
      observerMode: false,
    });

    console.log('RevenueCat initialized', appUserId ? `user: ${appUserId}` : 'anonymous');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

export async function linkUserToRevenueCat(userId: string) {
  if (Platform.OS !== 'ios') return null;

  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('User linked to RevenueCat:', userId);
    return customerInfo;
  } catch (error) {
    console.error('Failed to link user to RevenueCat:', error);
    throw error;
  }
}

export async function logoutRevenueCat() {
  if (Platform.OS !== 'ios') return null;

  try {
    const { customerInfo } = await Purchases.logOut();
    console.log('User logged out from RevenueCat');
    return customerInfo;
  } catch (error) {
    console.error('Failed to logout from RevenueCat:', error);
    throw error;
  }
}
