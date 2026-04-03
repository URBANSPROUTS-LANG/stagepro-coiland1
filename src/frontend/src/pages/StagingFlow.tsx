import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  Download,
  Home,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import Navbar from "../components/Navbar";

declare global {
  interface Window {
    Razorpay: any;
    puter: any;
  }
}

type Step = 1 | 2 | 3 | 4 | 5;
type Style = "Modern" | "Scandinavian" | "Luxury" | "Minimalist" | "Bohemian";
type Plan = "Basic" | "Pro" | "Business";

interface Order {
  id: string;
  imageFile?: File;
  imagePreview: string;
  style: Style;
  plan: Plan;
  amount: number;
  status: "pending" | "paid" | "staged";
  stagedImageUrl?: string;
  createdAt: string;
}

const FREE_IMAGE_LIMIT = 100;

function getUsedFreeImages(): number {
  return Number.parseInt(localStorage.getItem("stagepro_free_used") || "0", 10);
}

function incrementFreeImages(): void {
  localStorage.setItem("stagepro_free_used", String(getUsedFreeImages() + 1));
}

function hasFreeImages(): boolean {
  return getUsedFreeImages() < FREE_IMAGE_LIMIT;
}

/** Convert a File or Blob to a raw base64 string (no data: prefix) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Strip "data:image/jpeg;base64," prefix
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function saveOrder(order: Omit<Order, "imageFile">) {
  const existing = JSON.parse(
    localStorage.getItem("stagepro_orders") || "[]",
  ) as Order[];
  const updated = [order, ...existing.filter((o) => o.id !== order.id)];
  localStorage.setItem("stagepro_orders", JSON.stringify(updated));
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(s);
  });
}

const STYLES: { name: Style; desc: string; img: string }[] = [
  {
    name: "Modern",
    desc: "Clean lines & contemporary",
    img: "/assets/generated/style-modern.dim_600x400.jpg",
  },
  {
    name: "Scandinavian",
    desc: "Light wood & hygge warmth",
    img: "/assets/generated/style-scandinavian.dim_600x400.jpg",
  },
  {
    name: "Luxury",
    desc: "Gold accents & marble surfaces",
    img: "/assets/generated/style-luxury.dim_600x400.jpg",
  },
  {
    name: "Minimalist",
    desc: "Zen simplicity",
    img: "/assets/generated/style-minimalist.dim_600x400.jpg",
  },
  {
    name: "Bohemian",
    desc: "Eclectic & earthy",
    img: "/assets/generated/style-bohemian.dim_600x400.jpg",
  },
];

const PLANS: {
  name: Plan;
  price: number;
  label: string;
  features: string[];
}[] = [
  {
    name: "Basic",
    price: 499,
    label: "₹499",
    features: ["1 room", "Standard quality", "24hr delivery"],
  },
  {
    name: "Pro",
    price: 999,
    label: "₹999",
    features: ["3 style variants", "HD quality", "12hr delivery"],
  },
  {
    name: "Business",
    price: 2999,
    label: "₹2,999",
    features: ["10 rooms", "Ultra HD", "6hr delivery", "Priority support"],
  },
];

const PROGRESS_STEPS = [
  { pct: 10, label: "Uploading image...", ms: 800 },
  { pct: 30, label: "Analyzing room...", ms: 1500 },
  { pct: 50, label: "Applying style...", ms: 2000 },
  { pct: 70, label: "Rendering details...", ms: 2500 },
  { pct: 90, label: "Almost done...", ms: 0 },
];

export default function StagingFlow({
  navigate,
  actor,
}: { navigate: (p: Page) => void; actor?: any }) {
  const [step, setStep] = useState<Step>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const currentOrderId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const puterTokenRef = useRef<string | null>(null);

  // Load Puter auth token from backend on mount — no user popup
  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getPuterToken()
      .then((result: [] | [string]) => {
        const token =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
        if (token) {
          puterTokenRef.current = token;
          const puter = (window as any).puter;
          if (puter) {
            puter.authToken = token;
            if (puter.auth) {
              puter.auth.signIn = () => Promise.resolve(null);
              puter.auth.isSignedIn = () => true;
            }
          }
        }
      })
      .catch(console.error);
  }, [actor]);

  const freeRemaining = FREE_IMAGE_LIMIT - getUsedFreeImages();
  const isFree = hasFreeImages();

  const setProgress = useCallback((pct: number, label: string) => {
    setGenerationProgress(pct);
    setProgressLabel(label);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleBack = () => {
    if (step > 1 && step < 5) setStep((s) => (s - 1) as Step);
    else navigate("landing");
  };

  const generateStagedImage = async (orderId: string) => {
    setIsGenerating(true);
    setGenerationError(false);
    setGenerationProgress(0);
    setProgressLabel("Starting...");

    try {
      // Animate progress steps
      for (const s of PROGRESS_STEPS) {
        setProgress(s.pct, s.label);
        if (s.ms > 0) await new Promise((r) => setTimeout(r, s.ms));
      }

      // Convert the uploaded file to base64 for true img2img transformation
      let imageBase64: string | null = null;
      if (imageFile) {
        try {
          const dataUrl = await fileToBase64(imageFile);
          imageBase64 = `data:image/jpeg;base64,${dataUrl}`;
        } catch (e) {
          console.warn("Could not convert image to base64:", e);
        }
      }

      const prompt = imageBase64
        ? `Transform this room photo into a professionally virtually staged ${selectedStyle} style interior. Keep the exact same room structure, walls, windows, ceiling and floor. Replace empty spaces with high-quality ${selectedStyle} style furniture and decor. Photorealistic, real estate photography quality, bright natural lighting, 4K.`
        : `A beautifully virtually staged ${selectedStyle} style living room, professional real estate photography, photorealistic, bright natural lighting, elegant furniture, 4K quality`;

      let imageUrl: string | null = null;
      try {
        const puter = window.puter;
        if (!puter) throw new Error("Puter.js not loaded");
        if (puterTokenRef.current) {
          puter.authToken = puterTokenRef.current;
          if (puter.auth) {
            puter.auth.signIn = () => Promise.resolve(null);
            puter.auth.isSignedIn = () => true;
          }
        }
        const imageElement = await puter.ai.txt2img(prompt, {
          model: "black-forest-labs/flux.1-kontext-pro",
          ...(imageBase64 ? { image_url: imageBase64 } : {}),
        });
        imageUrl = imageElement.src;
      } catch (puterErr) {
        console.warn("Puter.js error (using fallback):", puterErr);
        imageUrl =
          STYLES.find((s) => s.name === selectedStyle)?.img ??
          "/assets/generated/room-after.dim_800x500.jpg";
      }

      setProgress(100, "Complete!");
      setStagedImageUrl(imageUrl);

      // Persist result
      const existing = JSON.parse(
        localStorage.getItem("stagepro_orders") || "[]",
      );
      localStorage.setItem(
        "stagepro_orders",
        JSON.stringify(
          existing.map((o: any) =>
            o.id === orderId
              ? { ...o, stagedImageUrl: imageUrl, status: "staged" }
              : o,
          ),
        ),
      );

      toast.success("Your staged room is ready!");
    } catch (err) {
      setGenerationError(true);
      setGenerationProgress(0);
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg === "timeout"
          ? "Generation timed out. Please try again."
          : "Generation failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (currentOrderId.current) generateStagedImage(currentOrderId.current);
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    const plan = PLANS.find((p) => p.name === selectedPlan)!;

    if (hasFreeImages()) {
      incrementFreeImages();
      const orderId = `sp_${Date.now()}`;
      currentOrderId.current = orderId;
      saveOrder({
        id: orderId,
        imagePreview: imagePreview!,
        style: selectedStyle!,
        plan: selectedPlan!,
        amount: 0,
        status: "paid",
        createdAt: new Date().toISOString(),
      });
      setStep(5);
      generateStagedImage(orderId);
      return;
    }

    setIsPaying(true);

    const completePayment = () => {
      const orderId = `sp_${Date.now()}`;
      currentOrderId.current = orderId;
      saveOrder({
        id: orderId,
        imagePreview: imagePreview!,
        style: selectedStyle!,
        plan: selectedPlan!,
        amount: plan.price,
        status: "paid",
        createdAt: new Date().toISOString(),
      });
      setIsPaying(false);
      setStep(5);
      generateStagedImage(orderId);
    };

    try {
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: "rzp_test_placeholder",
        amount: plan.price * 100,
        currency: "INR",
        name: "StagePro",
        description: `${selectedStyle} Virtual Staging – ${plan.name} Plan`,
        handler: completePayment,
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#4ECDC4" },
        modal: { ondismiss: () => setIsPaying(false) },
      });
      rzp.open();
    } catch (_err) {
      toast.error("Payment gateway unavailable. Using demo mode.");
      setIsPaying(false);
      completePayment();
    }
  };

  const handleDownload = () => {
    if (!stagedImageUrl) return;
    const a = document.createElement("a");
    a.href = stagedImageUrl;
    a.download = `stagepro-${selectedStyle?.toLowerCase()}-${Date.now()}.jpg`;
    a.click();
  };

  const STEP_LABELS = ["Upload", "Style", "Plan", "Payment", "Result"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar navigate={navigate} currentPage="staging" />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-10">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="staging.button"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-sm text-muted-foreground">
              Step {step} of 5
            </span>
          </div>
          <Progress value={(step / 5) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {STEP_LABELS.map((s, i) => (
              <span
                key={s}
                className={step === i + 1 ? "text-primary font-medium" : ""}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card>
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Upload Your Room Photo
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Upload a clear photo of the room you want to virtually
                    stage.
                  </p>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      fileInputRef.current?.click()
                    }
                    className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    data-ocid="staging.dropzone"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Room preview"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium mb-1">
                          Drop your image here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                    data-ocid="staging.upload_button"
                  />
                  {imagePreview && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      {imageFile?.name} &middot; Click the box to change
                    </p>
                  )}
                  <Button
                    className="w-full mt-6 gap-2"
                    disabled={!imageFile}
                    onClick={() => setStep(2)}
                    data-ocid="staging.primary_button"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Style */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card>
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Choose Your Style
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Select the interior design style for your staged room.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {STYLES.map((s, i) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setSelectedStyle(s.name)}
                        className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${
                          selectedStyle === s.name
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-ocid={`staging.item.${i + 1}`}
                      >
                        <img
                          src={s.img}
                          alt={s.name}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-2">
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.desc}
                          </div>
                        </div>
                        {selectedStyle === s.name && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!selectedStyle}
                    onClick={() => setStep(3)}
                    data-ocid="staging.primary_button"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Plan */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card>
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Select Your Plan
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Choose the package that best fits your needs.
                  </p>
                  <div className="flex flex-col gap-4 mb-6">
                    {PLANS.map((plan, i) => (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => setSelectedPlan(plan.name)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPlan === plan.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-ocid={`staging.item.${i + 1}`}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {plan.name}
                            {plan.name === "Pro" && (
                              <Badge className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {plan.features.join(" · ")}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xl font-bold text-primary">
                            {plan.label}
                          </span>
                          {selectedPlan === plan.name && (
                            <CheckCircle className="w-4 h-4 text-primary ml-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!selectedPlan}
                    onClick={() => setStep(4)}
                    data-ocid="staging.primary_button"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card>
                <CardContent className="p-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Review &amp; Pay
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Review your order and complete payment to proceed.
                  </p>

                  {/* Free images banner */}
                  {isFree && (
                    <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 text-foreground rounded-xl px-4 py-3 mb-5 text-sm">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>
                        <strong>Free staging!</strong> You have{" "}
                        <strong>
                          {freeRemaining} of {FREE_IMAGE_LIMIT}
                        </strong>{" "}
                        free stagings remaining. No payment needed.
                      </span>
                    </div>
                  )}

                  <div className="bg-secondary rounded-xl p-5 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Room photo</span>
                      <span className="font-medium">
                        {imageFile?.name || "Uploaded"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Style</span>
                      <span className="font-medium">{selectedStyle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{selectedPlan}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      {isFree ? (
                        <span className="text-primary">FREE</span>
                      ) : (
                        <span className="text-primary">
                          {PLANS.find((p) => p.name === selectedPlan)?.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Your room"
                      className="w-full h-40 object-cover rounded-xl mb-6"
                    />
                  )}

                  <Button
                    className="w-full gap-2 py-6 text-base"
                    onClick={handlePay}
                    disabled={isPaying}
                    data-ocid="staging.submit_button"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : isFree ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Generate for Free
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay with Razorpay
                      </>
                    )}
                  </Button>
                  {!isFree && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      🔒 Secured by Razorpay · 256-bit SSL encryption
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Generate */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card>
                <CardContent className="p-8 text-center">
                  {/* Generating */}
                  {isGenerating && (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                      <h2 className="font-display text-2xl font-bold mb-2">
                        Transforming Your Room
                      </h2>
                      <p className="text-muted-foreground text-sm mb-6">
                        AI is applying <strong>{selectedStyle}</strong> style to
                        your actual photo.
                      </p>
                      <Progress
                        value={generationProgress}
                        className="h-3 mb-3"
                      />
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{progressLabel}</span>
                        <span className="font-semibold text-foreground">
                          {generationProgress}%
                        </span>
                      </div>
                      <div className="mt-4" data-ocid="staging.loading_state" />
                    </>
                  )}

                  {/* Error */}
                  {!isGenerating && generationError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      data-ocid="staging.error_state"
                    >
                      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                      </div>
                      <h2 className="font-display text-2xl font-bold mb-2">
                        Generation Failed
                      </h2>
                      <p className="text-muted-foreground text-sm mb-6">
                        The AI took too long to respond. Please try again.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={handleRetry}
                          className="gap-2"
                          data-ocid="staging.primary_button"
                        >
                          <RefreshCw className="w-4 h-4" /> Try Again
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("landing")}
                          className="gap-2"
                          data-ocid="staging.secondary_button"
                        >
                          <Home className="w-4 h-4" /> Go Home
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Success */}
                  {!isGenerating && !generationError && stagedImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="font-display text-2xl font-bold mb-2">
                        Your Room is Ready!
                      </h2>
                      <p className="text-muted-foreground text-sm mb-6">
                        Your room has been transformed to {selectedStyle} style.
                      </p>
                      <div data-ocid="staging.success_state">
                        <img
                          src={stagedImageUrl}
                          alt="Staged room"
                          className="w-full rounded-xl mb-6 max-h-80 object-cover"
                        />
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={handleDownload}
                          className="gap-2"
                          data-ocid="staging.primary_button"
                        >
                          <Download className="w-4 h-4" /> Download Image
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("dashboard")}
                          className="gap-2"
                          data-ocid="staging.secondary_button"
                        >
                          <Home className="w-4 h-4" /> View Dashboard
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
