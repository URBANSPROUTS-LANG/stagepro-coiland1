import { Toaster } from "@/components/ui/sonner";
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminLogsPage from "./pages/AdminLogsPage";
import DesignTool from "./pages/DesignTool";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import StagingFlow from "./pages/StagingFlow";

export type AppView =
  | "landing"
  | "design"
  | "pricing"
  | "staging"
  | "history"
  | "admin-logs";
export type Page = "landing" | "staging" | "dashboard";

const REVIEWS = [
  {
    name: "Priya Sharma",
    location: "Mumbai, India",
    quote:
      "StagePro transformed my living room in seconds! I showed my interior designer the AI result and she was floored. We used it as the actual blueprint for the renovation.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "James O'Brien",
    location: "Dublin, Ireland",
    quote:
      "I've tried every AI design tool out there. StagePro is the only one that actually preserves the existing furniture and architecture. The results look like professional renders.",
    rating: 5,
    avatar: "JO",
  },
  {
    name: "Laila Al-Farsi",
    location: "Dubai, UAE",
    quote:
      "Used Virtual Twilight on my villa photos before listing — the property sold in 3 days. The staging photos were absolutely stunning and drew so many buyers.",
    rating: 5,
    avatar: "LA",
  },
  {
    name: "Carlos Mendez",
    location: "Mexico City, Mexico",
    quote:
      "The Japandi transformation on my bedroom was exactly what I'd been dreaming about for months. Showed my contractor and we replicated it perfectly.",
    rating: 5,
    avatar: "CM",
  },
  {
    name: "Sophie Nakamura",
    location: "Tokyo, Japan",
    quote:
      "As a real estate photographer, I use StagePro to virtually stage empty properties. My clients' listings now sell 40% faster. It's become an essential part of my workflow.",
    rating: 5,
    avatar: "SN",
  },
];

const TRANSFORMATIONS = [
  {
    label: "Modern Minimalist",
    fromGradient: "from-amber-100 to-orange-100",
    fromLabel: "Cluttered Living Room",
    toGradient: "from-slate-100 to-zinc-200",
    toLabel: "Clean & Modern",
    emoji: "🏙️",
  },
  {
    label: "Japandi Bedroom",
    fromGradient: "from-yellow-50 to-amber-100",
    fromLabel: "Plain Bedroom",
    toGradient: "from-stone-100 to-neutral-200",
    toLabel: "Serene Japandi",
    emoji: "🌿",
  },
  {
    label: "Virtual Twilight",
    fromGradient: "from-sky-100 to-blue-100",
    fromLabel: "Daytime Exterior",
    toGradient: "from-indigo-800 to-purple-900",
    toLabel: "Golden Hour Magic",
    emoji: "🌅",
  },
];

