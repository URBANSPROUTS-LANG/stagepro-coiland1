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

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

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

  // ========== AUTHORIZATION ==========
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  // ========== USER MANAGEMENT ==========

  public shared ({ caller }) func selfRegister(name : Text) : async () {
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

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
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
};
