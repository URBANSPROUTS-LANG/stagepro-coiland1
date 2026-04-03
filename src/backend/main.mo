import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

import Storage "blob-storage/Storage";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";


actor {
  // ========== TYPES ==========
  // Subscription Plans
  type SubscriptionPlan = {
    #starter;
    #basic;
    #growth;
    #pro;
    #max;
  };

  // Plan Limits
  type PlanLimits = {
    plan : SubscriptionPlan;
    photoLimit : Nat;
    videoLimit : Nat;
    price : Nat;
  };

  // User Profile
  type UserProfile = {
    principal : Principal;
    name : Text;
    createdAt : Time.Time;
  };

  // Subscription Usage
  type SubscriptionUsage = {
    plan : SubscriptionPlan;
    photosUsed : Nat;
    videosUsed : Nat;
    createdAt : Time.Time;
    lastReset : Time.Time;
  };

  // Design Entry
  type DesignEntry = {
    principal : Principal;
    roomType : Text;
    style : Text;
    createdAt : Time.Time;
  };

  // Custom Theme
  type CustomTheme = {
    principal : Principal;
    name : Text;
    prompt : Text;
    createdAt : Time.Time;
  };

  // ========== NEW TYPES ==========
  // AI Generation Log
  type AiGenerationLog = {
    id : Nat;
    userPrincipal : Principal;
    prompt : Text;
    inputImageBlobId : Text;
    outputImageBlobId : Text;
    createdAt : Time.Time;
  };

  // Starred Entry
  type StarredEntry = {
    id : Nat;
    userPrincipal : Principal;
    name : Text;
    description : Text;
    imageUrl : Text;
    prompt : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  // ========== AUTHORIZATION ==========
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ========== DATA STRUCTURES ==========
  // Plan Limits (constant)
  let planLimits : [(SubscriptionPlan, PlanLimits)] = [
    (#starter, { plan = #starter; photoLimit = 8; videoLimit = 1; price = 0 }),
    (#basic, { plan = #basic; photoLimit = 20; videoLimit = 2; price = 500 }),
    (#growth, { plan = #growth; photoLimit = 50; videoLimit = 5; price = 1000 }),
    (#pro, { plan = #pro; photoLimit = 120; videoLimit = 12; price = 2500 }),
    (#max, { plan = #max; photoLimit = 250; videoLimit = 50; price = 4000 }),
  ];

  func subscriptionPlanEqual(lhs : SubscriptionPlan, rhs : SubscriptionPlan) : Bool {
    switch (lhs, rhs) {
      case (#starter, #starter) { true };
      case (#basic, #basic) { true };
      case (#growth, #growth) { true };
      case (#pro, #pro) { true };
      case (#max, #max) { true };
      case (_, _) { false };
    };
  };

  func getPlanLimits(plan : SubscriptionPlan) : PlanLimits {
    switch (planLimits.find(func(entry) { subscriptionPlanEqual(plan, entry.0) })) {
      case (null) { Runtime.trap("Plan not found") };
      case (?entry) { entry.1 };
    };
  };

  // Mappings
  let userProfiles = Map.empty<Principal, UserProfile>();
  let subscriptionUsage = Map.empty<Principal, SubscriptionUsage>();
  let paymentClaims = Map.empty<Text, Bool>();
  let designEntries = Map.empty<Int, DesignEntry>();
  let userThemes = Map.empty<Principal, Map.Map<Int, CustomTheme>>();

  // Persistent puter token with default value
  var puterToken : Text = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6IkdiTzc1aEJTUWdlZUkyZFc3VVJqNHc9PSIsInV1IjoiTkFoem9pTmNTSXVqaDlnNTNCYXlhUT09IiwiaWF0IjoxNzc1MTg2MzUwfQ.X5Bl1Wy_5LIznQe5MzRYrxThANTaJQKJPXzhP-wZN9I";

  // ========== NEW DATA STRUCTURES ==========
  // AI Log
  let aiGenerationLogs = Map.empty<Nat, AiGenerationLog>();
  var nextAiLogId = 0;

  // Starred Entries
  let starredEntries = Map.empty<Nat, StarredEntry>();
  var nextStarredEntryId = 0;

  // ========== USER MANAGEMENT ==========

  public shared ({ caller }) func selfRegister(name : Text) : async () {
    // Prevent anonymous principals from registering
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already registered");
    };
    let now = Time.now();
    let profile : UserProfile = {
      principal = caller;
      name;
      createdAt = now;
    };
    let subscription : SubscriptionUsage = {
      plan = #starter;
      photosUsed = 0;
      videosUsed = 0;
      createdAt = now;
      lastReset = now;
    };
    userProfiles.add(caller, profile);
    subscriptionUsage.add(caller, subscription);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getMyProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func updateMyProfile(newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };
    let updatedProfile : UserProfile = {
      profile with
      name = newName;
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ========== SUBSCRIPTIONS ==========

  public query ({ caller }) func getMySubscription() : async SubscriptionUsage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscriptions");
    };
    switch (subscriptionUsage.get(caller)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?sub) { sub };
    };
  };

  public shared ({ caller }) func recordPhotoUsage() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record usage");
    };
    let sub = switch (subscriptionUsage.get(caller)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?s) { s };
    };
    let limits = getPlanLimits(sub.plan);
    if (sub.photosUsed >= limits.photoLimit) {
      Runtime.trap("Photo limit reached for this month");
    };
    let updatedSub : SubscriptionUsage = {
      sub with
      photosUsed = sub.photosUsed + 1;
    };
    subscriptionUsage.add(caller, updatedSub);
  };

  public shared ({ caller }) func recordVideoUsage() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record usage");
    };
    let sub = switch (subscriptionUsage.get(caller)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?s) { s };
    };
    let limits = getPlanLimits(sub.plan);
    if (sub.videosUsed >= limits.videoLimit) {
      Runtime.trap("Video limit reached for this month");
    };
    let updatedSub : SubscriptionUsage = {
      sub with
      videosUsed = sub.videosUsed + 1;
    };
    subscriptionUsage.add(caller, updatedSub);
  };

  public shared ({ caller }) func setUserPlan(user : Principal, newPlan : SubscriptionPlan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let sub = switch (subscriptionUsage.get(user)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?s) { s };
    };
    let newLimits = getPlanLimits(newPlan);
    let updatedSub : SubscriptionUsage = {
      plan = newPlan;
      photosUsed = 0;
      videosUsed = 0;
      createdAt = sub.createdAt;
      lastReset = Time.now();
    };
    subscriptionUsage.add(user, updatedSub);
  };

  public shared ({ caller }) func getPlanLimitsQuery(plan : SubscriptionPlan) : async PlanLimits {
    getPlanLimits(plan);
  };

  // ========== PAYMENT INTEGRATION ==========
  public shared ({ caller }) func claimRazorpayPayment(paymentId : Text, planId : SubscriptionPlan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim payments");
    };
    if (subscriptionUsage.containsKey(caller)) {
      let sub = switch (subscriptionUsage.get(caller)) {
        case (null) { Runtime.trap("Subscription not found") };
        case (?s) { s };
      };
      if (sub.plan == planId) {
        Runtime.trap("Already subscribed to this plan");
      };
    };
    let isClaimed = switch (paymentClaims.get(paymentId)) {
      case (null) { false };
      case (?claim) { claim };
    };
    if (isClaimed) {
      Runtime.trap("Payment already claimed");
    };
    let newLimits = getPlanLimits(planId);
    let updatedSub : SubscriptionUsage = {
      plan = planId;
      photosUsed = 0;
      videosUsed = 0;
      createdAt = Time.now();
      lastReset = Time.now();
    };
    subscriptionUsage.add(caller, updatedSub);
    paymentClaims.add(paymentId, true);
  };

  // Stripe integration
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?value) { value };
    };
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  // ========== DESIGN HISTORY ==========
  var designIdCounter = 0;

  public shared ({ caller }) func addDesign(roomType : Text, style : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add designs");
    };
    let design : DesignEntry = {
      principal = caller;
      roomType;
      style;
      createdAt = Time.now();
    };
    designEntries.add(designIdCounter, design);
    designIdCounter += 1;
    designIdCounter - 1;
  };

  module DesignEntry {
    public func compareByCreatedAt(d1 : DesignEntry, d2 : DesignEntry) : Order.Order {
      Int.compare(d1.createdAt, d2.createdAt);
    };
  };

  public query ({ caller }) func getAllDesigns() : async [DesignEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view designs");
    };
    designEntries.values().toArray();
  };

  public query ({ caller }) func getDesignHistorySorted() : async [DesignEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view design history");
    };
    designEntries.values().toArray().sort(DesignEntry.compareByCreatedAt);
  };

  // ========== CUSTOM THEMES ==========
  var themeIdCounter = 0;

  public shared ({ caller }) func addCustomTheme(name : Text, prompt : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add custom themes");
    };
    let theme : CustomTheme = {
      principal = caller;
      name;
      prompt;
      createdAt = Time.now();
    };
    let userThemeMap = switch (userThemes.get(caller)) {
      case (null) {
        let newMap = Map.empty<Int, CustomTheme>();
        userThemes.add(caller, newMap);
        newMap;
      };
      case (?map) { map };
    };
    userThemeMap.add(themeIdCounter, theme);
    themeIdCounter += 1;
    themeIdCounter - 1;
  };

  public query ({ caller }) func getMyCustomThemes() : async [CustomTheme] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view custom themes");
    };
    switch (userThemes.get(caller)) {
      case (null) { [] };
      case (?map) { map.values().toArray() };
    };
  };

  public shared ({ caller }) func deleteCustomTheme(themeId : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete custom themes");
    };
    switch (userThemes.get(caller)) {
      case (null) { Runtime.trap("No themes found") };
      case (?map) {
        if (not map.containsKey(themeId)) {
          Runtime.trap("Theme not found") };
        map.remove(themeId);
      };
    };
  };

  // ========== EXTERNAL BLOB STORAGE MANAGEMENT ==========
  public query ({ caller }) func getImage(image : Storage.ExternalBlob) : async Storage.ExternalBlob {
    image;
  };

  // ========== PUTER TOKEN MANAGEMENT ==========

  public query ({ caller }) func getPuterToken() : async Text {
    puterToken;
  };

  public shared ({ caller }) func setPuterToken(token : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    puterToken := token;
  };

  // ========== AI LOG (BUSINESS INTELLIGENCE) ==========

  /// Used by backend to store logs
  public shared ({ caller }) func logAiGeneration(prompt : Text, inputImageBlobId : Text, outputImageBlobId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can log AI generations");
    };
    let logId = nextAiLogId;
    let log : AiGenerationLog = {
      id = logId;
      userPrincipal = caller;
      prompt;
      inputImageBlobId;
      outputImageBlobId;
      createdAt = Time.now();
    };
    aiGenerationLogs.add(logId, log);
    nextAiLogId += 1;
  };

  /// Gets all logs (sorted by oldestId) (admin-only)
  public query ({ caller }) func getAiGenerationLogs() : async [AiGenerationLog] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access the AI generation logs");
    };
    aiGenerationLogs.values().toArray();
  };

  /// Gets all logs in reverse order (admin-only)
  public query ({ caller }) func getAiGenerationLogsReverse() : async [AiGenerationLog] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access the AI generation logs");
    };
    aiGenerationLogs.values().toArray().reverse();
  };

  /// Gets all logs (sorted by createdAt desc) (admin-only)
  public query ({ caller }) func getAiGenerationLogsSorted() : async [AiGenerationLog] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access the AI generation logs");
    };

    func compareByCreatedAtDesc(a : AiGenerationLog, b : AiGenerationLog) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };

    aiGenerationLogs.values().toArray().sort(compareByCreatedAtDesc);
  };

  /// Returns the number of AI Generation logs that have been created
  public query ({ caller }) func getAiGenerationLogCount() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view this statistic");
    };
    aiGenerationLogs.size();
  };

  // ========== STARRED DESIGNS ==========

  /// Add a starred design (returns entry id)
  public shared ({ caller }) func addStarredEntry(name : Text, description : Text, imageUrl : Text, prompt : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add starred entries");
    };

    let entryId = nextStarredEntryId;
    let entry : StarredEntry = {
      id = entryId;
      userPrincipal = caller;
      name;
      description;
      imageUrl;
      prompt;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    starredEntries.add(entryId, entry);
    nextStarredEntryId += 1;
    entryId;
  };

  /// Get all of the caller's own starred entries (sorted by createdAt desc)
  public query ({ caller }) func getMyStarredEntries() : async [StarredEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get starred entries");
    };

    func compareByCreatedAtDesc(a : StarredEntry, b : StarredEntry) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };

    starredEntries.values().toArray().filter(func(entry) { entry.userPrincipal == caller }).sort(compareByCreatedAtDesc);
  };

  /// Get starred entries for a user (admin-only)
  public query ({ caller }) func getStarredEntries(userPrincipal : Principal) : async [StarredEntry] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get another user's starred entries");
    };

    func compareByCreatedAtDesc(a : StarredEntry, b : StarredEntry) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };

    starredEntries.values().toArray().filter(func(entry) { entry.userPrincipal == userPrincipal }).sort(compareByCreatedAtDesc);
  };

  /// Updates the name and description for a starred design (only for the user that created it).
  public shared ({ caller }) func updateStarredEntry(entryId : Nat, name : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update starred entries");
    };
    let original = switch (starredEntries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
    if (original.userPrincipal != caller) { Runtime.trap("Unauthorized: Entry does not belong to this user") };
    starredEntries.add(entryId, { original with name; description; updatedAt = Time.now() });
  };

  /// Deletes a starred design for a user, if it exists
  public shared ({ caller }) func deleteStarredEntry(entryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete starred entries");
    };
    let original = switch (starredEntries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
    if (original.userPrincipal != caller) { Runtime.trap("Unauthorized: Entry does not belong to this user") };
    starredEntries.remove(entryId);
  };

  /// Returns the number of starred entries for a user.
  public shared ({ caller }) func getMyStarredEntryCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get starred entries");
    };
    starredEntries.values().toArray().filter(func(entry) { entry.userPrincipal == caller }).size();
  };

  /// Returns the number of starred entries created by all users (admin-only).
  public query ({ caller }) func getTotalStarredEntryCount() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get total starred entry count");
    };
    starredEntries.size();
  };
};
