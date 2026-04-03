import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type SubscriptionPlan = {
    #Starter;  // ₹999, 8 photos, 1 video
    #Basic;    // ₹1999, 20 photos, 2 videos
    #Growth;   // ₹3999, 50 photos, 5 videos
    #Pro;      // ₹6999, 120 photos, 12 videos
    #Max;      // ₹9999, 250 photos, 50 videos
  };

  public type UsageData = {
    photosUsed : Nat;
    videosUsed : Nat;
    monthYear : Text;
  };

  public type SubscriptionInfo = {
    plan : ?SubscriptionPlan;
    photosUsed : Nat;
    videosUsed : Nat;
    photoLimit : Nat;
    videoLimit : Nat;
  };

  public type CustomTheme = {
    id : Text;
    name : Text;
    prompt : Text;
    createdAt : Time.Time;
  };

  public type Design = {
    roomType : Text;
    style : Text;
    timestamp : Time.Time;
  };

  module Design {
    public func compareByTimestamp(d1 : Design, d2 : Design) : Order.Order {
      Int.compare(d1.timestamp, d2.timestamp);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userSubscriptions = Map.empty<Principal, SubscriptionPlan>();
  let userUsage = Map.empty<Principal, UsageData>();
  let designs = List.empty<Design>();
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;
  let claimedPayments = Map.empty<Text, Principal>();
  let userCustomThemes = Map.empty<Principal, [CustomTheme]>();
  var puterToken : ?Text = ?"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6Ii85QzZVejRoU0FDREtDYjZxS2ZPWEE9PSIsInV1IjoiYUx1dW9ZOGpST1dybnN6OUZlVFV5UT09IiwiaWF0IjoxNzc0ODY5NDE0fQ.YNFIUAlSo67eurrYl7VrrVgDRW_tw14OuIfoAvEIpx8";

  func getCurrentMonthYear() : Text {
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    let days = seconds / 86400;
    let year = 1970 + (days / 365);
    let month = ((days % 365) / 30) + 1;
    year.toText() # "-" # (if (month < 10) { "0" } else { "" }) # Int.abs(month).toText();
  };

  func getPlanLimits(plan : ?SubscriptionPlan) : (Nat, Nat) {
    switch (plan) {
      case (null)      { (9999, 9999) };
      case (?#Starter) { (8, 1) };
      case (?#Basic)   { (20, 2) };
      case (?#Growth)  { (50, 5) };
      case (?#Pro)     { (120, 12) };
      case (?#Max)     { (250, 50) };
    };
  };

  func textToPlan(planId : Text) : ?SubscriptionPlan {
    switch (planId) {
      case ("starter") { ?#Starter };
      case ("basic")   { ?#Basic };
      case ("growth")  { ?#Growth };
      case ("pro")     { ?#Pro };
      case ("max")     { ?#Max };
      case (_)         { null };
    };
  };

  func getOrInitUsage(user : Principal) : UsageData {
    let currentMonth = getCurrentMonthYear();
    switch (userUsage.get(user)) {
      case (?usage) {
        if (usage.monthYear == currentMonth) { usage } else {
          let newUsage = { photosUsed = 0; videosUsed = 0; monthYear = currentMonth };
          userUsage.add(user, newUsage);
          newUsage;
        };
      };
      case null {
        let newUsage = { photosUsed = 0; videosUsed = 0; monthYear = currentMonth };
        userUsage.add(user, newUsage);
        newUsage;
      };
    };
  };

  public shared ({ caller }) func selfRegister() : async () {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous users cannot register") };
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) {};
      case (null) { accessControlState.userRoles.add(caller, #user) };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getMySubscription() : async SubscriptionInfo {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let plan = userSubscriptions.get(caller);
    let usage = getOrInitUsage(caller);
    let (photoLimit, videoLimit) = getPlanLimits(plan);
    { plan; photosUsed = usage.photosUsed; videosUsed = usage.videosUsed; photoLimit; videoLimit };
  };

  public shared ({ caller }) func claimRazorpayPayment(paymentId : Text, planId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (claimedPayments.get(paymentId)) {
      case (?existingUser) {
        if (existingUser != caller) {
          Runtime.trap("Payment already claimed by another user");
        };
      };
      case null {
        switch (textToPlan(planId)) {
          case (?plan) {
            claimedPayments.add(paymentId, caller);
            userSubscriptions.add(caller, plan);
            let currentMonth = getCurrentMonthYear();
            userUsage.add(caller, { photosUsed = 0; videosUsed = 0; monthYear = currentMonth });
          };
          case null {
            Runtime.trap("Invalid plan ID: " # planId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func setUserPlan(user : Principal, plan : SubscriptionPlan) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userSubscriptions.add(user, plan);
  };

  public shared ({ caller }) func recordPhotoUsage() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let usage = getOrInitUsage(caller);
    let plan = userSubscriptions.get(caller);
    let (photoLimit, _) = getPlanLimits(plan);
    if (usage.photosUsed >= photoLimit) {
      Runtime.trap("Photo limit exceeded");
    };
    userUsage.add(caller, { photosUsed = usage.photosUsed + 1; videosUsed = usage.videosUsed; monthYear = usage.monthYear });
  };

  public shared ({ caller }) func recordVideoUsage() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let usage = getOrInitUsage(caller);
    let plan = userSubscriptions.get(caller);
    let (_, videoLimit) = getPlanLimits(plan);
    if (usage.videosUsed >= videoLimit) {
      Runtime.trap("Video limit exceeded");
    };
    userUsage.add(caller, { photosUsed = usage.photosUsed; videosUsed = usage.videosUsed + 1; monthYear = usage.monthYear });
  };

  public query func isStripeConfigured() : async Bool {
    switch (stripeConfiguration) {
      case (null) { false };
      case (_)    { true };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    stripeConfiguration := ?config;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    switch (stripeConfiguration) {
      case (null) { #failed { error = "Stripe not configured" } };
      case (?c)   { await Stripe.getSessionStatus(c, sessionId, transform) };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?c)   { await Stripe.createCheckoutSession(c, caller, items, successUrl, cancelUrl, transform) };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func addDesign(roomType : Text, style : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    designs.add({ roomType; style; timestamp = Time.now() });
  };

  public query func getAllDesigns() : async [Design] {
    designs.toArray();
  };

  public query func getDesignHistorySorted() : async [Design] {
    designs.toArray().sort(Design.compareByTimestamp);
  };

  public query func getPuterToken() : async ?Text {
    puterToken;
  };

  public shared ({ caller }) func setPuterToken(token : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    puterToken := ?token;
  };

  public shared ({ caller }) func addCustomTheme(name : Text, prompt : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let themeId = Time.now().toText() # caller.hash().toText();
    let newTheme = {
      id = themeId;
      name;
      prompt;
      createdAt = Time.now();
    };
    let existingThemes = switch (userCustomThemes.get(caller)) {
      case (?themes) { themes };
      case (null)    { [] };
    };
    let updatedThemes = existingThemes.concat([newTheme]);
    userCustomThemes.add(caller, updatedThemes);
    themeId;
  };

  public query ({ caller }) func getMyCustomThemes() : async [CustomTheme] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (userCustomThemes.get(caller)) {
      case (?themes) { themes };
      case (null)    { [] };
    };
  };

  public shared ({ caller }) func deleteCustomTheme(themeId : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (userCustomThemes.get(caller)) {
      case (null) { false };
      case (?themes) {
        let filteredThemes = themes.filter(
          func(theme) { theme.id != themeId }
        );
        if (filteredThemes.size() == themes.size()) {
          false;
        } else {
          if (filteredThemes.size() == 0) {
            userCustomThemes.remove(caller);
          } else {
            userCustomThemes.add(caller, filteredThemes);
          };
          true;
        };
      };
    };
  };
};
