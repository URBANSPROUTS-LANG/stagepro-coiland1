import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface StarredEntry {
    id: bigint;
    name: string;
    createdAt: Time;
    description: string;
    updatedAt: Time;
    imageUrl: string;
    userPrincipal: Principal;
    prompt: string;
}
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
export interface AiGenerationLog {
    id: bigint;
    createdAt: Time;
    inputImageBlobId: string;
    userPrincipal: Principal;
    prompt: string;
    outputImageBlobId: string;
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
    /**
     * / Add a starred design (returns entry id)
     */
    addStarredEntry(name: string, description: string, imageUrl: string, prompt: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimRazorpayPayment(paymentId: string, planId: SubscriptionPlan): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteCustomTheme(themeId: bigint): Promise<void>;
    /**
     * / Deletes a starred design for a user, if it exists
     */
    deleteStarredEntry(entryId: bigint): Promise<void>;
    /**
     * / Returns the number of AI Generation logs that have been created
     */
    getAiGenerationLogCount(): Promise<bigint>;
    /**
     * / Gets all logs (sorted by oldestId) (admin-only)
     */
    getAiGenerationLogs(): Promise<Array<AiGenerationLog>>;
    /**
     * / Gets all logs in reverse order (admin-only)
     */
    getAiGenerationLogsReverse(): Promise<Array<AiGenerationLog>>;
    /**
     * / Gets all logs (sorted by createdAt desc) (admin-only)
     */
    getAiGenerationLogsSorted(): Promise<Array<AiGenerationLog>>;
    getAllDesigns(): Promise<Array<DesignEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDesignHistorySorted(): Promise<Array<DesignEntry>>;
    getImage(image: ExternalBlob): Promise<ExternalBlob>;
    getMyCustomThemes(): Promise<Array<CustomTheme>>;
    getMyProfile(): Promise<UserProfile>;
    /**
     * / Get all of the caller's own starred entries (sorted by createdAt desc)
     */
    getMyStarredEntries(): Promise<Array<StarredEntry>>;
    /**
     * / Returns the number of starred entries for a user.
     */
    getMyStarredEntryCount(): Promise<bigint>;
    getMySubscription(): Promise<SubscriptionUsage>;
    getPlanLimitsQuery(plan: SubscriptionPlan): Promise<PlanLimits>;
    getPuterToken(): Promise<string>;
    /**
     * / Get starred entries for a user (admin-only)
     */
    getStarredEntries(userPrincipal: Principal): Promise<Array<StarredEntry>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    /**
     * / Returns the number of starred entries created by all users (admin-only).
     */
    getTotalStarredEntryCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    /**
     * / Used by backend to store logs
     */
    logAiGeneration(prompt: string, inputImageBlobId: string, outputImageBlobId: string): Promise<void>;
    recordPhotoUsage(): Promise<void>;
    recordVideoUsage(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegister(name: string): Promise<void>;
    setPuterToken(token: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setUserPlan(user: Principal, newPlan: SubscriptionPlan): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateMyProfile(newName: string): Promise<void>;
    /**
     * / Updates the name and description for a starred design (only for the user that created it).
     */
    updateStarredEntry(entryId: bigint, name: string, description: string): Promise<void>;
}
