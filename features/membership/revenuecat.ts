import Purchases, { LOG_LEVEL } from "react-native-purchases";

export const REVENUECAT_API_KEY = "appl_siXEwVRvHnZvouhLvFkUYRscwXr";
export const BETTERSKIN_PRO_ENTITLEMENT = "BetterSkin Pro";
export const DEFAULT_OFFERING_IDENTIFIER = "default";

let configured = false;

export function ensureRevenueCatConfigured() {
  if (configured) return;
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}
