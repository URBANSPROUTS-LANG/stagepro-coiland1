import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle,
  Github,
  Image,
  Instagram,
  Layers,
  Palette,
  Shield,
  Star,
  Twitter,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onPricing: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isInitializing: boolean;
  onGetStarted: () => void;
}

const STYLE_CARDS = [
  { name: "Modern", emoji: "🏙️" },
  { name: "Minimalist", emoji: "⬜" },
  { name: "Scandinavian", emoji: "🌲" },
  { name: "Industrial", emoji: "🏭" },
  { name: "Bohemian", emoji: "🌿" },
  { name: "Farmhouse", emoji: "🏡" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Results",
    desc: "AI generates your redesign in seconds",
  },
  {
    icon: Palette,
    title: "10+ Design Styles",
    desc: "From Modern to Art Deco and beyond",
  },
  {
    icon: Image,
    title: "HD Quality",
    desc: "Photorealistic renders you can download",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Your photos never leave your device",
  },
];

const FOOTER_PRODUCT = ["Design Tool", "Inspiration Gallery", "API"];
const FOOTER_COMPANY = ["About", "Blog", "Careers", "Contact"];
const FOOTER_LEGAL = ["Privacy Policy", "Terms of Service", "Cookie Policy"];
const STARS = [1, 2, 3, 4, 5];
const SOCIAL_ICONS = [
  { Icon: Twitter, label: "Twitter" },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Github, label: "Github" },
];

