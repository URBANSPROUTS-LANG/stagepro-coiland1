import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

module {
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

  // ========== OLD ACTOR ==========
  type OldActor = {
    planLimits : [(SubscriptionPlan, PlanLimits)];
    userProfiles : Map.Map<Principal, UserProfile>;
    subscriptionUsage : Map.Map<Principal, SubscriptionUsage>;
    paymentClaims : Map.Map<Text, Bool>;
    designEntries : Map.Map<Int, DesignEntry>;
    userThemes : Map.Map<Principal, Map.Map<Int, CustomTheme>>;
    puterToken : Text;
    designIdCounter : Int;
    themeIdCounter : Int;
  };

  // ========== NEW ACTOR ==========
  type NewActor = {
    planLimits : [(SubscriptionPlan, PlanLimits)];
    userProfiles : Map.Map<Principal, UserProfile>;
    subscriptionUsage : Map.Map<Principal, SubscriptionUsage>;
    paymentClaims : Map.Map<Text, Bool>;
    designEntries : Map.Map<Int, DesignEntry>;
    userThemes : Map.Map<Principal, Map.Map<Int, CustomTheme>>;
    puterToken : Text;
    designIdCounter : Nat;
    themeIdCounter : Nat;
  };

  // ========== MIGRATION FUNCTION ==========
  public func run(old : OldActor) : NewActor {
    let {
      planLimits;
      userProfiles;
      subscriptionUsage;
      paymentClaims;
      designEntries;
      userThemes;
      puterToken;
      designIdCounter;
      themeIdCounter;
    } = old;
    {
      planLimits;
      userProfiles;
      subscriptionUsage;
      paymentClaims;
      designEntries;
      userThemes;
      puterToken;
      designIdCounter = Int.abs(designIdCounter);
      themeIdCounter = Int.abs(themeIdCounter);
    };
  };
};
