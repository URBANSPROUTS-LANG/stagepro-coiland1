import { Button } from "@/components/ui/button";
import type { Identity } from "@icp-sdk/core/agent";
import { ArrowLeft, Check, Crown, Info, Zap } from "lucide-react";
import { useState } from "react";

interface PricingPageProps {
  onBack: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  identity?: Identity;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 999,
    photos: 8,
    videos: 1,
    color: "#6366F1",
    bg: "#EEF2FF",
    razorpayLink: "https://rzp.io/rzp/8Zib43o",
    features: [
      "8 photo transformations/month",
      "1 video generation/month",
      "All design tools",
      "Standard quality",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 1999,
    photos: 20,
    videos: 2,
    color: "#0EA5E9",
    bg: "#E0F2FE",
    razorpayLink: "https://rzp.io/rzp/Q0rj75K5",
    features: [
      "20 photo transformations/month",
      "2 video generations/month",
      "All design tools",
      "HD quality",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 3999,
    photos: 50,
    videos: 5,
    color: "#10B981",
    bg: "#D1FAE5",
    popular: true,
    razorpayLink: "https://rzp.io/rzp/b37CVwov",
    features: [
      "50 photo transformations/month",
      "5 video generations/month",
      "All design tools",
      "HD quality",
      "Priority processing",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 6999,
    photos: 120,
    videos: 12,
    color: "#F59E0B",
    bg: "#FEF3C7",
    razorpayLink: "https://rzp.io/rzp/KQ0aPd1",
    features: [
      "120 photo transformations/month",
      "12 video generations/month",
      "All design tools",
      "Ultra HD quality",
      "Priority processing",
    ],
  },
  {
    id: "max",
    name: "Max",
    price: 9999,
    photos: 250,
    videos: 50,
    color: "#EC4899",
    bg: "#FCE7F3",
    razorpayLink: "https://rzp.io/rzp/OfYF5yMg",
    features: [
      "250 photo transformations/month",
      "50 video generations/month",
      "All design tools",
      "Ultra HD quality",
      "Priority processing",
      "Early access to new features",
    ],
  },
];

export default function PricingPage({
  onBack,
  isAuthenticated,
  onLogin,
  identity: _identity,
}: PricingPageProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = (plan: (typeof PLANS)[0]) => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    setLoadingPlan(plan.id);
    const callbackUrl = `${window.location.origin}?payment=razorpay&plan=${plan.id}`;
    window.location.href = `${plan.razorpayLink}?callback_url=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            data-ocid="pricing.back_button"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: "#6B7280" }} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{
                background: "linear-gradient(135deg, #4ECDC4, #2D9B94)",
              }}
            >
              R
            </div>
            <span className="font-bold text-sm" style={{ color: "#111827" }}>
              StagePro
            </span>
          </div>
        </div>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={onLogin}
            data-ocid="pricing.login_button"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #4ECDC4, #2D9B94)" }}
          >
            Sign In
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: "#E6F7F6" }}
          >
            <Crown className="h-4 w-4" style={{ color: "#4ECDC4" }} />
            <span className="text-sm font-medium" style={{ color: "#2D9B94" }}>
              Subscription Plans
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#111827" }}>
            Choose Your Plan
          </h1>
          <p className="text-lg" style={{ color: "#6B7280" }}>
            Start with 1 free photo. Upgrade for more transformations.
          </p>
        </div>

        {/* Free tier notice */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-8 max-w-lg mx-auto"
          style={{ backgroundColor: "#F3F4F6", border: "1px solid #E2E8F0" }}
        >
          <Zap className="h-5 w-5 flex-shrink-0" style={{ color: "#6B7280" }} />
          <p className="text-sm" style={{ color: "#374151" }}>
            <strong>Free tier:</strong> 1 photo transformation after sign-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-5 flex flex-col"
              style={{
                backgroundColor: "#FFFFFF",
                border: plan.popular
                  ? `2px solid ${plan.color}`
                  : "1px solid #E2E8F0",
                boxShadow: plan.popular
                  ? `0 4px 20px ${plan.color}25`
                  : "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: plan.color }}
                >
                  Most Popular
                </div>
              )}

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: plan.bg }}
              >
                <Crown className="h-5 w-5" style={{ color: plan.color }} />
              </div>

              <h3
                className="text-lg font-bold mb-1"
                style={{ color: "#111827" }}
              >
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: plan.color }}
                >
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>
                  /mo
                </span>
              </div>
              <div className="flex gap-3 mb-4">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: plan.bg, color: plan.color }}
                >
                  {plan.photos.toLocaleString()} photos
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: plan.bg, color: plan.color }}
                >
                  {plan.videos.toLocaleString()} video
                  {plan.videos > 1 ? "s" : ""}
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className="h-3.5 w-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: plan.color }}
                    />
                    <span className="text-xs" style={{ color: "#6B7280" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.id}
                data-ocid={`pricing.${plan.id}.primary_button`}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{
                  backgroundColor: plan.popular ? plan.color : plan.bg,
                  color: plan.popular ? "#FFFFFF" : plan.color,
                }}
              >
                {isAuthenticated
                  ? `Subscribe — ₹${plan.price.toLocaleString("en-IN")}/mo`
                  : "Sign In to Subscribe"}
              </button>
            </div>
          ))}
        </div>

        {/* Razorpay info box */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl mt-8 max-w-xl mx-auto"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <Info
            className="h-5 w-5 flex-shrink-0 mt-0.5"
            style={{ color: "#16A34A" }}
          />
          <p className="text-sm" style={{ color: "#166534" }}>
            After payment, you'll be redirected back and your plan will activate
            automatically. If your plan doesn't activate, contact support.
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
          Payments processed securely by Razorpay. Cancel anytime.
        </p>
      </main>
    </div>
  );
}
