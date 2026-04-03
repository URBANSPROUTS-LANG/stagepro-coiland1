import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface CustomTheme {
    principal: Principal;
    name: string;
    createdAt: Time;
    prompt: string;
}
export interface PlanLimits {
    plan: SubscriptionPlan;
    videoLimit: bigint;
    price: bigint;
    photoLimit: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface DesignEntry {
    principal: Principal;
    createdAt: Time;
    style: string;
    roomType: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface SubscriptionUsage {
    lastReset: Time;
    photosUsed: bigint;
    createdAt: Time;
    plan: SubscriptionPlan;
    videosUsed: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    principal: Principal;
    name: string;
    createdAt: Time;
}
export enum SubscriptionPlan {
    max = "max",
    pro = "pro",
    growth = "growth",
    starter = "starter",
    basic = "basic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomTheme(name: string, prompt: string): Promise<bigint>;
    addDesign(roomType: string, style: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimRazorpayPayment(paymentId: string, planId: SubscriptionPlan): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteCustomTheme(themeId: bigint): Promise<void>;
    getAllDesigns(): Promise<Array<DesignEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDesignHistorySorted(): Promise<Array<DesignEntry>>;
    getMyCustomThemes(): Promise<Array<CustomTheme>>;
    getMyProfile(): Promise<UserProfile>;
    getMySubscription(): Promise<SubscriptionUsage>;
    getPlanLimitsQuery(plan: SubscriptionPlan): Promise<PlanLimits>;
    getPuterToken(): Promise<string>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    recordPhotoUsage(): Promise<void>;
    recordVideoUsage(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegister(name: string): Promise<void>;
    setPuterToken(token: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setUserPlan(user: Principal, newPlan: SubscriptionPlan): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateMyProfile(newName: string): Promise<void>;
}