export default function LandingPage({
  onGetStarted,
  onPricing: _onPricing,
  isAuthenticated,
  onLogin,
  onLogout,
  isInitializing: _isInitializing,
}: LandingPageProps) {
  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F0E6" }}>
      {/* Header */}
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
            <span className="font-bold text-lg" style={{ color: "#111111" }}>
              StagePro
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {(["Design", "Inspiration"] as const).map((link) => (
              <button
                key={link}
                type="button"
                className="text-sm font-medium transition-colors"
                style={{ color: "#3A3A3A" }}
                onClick={link === "Design" ? onGetStarted : undefined}
                data-ocid={`nav.${link.toLowerCase()}.link`}
              >
                {link}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onLogout}
                className="text-sm font-medium"
                style={{ color: "#3A3A3A" }}
                data-ocid="nav.logout.button"
              >
                Log Out
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="text-sm font-medium"
                style={{ color: "#3A3A3A" }}
                data-ocid="nav.login.link"
              >
                Sign In
              </button>
            )}
            <Button
              onClick={onGetStarted}
              className="text-sm font-medium"
              style={{ backgroundColor: "#6F9D79", color: "#F7F7F5" }}
              data-ocid="nav.get_started.primary_button"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="pt-24 pb-16 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-sm font-medium tracking-widest uppercase mb-4"
              style={{ color: "#6F9D79" }}
            >
              StagePro — Transform Your Space Instantly
            </p>
            <h1
              className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 max-w-3xl mx-auto"
              style={{ color: "#111111" }}
            >
              AI That Designs Your Room in Seconds
            </h1>
            <p
              className="text-lg max-w-xl mx-auto mb-10"
              style={{ color: "#3A3A3A" }}
            >
              Upload a photo of any room and watch our AI transform it into a
              stunning interior design. No design experience needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="px-8 py-4 text-base font-semibold rounded-lg"
                style={{ backgroundColor: "#6F9D79", color: "#F7F7F5" }}
                data-ocid="hero.upload.primary_button"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Room Photo Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-base font-semibold rounded-lg"
                style={{
                  borderColor: "#6F9D79",
                  color: "#6F9D79",
                  backgroundColor: "transparent",
                }}
                data-ocid="hero.samples.secondary_button"
              >
                View Samples
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Mockup Showcase */}
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl overflow-hidden shadow-mockup"
            style={{ backgroundColor: "#1E2528" }}
          >
            {/* Mockup top bar */}
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div
                className="mx-auto text-xs font-medium"
                style={{ color: "#9AB" }}
              >
                StagePro Design Studio
              </div>
            </div>

            {/* Inner light UI */}
            <div className="p-6" style={{ backgroundColor: "#FAF8F1" }}>
              <h3
                className="text-xl font-bold mb-6"
                style={{ color: "#111111" }}
              >
                Your Design Journey
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div
                  className="rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3"
                  style={{ borderColor: "#DDD6C8", minHeight: 160 }}
                >
                  <Upload className="h-8 w-8" style={{ color: "#6F9D79" }} />
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#111111" }}
                  >
                    1. Upload Photo
                  </p>
                  <p
                    className="text-xs text-center"
                    style={{ color: "#6F6F6F" }}
                  >
                    Drop your room image here
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#F3F0E6" }}
                >
                  <p
                    className="font-semibold text-sm mb-3"
                    style={{ color: "#111111" }}
                  >
                    2. Select Style
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STYLE_CARDS.map((s, i) => (
                      <div
                        key={s.name}
                        className="rounded-lg p-2 text-center text-xs font-medium"
                        style={{
                          backgroundColor: i === 0 ? "#6F9D79" : "#FAF8F1",
                          color: i === 0 ? "#F7F7F5" : "#3A3A3A",
                          border: "1px solid #DDD6C8",
                        }}
                      >
                        <div className="text-lg mb-0.5">{s.emoji}</div>
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #DDD6C8" }}
                >
                  <p
                    className="font-semibold text-sm p-3"
                    style={{ color: "#111111", backgroundColor: "#F3F0E6" }}
                  >
                    3. AI Results
                  </p>
                  <div className="relative">
                    <img
                      src="/assets/generated/room-before.dim_800x500.jpg"
                      alt="Before"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <ArrowRight
                          className="h-3 w-3"
                          style={{ color: "#6F9D79" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After preview */}
              <div
                className="mt-4 rounded-xl overflow-hidden relative"
                style={{ border: "1px solid #DDD6C8" }}
              >
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img
                      src="/assets/generated/room-before.dim_800x500.jpg"
                      alt="Before"
                      className="w-full h-48 object-cover"
                    />
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold bg-white"
                      style={{ color: "#111111" }}
                    >
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="/assets/generated/room-after.dim_800x500.jpg"
                      alt="After"
                      className="w-full h-48 object-cover"
                    />
                    <div
                      className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: "#6F9D79" }}
                    >
                      After
                    </div>
                  </div>
                </div>
                <div
                  className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
                  style={{ backgroundColor: "white" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                    <Layers className="h-4 w-4" style={{ color: "#6F9D79" }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features + Success Stories */}
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Key Features */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: "#111111" }}
              >
                Key Features
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: "#FAF8F1",
                      border: "1px solid #DDD6C8",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: "#EAF1EC" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "#6F9D79" }} />
                    </div>
                    <p
                      className="font-semibold text-sm mb-1"
                      style={{ color: "#111111" }}
                    >
                      {title}
                    </p>
                    <p className="text-xs" style={{ color: "#6F6F6F" }}>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Success Stories */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: "#111111" }}
              >
                Success Stories
              </h2>
              <div className="space-y-4">
                <div
                  className="flex gap-4 p-4 rounded-xl"
                  style={{
                    backgroundColor: "#FAF8F1",
                    border: "1px solid #DDD6C8",
                  }}
                >
                  <img
                    src="/assets/generated/success-bedroom.dim_400x280.jpg"
                    alt="Luxury bedroom transformation"
                    className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {STARS.map((n) => (
                        <Star
                          key={n}
                          className="h-3 w-3 fill-current"
                          style={{ color: "#F0B429" }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#111111" }}
                    >
                      &ldquo;Completely transformed my bedroom!&rdquo;
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6F6F6F" }}>
                      Sarah K. — Dark navy &amp; gold luxury redesign
                    </p>
                  </div>
                </div>
                <div
                  className="flex gap-4 p-4 rounded-xl"
                  style={{
                    backgroundColor: "#FAF8F1",
                    border: "1px solid #DDD6C8",
                  }}
                >
                  <img
                    src="/assets/generated/success-kitchen.dim_400x280.jpg"
                    alt="Industrial kitchen transformation"
                    className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {STARS.map((n) => (
                        <Star
                          key={n}
                          className="h-3 w-3 fill-current"
                          style={{ color: "#F0B429" }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#111111" }}
                    >
                      &ldquo;The kitchen industrial look is perfect!&rdquo;
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6F6F6F" }}>
                      Marcus T. — Industrial loft kitchen redesign
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <CheckCircle
                    className="h-4 w-4"
                    style={{ color: "#6F9D79" }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#3A3A3A" }}
                  >
                    Over 50,000 rooms redesigned worldwide
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center rounded-2xl py-16 px-8"
            style={{ backgroundColor: "#1E2528" }}
          >
            <Wand2
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "#6F9D79" }}
            />
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "#F7F7F5" }}
            >
              Ready to Transform Your Space?
            </h2>
            <p className="mb-8" style={{ color: "#9AB" }}>
              Upload your room photo and experience AI-powered interior design
              for free.
            </p>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="px-10 py-4 text-base font-semibold"
              style={{ backgroundColor: "#6F9D79", color: "#F7F7F5" }}
              data-ocid="cta.start.primary_button"
            >
              Start Designing Now &mdash; It&apos;s Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "#1F2A2E", color: "#D7DADB" }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: "#6F9D79" }}
                >
                  A
                </div>
                <span
                  className="font-bold text-lg"
                  style={{ color: "#F7F7F5" }}
                >
                  StagePro
                </span>
              </div>
              <p className="text-sm" style={{ color: "#9AB" }}>
                AI-powered interior design for everyone.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4
                className="font-semibold mb-4 text-sm"
                style={{ color: "#F7F7F5" }}
              >
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                {FOOTER_PRODUCT.map((l) => (
                  <li key={l}>
                    <a
                      href="/"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: "#9AB" }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                className="font-semibold mb-4 text-sm"
                style={{ color: "#F7F7F5" }}
              >
                Company
              </h4>
              <ul className="space-y-2 text-sm">
                {FOOTER_COMPANY.map((l) => (
                  <li key={l}>
                    <a
                      href="/"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: "#9AB" }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                className="font-semibold mb-4 text-sm"
                style={{ color: "#F7F7F5" }}
              >
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                {FOOTER_LEGAL.map((l) => (
                  <li key={l}>
                    <a
                      href="/"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: "#9AB" }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <p className="text-sm" style={{ color: "#9AB" }}>
              &copy; {year}. Built with &hearts; using{" "}
              <a
                href={caffeineHref}
                className="underline hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#D7DADB" }}
              >
                caffeine.ai
              </a>
            </p>
            <div className="flex gap-4">
              {SOCIAL_ICONS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="/"
                  aria-label={label}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: "#D7DADB" }}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
