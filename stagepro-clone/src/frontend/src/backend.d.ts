import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type SubscriptionPlan =
  | { Starter: null }
  | { Basic: null }
  | { Growth: null }
  | { Pro: null }
  | { Max: null };

export interface UserProfile {
  name: string;
}

export interface SubscriptionInfo {
  plan: [] | [SubscriptionPlan];
  photosUsed: bigint;
  videosUsed: bigint;
  photoLimit: bigint;
  videoLimit: bigint;
}

export interface CustomTheme {
  id: string;
  name: string;
  prompt: string;
  createdAt: bigint;
}

export interface Design {
  roomType: string;
  style: string;
  timestamp: bigint;
}

export interface backendInterface {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  selfRegister(): Promise<void>;
  getCallerUserProfile(): Promise<[] | [UserProfile]>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  getMySubscription(): Promise<SubscriptionInfo>;
  claimRazorpayPayment(paymentId: string, planId: string): Promise<void>;
  setUserPlan(user: Principal, plan: SubscriptionPlan): Promise<void>;
  recordPhotoUsage(): Promise<void>;
  recordVideoUsage(): Promise<void>;
  isStripeConfigured(): Promise<boolean>;
  addDesign(roomType: string, style: string): Promise<void>;
  getAllDesigns(): Promise<Design[]>;
  getDesignHistorySorted(): Promise<Design[]>;
  getPuterToken(): Promise<[] | [string]>;
  setPuterToken(token: string): Promise<void>;
  addCustomTheme(name: string, prompt: string): Promise<string>;
  getMyCustomThemes(): Promise<CustomTheme[]>;
  deleteCustomTheme(themeId: string): Promise<boolean>;
}