function PreLoginPage({
  onLogin,
  isInitializing,
}: { onLogin: () => void; isInitializing: boolean }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F0E6" }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "#EEE7DA", borderColor: "#DDD6C8" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "#6F9D79" }}
            >
              S
            </div>
            <span className="font-bold text-xl" style={{ color: "#111111" }}>
              StagePro
            </span>
          </div>
          <button
            type="button"
            onClick={onLogin}
            disabled={isInitializing}
            data-ocid="header.login.button"
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: "#6F9D79", color: "#fff" }}
          >
            {isInitializing ? "Loading..." : "Sign In"}
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="pt-20 pb-16 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: "#D9EFE1", color: "#4A7D5A" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Interior Design
            </div>
            <h1
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
              style={{ color: "#1A1A1A" }}
            >
              Transform Any Room
              <br />
              <span style={{ color: "#6F9D79" }}>with AI</span>
            </h1>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{ color: "#5A5A5A" }}
            >
              Upload a photo of any room and watch StagePro reimagine it in your
              dream style — in seconds, not weeks.
            </p>
            <button
              type="button"
              onClick={onLogin}
              disabled={isInitializing}
              data-ocid="hero.login.primary_button"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
              style={{ backgroundColor: "#6F9D79", color: "#fff" }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
              1 free transformation — no credit card required
            </p>
          </motion.div>
        </section>

        {/* About Us */}
        <section className="py-16 px-6" style={{ backgroundColor: "#EEE7DA" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl font-bold mb-10 text-center"
                style={{ color: "#1A1A1A" }}
              >
                About StagePro
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "✦",
                    title: "AI-Powered Redesign",
                    text: "StagePro uses state-of-the-art image AI to analyze your room's structure, lighting, and existing furniture — then reimagines it in any design style you choose, from Japandi to Art Deco.",
                  },
                  {
                    icon: "◈",
                    title: "Professional Quality",
                    text: "Every transformation is photorealistic and presentation-ready. Real estate agents use StagePro to stage listings virtually. Homeowners use it to plan renovations before spending a rupee.",
                  },
                  {
                    icon: "◉",
                    title: "Built for Everyone",
                    text: "Whether you're an interior designer, a homeowner redecorating, or a realtor staging a property — StagePro adapts to your workflow with a suite of 18+ professional AI tools.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-6 rounded-2xl"
                    style={{ backgroundColor: "#F3F0E6" }}
                  >
                    <div
                      className="text-2xl mb-3 font-bold"
                      style={{ color: "#6F9D79" }}
                    >
                      {item.icon}
                    </div>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "#1A1A1A" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#5A5A5A" }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Transformations showcase */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl font-bold mb-3 text-center"
                style={{ color: "#1A1A1A" }}
              >
                See the Transformation
              </h2>
              <p className="text-center mb-10" style={{ color: "#7A7A7A" }}>
                Before and after — AI magic in seconds
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {TRANSFORMATIONS.map((t) => (
                  <div
                    key={t.label}
                    className="rounded-2xl overflow-hidden shadow-md"
                  >
                    <div className="grid grid-cols-2">
                      <div
                        className={`bg-gradient-to-br ${t.fromGradient} p-4 flex flex-col items-center justify-center h-32`}
                      >
                        <span
                          className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2"
                          style={{ color: "#5A5A5A" }}
                        >
                          Before
                        </span>
                        <span
                          className="text-xs text-center"
                          style={{ color: "#4A4A4A" }}
                        >
                          {t.fromLabel}
                        </span>
                      </div>
                      <div
                        className={`bg-gradient-to-br ${t.toGradient} p-4 flex flex-col items-center justify-center h-32`}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2 text-white">
                          After
                        </span>
                        <span className="text-2xl">{t.emoji}</span>
                        <span
                          className="text-xs text-center mt-1"
                          style={{
                            color: t.toGradient.includes("indigo")
                              ? "#ddd"
                              : "#4A4A4A",
                          }}
                        >
                          {t.toLabel}
                        </span>
                      </div>
                    </div>
                    <div
                      className="py-2.5 px-4 text-sm font-medium text-center"
                      style={{ backgroundColor: "#EEE7DA", color: "#3A3A3A" }}
                    >
                      {t.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-16 px-6" style={{ backgroundColor: "#EEE7DA" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl font-bold mb-3 text-center"
                style={{ color: "#1A1A1A" }}
              >
                Loved by Designers Worldwide
              </h2>
              <p className="text-center mb-10" style={{ color: "#7A7A7A" }}>
                Join thousands of homeowners, realtors, and designers
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {REVIEWS.map((review) => (
                  <motion.div
                    key={review.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl flex flex-col gap-3"
                    style={{ backgroundColor: "#F3F0E6" }}
                  >
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 fill-current"
                          style={{ color: "#F59E0B" }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-sm leading-relaxed flex-1"
                      style={{ color: "#3A3A3A" }}
                    >
                      &ldquo;{review.quote}&rdquo;
                    </p>
                    <div
                      className="flex items-center gap-3 pt-2 border-t"
                      style={{ borderColor: "#DDD6C8" }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: "#6F9D79" }}
                      >
                        {review.avatar}
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#1A1A1A" }}
                        >
                          {review.name}
                        </p>
                        <p className="text-xs" style={{ color: "#9A9A9A" }}>
                          {review.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-center mb-4">
                {[1, 2, 3].map((i) => (
                  <CheckCircle
                    key={i}
                    className="w-6 h-6 -ml-1"
                    style={{ color: "#6F9D79" }}
                  />
                ))}
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "#1A1A1A" }}
              >
                Ready to transform your space?
              </h2>
              <p className="text-lg mb-8" style={{ color: "#5A5A5A" }}>
                Start with 1 free transformation — no credit card, no downloads.
              </p>
              <button
                type="button"
                onClick={onLogin}
                disabled={isInitializing}
                data-ocid="cta.login.primary_button"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
                style={{ backgroundColor: "#6F9D79", color: "#fff" }}
              >
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer
        className="py-6 text-center text-xs border-t"
        style={{ borderColor: "#DDD6C8", color: "#9A9A9A" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [principalCopied, setPrincipalCopied] = useState(false);
  const { identity, login, clear, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const { actor } = useActor();

  // Register user and then check admin status
  useEffect(() => {
    if (!isAuthenticated || !actor) return;
    (actor as any)
      .selfRegister("")
      .catch(() => {
        // "User already registered" trap is expected on subsequent logins — ignore
      })
      .then(() => {
        return (actor as any).isCallerAdmin();
      })
      .then((result: boolean) => setIsAdmin(result))
      .catch(() => setIsAdmin(false));
  }, [isAuthenticated, actor]);

  // Handle Razorpay / legacy payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "razorpay") {
      const status = params.get("razorpay_payment_link_status");
      const paymentId =
        params.get("razorpay_payment_id") ||
        params.get("razorpay_payment_link_reference_id") ||
        "";
      const plan = params.get("plan") || "";
      window.history.replaceState({}, "", window.location.pathname);

      if (status === "paid" && paymentId && plan) {
        sessionStorage.setItem(
          "pendingRazorpayPayment",
          JSON.stringify({ paymentId, plan }),
        );
        setView("design");
      } else if (status !== "paid") {
        setView("pricing");
      }
    } else if (payment === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setView("design");
    } else if (payment === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
      setView("pricing");
    }
  }, []);

  // Process pending Razorpay payment once authenticated
  useEffect(() => {
    if (!isAuthenticated || !actor) return;
    const pending = sessionStorage.getItem("pendingRazorpayPayment");
    if (!pending) return;
    sessionStorage.removeItem("pendingRazorpayPayment");

    const { paymentId, plan } = JSON.parse(pending) as {
      paymentId: string;
      plan: string;
    };
    (actor as any)
      .claimRazorpayPayment(paymentId, plan)
      .then(() => {
        toast.success(
          `🎉 ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated! Enjoy your subscription.`,
        );
      })
      .catch((err: unknown) => {
        console.error("Failed to claim payment:", err);
      });
  }, [isAuthenticated, actor]);

  // Block all access until authenticated
  if (!isAuthenticated) {
    return (
      <>
        <PreLoginPage onLogin={login} isInitializing={isInitializing} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {/* Admin badge overlay — clickable to open Admin Logs */}
      {isAdmin && (
        <button
          type="button"
          data-ocid="admin.badge"
          className="fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer select-none transition-opacity hover:opacity-80 border-0"
          style={{ backgroundColor: "#6F9D79", color: "#fff" }}
          onClick={() => setView("admin-logs")}
        >
          Admin · Logs
        </button>
      )}

      {/* Principal ID display — always visible when logged in, to help find your principal */}
      {isAuthenticated && identity && (
        <button
          type="button"
          data-ocid="principal.copy.button"
          className="fixed top-4 left-4 z-50 px-3 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer select-none transition-opacity hover:opacity-80 border-0 max-w-xs truncate"
          style={{
            backgroundColor: "#E5E0D5",
            color: "#444",
            border: "1px solid #ccc",
          }}
          onClick={() => {
            const principal = identity.getPrincipal().toText();
            navigator.clipboard.writeText(principal).then(() => {
              setPrincipalCopied(true);
              setTimeout(() => setPrincipalCopied(false), 2000);
            });
          }}
          title={identity.getPrincipal().toText()}
        >
          {principalCopied
            ? "✓ Copied!"
            : `ID: ${identity.getPrincipal().toText().slice(0, 20)}...`}
        </button>
      )}

      {view === "landing" && (
        <LandingPage
          onGetStarted={() => setView("design")}
          onPricing={() => setView("pricing")}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          onLogout={clear}
          isInitializing={isInitializing}
        />
      )}
      {view === "design" && (
        <DesignTool
          onBack={() => setView("landing")}
          onUpgrade={() => setView("pricing")}
          isAuthenticated={isAuthenticated}
          identity={identity}
          onLogin={login}
          onLogout={clear}
          onHistory={() => setView("history")}
          actor={actor}
        />
      )}
      {view === "pricing" && (
        <PricingPage
          onBack={() => setView("landing")}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          identity={identity}
        />
      )}
      {view === "staging" && (
        <StagingFlow
          navigate={(p) => {
            if (p === "landing") setView("landing");
            else if (p === "staging") setView("staging");
            else setView("landing");
          }}
          actor={actor}
          onHistory={() => setView("history")}
        />
      )}
      {view === "history" && (
        <HistoryPage onBack={() => setView("design")} actor={actor} />
      )}
      {view === "admin-logs" && (
        <AdminLogsPage onBack={() => setView("design")} actor={actor} />
      )}
      <Toaster />
    </>
  );
}
