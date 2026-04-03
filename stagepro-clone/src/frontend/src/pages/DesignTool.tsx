import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Identity } from "@icp-sdk/core/agent";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Clapperboard,
  Clock,
  CloudSun,
  Crown,
  Download,
  Droplets,
  Eraser,
  Gift,
  Globe,
  ImagePlus,
  Layers,
  LayoutGrid,
  Leaf,
  Loader2,
  LogIn,
  Menu,
  Moon,
  Sofa,
  Sparkles,
  Sun,
  Sunset,
  TreePine,
  Video,
  Wand2,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import { useActor } from "../hooks/useActor";

interface DesignToolProps {
  onBack: () => void;
  onUpgrade: () => void;
  isAuthenticated: boolean;
  identity?: Identity;
  onLogin: () => void;
  onLogout?: () => void;
}

interface Generation {
  id: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  tool: string;
  roomType: string;
  style: string;
  instructions: string;
  version: number;
  timestamp: Date;
}

interface VideoGeneration {
  id: string;
  originalImageUrl: string;
  videoUrl: string;
  prompt: string;
  duration: number;
  resolution: string;
  timestamp: Date;
}

interface SubscriptionInfo {
  photosUsed: bigint;
  plan: string;
  videoLimit: bigint;
  videosUsed: bigint;
  photoLimit: bigint;
}

const _FREE_PHOTO_LIMIT = 9999;
const _FREE_VIDEO_LIMIT = 9999;
const FREE_USAGE_KEY = "stagepro_free_usage";

function getFreeUsage() {
  try {
    const raw = localStorage.getItem(FREE_USAGE_KEY);
    if (!raw) return { photos: 0, videos: 0 };
    return JSON.parse(raw) as { photos: number; videos: number };
  } catch {
    return { photos: 0, videos: 0 };
  }
}

function setFreeUsage(usage: { photos: number; videos: number }) {
  localStorage.setItem(FREE_USAGE_KEY, JSON.stringify(usage));
}

const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
];

const DESIGN_STYLES = [
  "Modern",
  "Scandinavian",
  "Industrial",
  "Bohemian",
  "Minimalist",
  "Traditional",
  "Contemporary",
  "Rustic",
  "Mid-Century",
  "Coastal",
  "Japandi",
  "Art Deco",
  "Farmhouse",
  "Mediterranean",
];

type ToolId =
  | "NONE_INTERIOR"
  | "ADD_FURNITURE"
  | "FURNITURE_ERASER"
  | "ROOM_DECLUTTERING"
  | "ENHANCE_PHOTO_QUALITY"
  | "MATERIAL_OVERLAY"
  | "AI_DESIGN_AGENT"
  | "MULTI_ANGLE_STAGING"
  | "VIRTUAL_TWILIGHT"
  | "CHANGING_SEASONS"
  | "NIGHT_TO_DAY"
  | "RAIN_TO_SHINE"
  | "NATURAL_TWILIGHT"
  | "HOLIDAY_CARD"
  | "POOL_WATER_ENHANCEMENT"
  | "LAWN_REPLACEMENT"
  | "ADD_WATER_POOL"
  | "AI_VIRTUAL_TOUR"
  | "AI_360_PANORAMA"
  | "IMAGE_TO_VIDEO";

interface Tool {
  id: ToolId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  beta?: boolean;
  modifiesFurniture?: boolean;
  prompt: (roomType: string, style: string) => string;
}

interface ToolGroup {
  label: string;
  tools: Tool[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    label: "Interior Design",
    tools: [
      {
        id: "NONE_INTERIOR",
        modifiesFurniture: false,
        label: "None",
        icon: LayoutGrid,
        prompt: (roomType, style) =>
          `Enhance and beautify this ${roomType || "room"}${style ? ` in ${style} style` : ""}. Preserve all existing furniture and structural elements unless a style is specified.`,
      },
      {
        id: "ADD_FURNITURE",
        modifiesFurniture: true,
        label: "Add Furniture",
        icon: Sofa,
        prompt: (roomType, style) =>
          `Add tasteful, well-placed furniture to this ${roomType || "room"}${style ? ` in ${style} style` : ""}. Do not change walls, floors, windows or structural elements.`,
      },
      {
        id: "FURNITURE_ERASER",
        modifiesFurniture: true,
        label: "Furniture Eraser",
        icon: Eraser,
        prompt: (roomType) =>
          `Remove all furniture from this ${roomType || "room"}, leaving only the walls, floors, windows, and structural elements. Make it look clean and empty.`,
      },
      {
        id: "ROOM_DECLUTTERING",
        modifiesFurniture: true,
        label: "Room Decluttering",
        icon: Sparkles,
        prompt: (roomType) =>
          `Declutter and organize this ${roomType || "room"}. Remove unnecessary items, tidy up surfaces, keep the essential furniture.`,
      },
      {
        id: "ENHANCE_PHOTO_QUALITY",
        label: "Enhance Photo Quality",
        icon: Wand2,
        prompt: (roomType) =>
          `Enhance the photo quality of this ${roomType || "room"} image. Improve lighting, sharpness, color balance and overall visual quality without changing any design elements.`,
      },
      {
        id: "MATERIAL_OVERLAY",
        label: "Material Overlay",
        icon: Layers,
        prompt: (roomType, style) =>
          `Apply a premium material overlay to the surfaces in this ${roomType || "room"}${style ? ` with a ${style} aesthetic` : ""}. Update wall textures, floor materials, and finishes to look high-end.`,
      },
      {
        id: "AI_DESIGN_AGENT",
        modifiesFurniture: true,
        label: "AI Design Agent",
        icon: Bot,
        prompt: (roomType, style) =>
          `Act as an expert interior design agent. Comprehensively redesign this ${roomType || "room"}${style ? ` in ${style} style` : ""} with the best design choices for the space, optimizing layout, furniture, colors and lighting.`,
      },
      {
        id: "MULTI_ANGLE_STAGING",
        modifiesFurniture: true,
        label: "Multi-Angle Staging",
        icon: LayoutGrid,
        prompt: (roomType, style) =>
          `Stage this ${roomType || "room"}${style ? ` in ${style} style` : ""} for real estate with professional interior design. Add furniture, decor and lighting that would appeal to potential buyers.`,
      },
    ],
  },
  {
    label: "Seasonal & Lighting",
    tools: [
      {
        id: "VIRTUAL_TWILIGHT",
        label: "Virtual Twilight",
        icon: Sunset,
        prompt: () =>
          "Transform this exterior/room photo to a beautiful virtual twilight scene with warm golden-hour lighting, glowing windows, and a dusk sky.",
      },
      {
        id: "CHANGING_SEASONS",
        label: "Changing Seasons",
        icon: Leaf,
        prompt: () =>
          "Transform the season visible in this image. Change the outdoor environment and lighting to show a different season while keeping the building/room unchanged.",
      },
      {
        id: "NIGHT_TO_DAY",
        label: "Night to Day",
        icon: Sun,
        prompt: () =>
          "Transform this night scene to a bright daytime scene with natural daylight, blue sky, and appropriate lighting. Keep the room/building structure identical.",
      },
      {
        id: "RAIN_TO_SHINE",
        label: "Rain to Shine",
        icon: CloudSun,
        prompt: () =>
          "Transform this rainy scene to bright sunshine weather. Remove rain, add blue sky and warm sunlight. Keep all structural elements identical.",
      },
      {
        id: "NATURAL_TWILIGHT",
        label: "Natural Twilight",
        icon: Moon,
        prompt: () =>
          "Create a natural twilight atmosphere for this scene with soft purple-pink sky, balanced ambient lighting, and a serene dusk mood.",
      },
      {
        id: "HOLIDAY_CARD",
        modifiesFurniture: true,
        label: "AI Holiday Card",
        icon: Gift,
        prompt: () =>
          "Transform this room/home into a beautiful AI holiday card scene with festive decorations, warm lighting, and seasonal charm.",
      },
    ],
  },
  {
    label: "Outdoor Features",
    tools: [
      {
        id: "POOL_WATER_ENHANCEMENT",
        label: "Pool Water Enhancement",
        icon: Waves,
        prompt: () =>
          "Enhance the pool water in this image to look crystal clear, vibrant blue, and inviting. Keep all surrounding elements the same.",
      },
      {
        id: "LAWN_REPLACEMENT",
        label: "Lawn Replacement",
        icon: TreePine,
        prompt: () =>
          "Replace the existing lawn in this image with lush, perfectly manicured green grass. Keep all other elements unchanged.",
      },
      {
        id: "ADD_WATER_POOL",
        label: "Add Water to an Empty Pool",
        icon: Droplets,
        prompt: () =>
          "Add realistic, crystal-clear water to this empty pool. Make it look inviting and properly filled. Keep surrounding area unchanged.",
      },
    ],
  },
  {
    label: "Video Generation",
    tools: [
      {
        id: "IMAGE_TO_VIDEO",
        label: "Image to Video",
        icon: Clapperboard,
        prompt: () =>
          "Animate this room with smooth, cinematic camera movement.",
      },
      {
        id: "AI_VIRTUAL_TOUR",
        label: "AI Virtual Tour",
        icon: Video,
        prompt: (roomType) =>
          `Smooth cinematic walkthrough of this ${roomType || "room"}, professional virtual tour style.`,
      },
      {
        id: "AI_360_PANORAMA",
        label: "AI 360° Panorama",
        icon: Globe,
        beta: true,
        prompt: () =>
          "360-degree panoramic sweep of this room with smooth rotation.",
      },
    ],
  },
];

const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools);

const STATUS_MESSAGES = [
  "Analyzing your room...",
  "Applying transformation...",
  "Rendering details...",
  "Adjusting lighting...",
  "Finalizing details...",
];

const VIDEO_STATUS_MESSAGES = [
  "Analyzing image...",
  "Generating video frames...",
  "Rendering motion...",
  "Encoding video...",
  "Finalizing...",
];

const DURATION_OPTIONS = [
  { label: "4s", value: 4 },
  { label: "8s", value: 8 },
  { label: "12s", value: 12 },
];

const RESOLUTION_OPTIONS = ["1280x720", "720x1280", "1024x1024"];

function SidebarContent({
  selectedTool,
  onSelect,
  selectedStyle,
  onStyleSelect,
  customThemes,
  selectedCustomThemeId,
  onCustomThemeSelect,
  onAddThemeClick,
  onDeleteCustomTheme,
  isAuthenticated,
}: {
  selectedTool: ToolId;
  onSelect: (id: ToolId) => void;
  selectedStyle: string | null;
  onStyleSelect: (style: string | null) => void;
  customThemes: Array<{ id: string; name: string; prompt: string }>;
  selectedCustomThemeId: string | null;
  onCustomThemeSelect: (
    id: string | null,
    name: string,
    prompt: string,
  ) => void;
  onAddThemeClick: () => void;
  onDeleteCustomTheme: (id: string) => void;
  isAuthenticated: boolean;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="py-3 pb-8">
        {/* Design Styles */}
        <div className="mb-2">
          <p
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#9CA3AF" }}
          >
            Design Style
          </p>
          <div className="px-3 flex flex-wrap gap-1.5 pb-2">
            <button
              type="button"
              onClick={() => onStyleSelect(null)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: selectedStyle === null ? "#4ECDC4" : "#F3F4F6",
                color: selectedStyle === null ? "#FFFFFF" : "#6B7280",
                border:
                  selectedStyle === null
                    ? "1px solid #4ECDC4"
                    : "1px solid #E2E8F0",
              }}
            >
              No Style
            </button>
            {DESIGN_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() =>
                  onStyleSelect(selectedStyle === style ? null : style)
                }
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor:
                    selectedStyle === style ? "#4ECDC4" : "#F3F4F6",
                  color: selectedStyle === style ? "#FFFFFF" : "#374151",
                  border:
                    selectedStyle === style
                      ? "1px solid #4ECDC4"
                      : "1px solid #E2E8F0",
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* My Themes */}
        {isAuthenticated && (
          <div className="mb-2">
            <div className="px-3 py-2 flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#9CA3AF" }}
              >
                My Themes
              </p>
              <button
                type="button"
                onClick={onAddThemeClick}
                className="text-xs font-medium px-2 py-0.5 rounded-full transition-colors hover:opacity-80"
                style={{ backgroundColor: "#E6F7F6", color: "#2D9B94" }}
                data-ocid="design.themes.open_modal_button"
              >
                + Add
              </button>
            </div>
            <div className="px-3 flex flex-wrap gap-1.5 pb-2">
              {customThemes.length === 0 ? (
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  No custom themes yet.
                </p>
              ) : (
                customThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        selectedCustomThemeId === theme.id
                          ? "#4ECDC4"
                          : "#F3F4F6",
                      color:
                        selectedCustomThemeId === theme.id
                          ? "#FFFFFF"
                          : "#374151",
                      border:
                        selectedCustomThemeId === theme.id
                          ? "1px solid #4ECDC4"
                          : "1px solid #E2E8F0",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        selectedCustomThemeId === theme.id
                          ? onCustomThemeSelect(null, "", "")
                          : onCustomThemeSelect(
                              theme.id,
                              theme.name,
                              theme.prompt,
                            )
                      }
                      data-ocid="design.custom-theme.toggle"
                    >
                      {theme.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomTheme(theme.id)}
                      className="ml-0.5 hover:opacity-70 flex-shrink-0"
                      style={{
                        color:
                          selectedCustomThemeId === theme.id
                            ? "#FFFFFF"
                            : "#9CA3AF",
                      }}
                      data-ocid="design.custom-theme.delete_button"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tools */}
        {TOOL_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <p
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#9CA3AF" }}
            >
              {group.label}
            </p>
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelect(tool.id)}
                  className="w-full flex items-center gap-2.5 py-2 px-3 transition-colors text-left"
                  style={{
                    backgroundColor: isActive ? "#E6F7F6" : "transparent",
                    borderLeft: isActive
                      ? "2px solid #4ECDC4"
                      : "2px solid transparent",
                    color: isActive ? "#4ECDC4" : "#374151",
                  }}
                  data-ocid={`sidebar.${tool.id.toLowerCase()}.button`}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#F8F9FA";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span
                    className="text-sm flex-1 leading-tight"
                    style={{ color: isActive ? "#4ECDC4" : "#374151" }}
                  >
                    {tool.label}
                  </span>
                  {tool.beta && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#CCFAF7", color: "#0D9488" }}
                    >
                      Beta
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function DesignTool({
  onBack,
  onUpgrade,
  isAuthenticated,
  identity: _identity,
  onLogin,
  onLogout,
}: DesignToolProps) {
  const { actor } = useActor();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolId>("NONE_INTERIOR");
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [videoGenerations, setVideoGenerations] = useState<VideoGeneration[]>(
    [],
  );
  const [refineTargetId, setRefineTargetId] = useState<string | null>(null);
  const [videoRefineTargetId, setVideoRefineTargetId] = useState<string | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [selectedResolution, setSelectedResolution] = useState("1280x720");
  const [historyTab, setHistoryTab] = useState<"images" | "videos">("images");
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [freeUsage, setFreeUsageState] = useState(getFreeUsage);

  // Custom themes
  const [customThemes, setCustomThemes] = useState<
    Array<{ id: string; name: string; prompt: string; createdAt: bigint }>
  >([]);
  const [selectedCustomThemeId, setSelectedCustomThemeId] = useState<
    string | null
  >(null);
  const [customThemePrompt, setCustomThemePrompt] = useState<string>("");
  const [isAddThemeOpen, setIsAddThemeOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemePromptText, setNewThemePromptText] = useState("");
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Multi-image upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const addImageInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const puterTokenRef = useRef<string | null>(null);

  const activeTool =
    ALL_TOOLS.find((t) => t.id === selectedTool) ?? ALL_TOOLS[0];
  const isVideoMode =
    selectedTool === "IMAGE_TO_VIDEO" ||
    selectedTool === "AI_VIRTUAL_TOUR" ||
    selectedTool === "AI_360_PANORAMA";

  const totalCount = generations.length + videoGenerations.length;

  // Load subscription info when authenticated
  useEffect(() => {
    if (isAuthenticated && actor) {
      setSubscriptionLoading(true);
      (actor as any)
        .getMySubscription()
        .then((info: SubscriptionInfo) => {
          setSubscriptionInfo(info);
          setSubscriptionLoading(false);
        })
        .catch((err: unknown) => {
          console.error(err);
          setSubscriptionLoading(false);
        });
    }
  }, [isAuthenticated, actor]);

  // Initialize Puter token from backend canister (no login required)
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
          if (puterTokenRef.current) {
            puter.authToken = token;
            // Permanently suppress any auth popups
            if (puter.auth) {
              puter.auth.signIn = () => Promise.resolve(null);
            }
          }
        }
      })
      .catch(console.error);
  }, [actor]);

  // Load custom themes when authenticated
  const loadCustomThemes = async () => {
    if (isAuthenticated && actor) {
      try {
        const themes = await (actor as any).getMyCustomThemes();
        setCustomThemes(themes);
      } catch (e) {
        console.error("Failed to load custom themes", e);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && actor) {
      (actor as any)
        .getMyCustomThemes()
        .then(
          (
            themes: Array<{
              id: string;
              name: string;
              prompt: string;
              createdAt: bigint;
            }>,
          ) => setCustomThemes(themes),
        )
        .catch(console.error);
    }
  }, [isAuthenticated, actor]);

  const handleAddCustomTheme = async () => {
    if (!newThemeName.trim() || !newThemePromptText.trim()) {
      toast.error("Theme name and prompt are required");
      return;
    }
    setIsSavingTheme(true);
    try {
      await (actor as any).addCustomTheme(
        newThemeName.trim(),
        newThemePromptText.trim(),
      );
      await loadCustomThemes();
      setNewThemeName("");
      setNewThemePromptText("");
      setIsAddThemeOpen(false);
      toast.success("Theme saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save theme");
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    try {
      await (actor as any).deleteCustomTheme(themeId);
      if (selectedCustomThemeId === themeId) {
        setSelectedCustomThemeId(null);
        setCustomThemePrompt("");
      }
      await loadCustomThemes();
      toast.success("Theme deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete theme");
    }
  };

  const handleCustomThemeSelect = (
    id: string | null,
    _name: string,
    prompt: string,
  ) => {
    setSelectedCustomThemeId(id);
    setCustomThemePrompt(prompt);
    // Clear built-in style when custom theme selected
    if (id) setSelectedStyle(null);
  };

  // Compute effective limits
  // While subscription is loading, use generous limits so the create button isn't blocked.
  // Once loaded, use the actual plan limits. If no subscription found, fall back to free limits.
  // UNLIMITED MODE
  const photoLimit = 9999;
  const videoLimit = 9999;
  const photosUsed = 0;
  const videosUsed = 0;

  const photosRemaining = Math.max(0, photoLimit - photosUsed);
  const videosRemaining = Math.max(0, videoLimit - videosUsed);

  useEffect(() => {
    if (totalCount > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [totalCount]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Also add to multi-image list (max 4)
    setUploadedFiles((prev) => {
      if (prev.length >= 4) return prev;
      return [...prev, file];
    });
    const r2 = new FileReader();
    r2.onload = (e) => {
      const url = e.target?.result as string;
      setUploadedImageUrls((prev) => {
        if (prev.length >= 4) return prev;
        return [...prev, url];
      });
    };
    r2.readAsDataURL(file);
  }, []);

  const handleAddImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (uploadedFiles.length >= 4) {
        toast.error("Maximum 4 images allowed");
        return;
      }
      setUploadedFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setUploadedImageUrls((prev) => [...prev, url]);
        // If this is the first image, set it as primary
        if (!uploadedImageUrl) {
          setUploadedImageUrl(url);
          setUploadedFile(file);
        }
      };
      reader.readAsDataURL(file);
    },
    [uploadedFiles, uploadedImageUrl],
  );

  const removeImage = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newUrls = uploadedImageUrls.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setUploadedImageUrls(newUrls);
    if (index === 0) {
      setUploadedFile(newFiles[0] || null);
      setUploadedImageUrl(newUrls[0] || "");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startProgress = (isVideo = false) => {
    const messages = isVideo ? VIDEO_STATUS_MESSAGES : STATUS_MESSAGES;
    let msgIndex = 0;
    setStatusMsg(messages[0]);
    setProgress(0);
    const increment = isVideo ? 0.5 : 2;
    const interval = isVideo ? 800 : 600;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        const msgI = Math.floor((next / 100) * messages.length);
        if (msgI !== msgIndex && msgI < messages.length) {
          msgIndex = msgI;
          setStatusMsg(messages[msgI]);
        }
        return next >= 90 ? 90 : next;
      });
    }, interval);
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const recordPhotoUsageLocal = async () => {
    if (isAuthenticated && actor) {
      try {
        await (actor as any).recordPhotoUsage();
        const info = await (actor as any).getMySubscription();
        setSubscriptionInfo(info);
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = { ...freeUsage, photos: freeUsage.photos + 1 };
      setFreeUsage(updated);
      setFreeUsageState(updated);
    }
  };

  const recordVideoUsageLocal = async () => {
    if (isAuthenticated && actor) {
      try {
        await (actor as any).recordVideoUsage();
        const info = await (actor as any).getMySubscription();
        setSubscriptionInfo(info);
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = { ...freeUsage, videos: freeUsage.videos + 1 };
      setFreeUsage(updated);
      setFreeUsageState(updated);
    }
  };

  const handleVideoSend = async () => {
    if (!uploadedFile || !uploadedImageUrl) {
      toast.error("Please upload a room photo first");
      return;
    }
    if (isGenerating) return;

    // Check video limit
    if (videosRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    const defaultPrompt =
      selectedTool === "AI_VIRTUAL_TOUR"
        ? "Smooth cinematic walkthrough of this room, professional virtual tour style."
        : selectedTool === "AI_360_PANORAMA"
          ? "360-degree panoramic sweep of this room with smooth rotation."
          : "Animate this room with smooth, cinematic camera movement and subtle lighting transitions.";

    const prompt = inputText.trim() || defaultPrompt;
    const refineTarget = videoRefineTargetId
      ? videoGenerations.find((v) => v.id === videoRefineTargetId)
      : null;

    const sourceImageUrl = refineTarget
      ? refineTarget.originalImageUrl
      : uploadedImageUrl;

    let videoPrompt = prompt;
    if (selectedTool === "AI_VIRTUAL_TOUR") {
      videoPrompt = `Create a smooth cinematic virtual tour video walkthrough of this room. Professional camera movement, realistic lighting, real estate quality. ${prompt}`;
    } else if (selectedTool === "AI_360_PANORAMA") {
      videoPrompt = `Create a 360-degree panoramic video sweep of this room. Smooth rotation, immersive presentation, high quality. ${prompt}`;
    }

    setIsGenerating(true);
    startProgress(true);
    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error("Puter.js not loaded");
      if (puterTokenRef.current) {
        puter.authToken = puterTokenRef.current;
      }
      const videoEl = await puter.ai.txt2vid(videoPrompt, {
        model: "sora-2",
        seconds: selectedDuration,
        size: selectedResolution,
      });
      stopProgress();
      setProgress(100);
      setStatusMsg("Video ready!");
      const videoUrl = videoEl.src || videoEl.currentSrc;
      const newVidGen: VideoGeneration = {
        id: crypto.randomUUID(),
        originalImageUrl: sourceImageUrl,
        videoUrl,
        prompt,
        duration: selectedDuration,
        resolution: selectedResolution,
        timestamp: new Date(),
      };
      setVideoGenerations((prev) => [...prev, newVidGen]);
      setVideoRefineTargetId(null);
      setInputText("");
      await recordVideoUsageLocal();
      toast.success("Video generated!");
    } catch (err) {
      stopProgress();
      console.error(err);
      toast.error("Video generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (isVideoMode) {
      await handleVideoSend();
      return;
    }

    if (!uploadedImageUrl) {
      toast.error("Please upload a room photo first");
      return;
    }
    if (isGenerating) return;

    // Require sign-in before any generation
    if (!isAuthenticated) {
      setShowUpgradeModal(true);
      return;
    }

    // Check photo limit
    if (photosRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    const instructions = inputText.trim();

    if (refineTargetId) {
      const target = generations.find((g) => g.id === refineTargetId);
      if (!target) return;
      setIsGenerating(true);
      startProgress();
      try {
        const puter = (window as any).puter;
        if (!puter) throw new Error("Puter.js not loaded");
        if (puterTokenRef.current) {
          puter.authToken = puterTokenRef.current;
        }
        const prompt = `STRICT INSTRUCTIONS (you MUST follow these exactly): ${instructions || "improve the overall look, keep structure identical"}. Refine this room design. Keep the overall layout and structure.`;
        const imageElement = await puter.ai.txt2img(prompt, {
          model: "black-forest-labs/flux.1-kontext-pro",
          image_url: target.generatedImageUrl,
        });
        stopProgress();
        setProgress(100);
        setStatusMsg("Refinement complete!");
        const newGen: Generation = {
          id: crypto.randomUUID(),
          originalImageUrl: target.originalImageUrl,
          generatedImageUrl: imageElement.src,
          tool: target.tool,
          roomType: target.roomType,
          style: target.style,
          instructions,
          version: target.version + 1,
          timestamp: new Date(),
        };
        setGenerations((prev) => [...prev, newGen]);
        setRefineTargetId(null);
        setInputText("");
        await recordPhotoUsageLocal();
        toast.success("Design refined!");
      } catch (err) {
        stopProgress();
        console.error(err);
        toast.error("Refinement failed. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    } else {
      setIsGenerating(true);
      startProgress();
      try {
        const puter = (window as any).puter;
        if (!puter) throw new Error("Puter.js not loaded");
        if (puterTokenRef.current) {
          puter.authToken = puterTokenRef.current;
        }
        const strictConstraints = instructions
          ? `STRICT INSTRUCTIONS (you MUST follow these exactly): ${instructions}. `
          : "";
        const preservationConstraint = activeTool.modifiesFurniture
          ? ""
          : "IMPORTANT: Do NOT add, remove, or change any furniture or decor items. Preserve all existing furniture exactly as-is. ";
        const styleLabel =
          selectedCustomThemeId && customThemePrompt
            ? `custom theme (${customThemePrompt})`
            : selectedStyle || "";
        const basePrompt = activeTool.prompt(selectedRoom, styleLabel);
        const prompt = `${strictConstraints}${preservationConstraint}${basePrompt}`;

        // Process all uploaded images (multi-image support)
        const imagesToProcess =
          uploadedImageUrls.length > 0 ? uploadedImageUrls : [uploadedImageUrl];
        const newGens: Generation[] = [];

        for (let i = 0; i < imagesToProcess.length; i++) {
          const imgUrl = imagesToProcess[i];
          const imageElement = await puter.ai.txt2img(prompt, {
            model: "black-forest-labs/flux.1-kontext-pro",
            image_url: imgUrl,
          });
          const newGen: Generation = {
            id: crypto.randomUUID(),
            originalImageUrl: imgUrl,
            generatedImageUrl: imageElement.src,
            tool: activeTool.label,
            roomType: selectedRoom,
            style: selectedCustomThemeId
              ? `Custom: ${customThemePrompt.substring(0, 30)}...`
              : selectedStyle || "",
            instructions,
            version: 1,
            timestamp: new Date(Date.now() + i),
          };
          newGens.push(newGen);
          await recordPhotoUsageLocal();
        }

        stopProgress();
        setProgress(100);
        setStatusMsg("Done!");
        setGenerations((prev) => [...prev, ...newGens]);
        setInputText("");
        toast.success(
          imagesToProcess.length > 1
            ? `${imagesToProcess.length} images transformed!`
            : "Transformation complete!",
        );
      } catch (err) {
        stopProgress();
        console.error(err);
        toast.error("Generation failed. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDownload = (gen: Generation) => {
    const a = document.createElement("a");
    a.href = gen.generatedImageUrl;
    a.download = `stagepro-${gen.tool.toLowerCase().replace(/ /g, "-")}-v${gen.version}.jpg`;
    a.click();
  };

  const handleVideoDownload = (gen: VideoGeneration) => {
    const a = document.createElement("a");
    a.href = gen.videoUrl;
    a.download = `stagepro-video-${gen.duration}s.mp4`;
    a.click();
  };

  const startRefine = (genId: string) => {
    setRefineTargetId(genId);
    setVideoRefineTargetId(null);
    setInputText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelRefine = () => {
    setRefineTargetId(null);
    setInputText("");
  };

  const startVideoRefine = (genId: string) => {
    setVideoRefineTargetId(genId);
    setRefineTargetId(null);
    setSelectedTool("IMAGE_TO_VIDEO");
    setInputText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelVideoRefine = () => {
    setVideoRefineTargetId(null);
    setInputText("");
  };

  const refineTarget = refineTargetId
    ? generations.find((g) => g.id === refineTargetId)
    : null;
  const videoRefineTarget = videoRefineTargetId
    ? videoGenerations.find((v) => v.id === videoRefineTargetId)
    : null;

  type ChatItem =
    | { type: "image"; data: Generation }
    | { type: "video"; data: VideoGeneration };
  const chatItems: ChatItem[] = [
    ...generations.map((g) => ({ type: "image" as const, data: g })),
    ...videoGenerations.map((v) => ({ type: "video" as const, data: v })),
  ].sort((a, b) => a.data.timestamp.getTime() - b.data.timestamp.getTime());

  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`;

  const planName =
    isAuthenticated && subscriptionInfo ? subscriptionInfo.plan : "Free";

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Top Bar */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 z-10"
        style={{
          backgroundColor: "#F8F9FA",
          borderBottom: "1px solid #E2E8F0",
          height: 56,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
            data-ocid="design.sidebar.open_modal_button"
          >
            <Menu className="h-4 w-4" style={{ color: "#6B7280" }} />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
            data-ocid="design.back.button"
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
              S
            </div>
            <span className="font-bold text-sm" style={{ color: "#111827" }}>
              StagePro
            </span>
          </div>
        </div>

        {/* Credits + Auth */}
        <div className="flex items-center gap-2">
          {/* Credits bar */}
          <div
            className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#F3F4F6", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-center gap-1.5">
              <Wand2
                className="h-3 w-3"
                style={{ color: photosRemaining > 0 ? "#4ECDC4" : "#EF4444" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: photosRemaining > 0 ? "#374151" : "#EF4444" }}
              >
                {isAuthenticated && subscriptionLoading
                  ? "..."
                  : `${photosRemaining} photo${photosRemaining !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="w-px h-3" style={{ backgroundColor: "#D1D5DB" }} />
            <div className="flex items-center gap-1.5">
              <Clapperboard
                className="h-3 w-3"
                style={{ color: videosRemaining > 0 ? "#6366F1" : "#EF4444" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: videosRemaining > 0 ? "#374151" : "#EF4444" }}
              >
                {isAuthenticated && subscriptionLoading
                  ? "..."
                  : `${videosRemaining} video${videosRemaining !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="w-px h-3" style={{ backgroundColor: "#D1D5DB" }} />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              {planName}
            </span>
          </div>

          <button
            type="button"
            onClick={onUpgrade}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #4ECDC4, #2D9B94)",
              color: "#FFFFFF",
            }}
          >
            <Crown className="h-3 w-3" />
            Upgrade
          </button>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0" }}
              data-ocid="design.login.button"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0" }}
              data-ocid="design.logout.button"
            >
              Log Out
            </button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
                style={{ color: "#6B7280", border: "1px solid #E2E8F0" }}
                data-ocid="design.history.button"
              >
                <Clock className="h-3.5 w-3.5" />
                History
                {totalCount > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: "#4ECDC4", color: "#FFFFFF" }}
                  >
                    {totalCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[360px]"
              style={{
                backgroundColor: "#FFFFFF",
                borderLeft: "1px solid #E2E8F0",
              }}
            >
              <SheetHeader>
                <SheetTitle style={{ color: "#111827" }}>
                  Generation History
                </SheetTitle>
              </SheetHeader>

              <div
                className="flex mt-3 mb-1 rounded-lg overflow-hidden"
                style={{ border: "1px solid #E2E8F0" }}
              >
                <button
                  type="button"
                  onClick={() => setHistoryTab("images")}
                  className="flex-1 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      historyTab === "images" ? "#4ECDC4" : "#FFFFFF",
                    color: historyTab === "images" ? "#FFFFFF" : "#6B7280",
                  }}
                  data-ocid="design.history.images.tab"
                >
                  Images ({generations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab("videos")}
                  className="flex-1 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      historyTab === "videos" ? "#6366F1" : "#FFFFFF",
                    color: historyTab === "videos" ? "#FFFFFF" : "#6B7280",
                  }}
                  data-ocid="design.history.videos.tab"
                >
                  Videos ({videoGenerations.length})
                </button>
              </div>

              <ScrollArea className="h-[calc(100vh-120px)] mt-2 pr-1">
                {historyTab === "images" ? (
                  generations.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-20 gap-3"
                      data-ocid="design.history.empty_state"
                    >
                      <Clock
                        className="h-10 w-10"
                        style={{ color: "#E2E8F0" }}
                      />
                      <p className="text-sm" style={{ color: "#6B7280" }}>
                        No image generations yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-8">
                      {generations.map((gen, idx) => (
                        <div
                          key={gen.id}
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: "1px solid #E2E8F0",
                            backgroundColor: "#F8F9FA",
                          }}
                          data-ocid={`design.history.item.${idx + 1}`}
                        >
                          <img
                            src={gen.generatedImageUrl}
                            alt={`Version ${gen.version}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: "#E6F7F6",
                                  color: "#4ECDC4",
                                }}
                              >
                                Version {gen.version}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: "#9CA3AF" }}
                              >
                                {gen.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#6B7280" }}
                            >
                              {gen.roomType && `${gen.roomType} · `}
                              {gen.tool}
                              {gen.style && ` · ${gen.style}`}
                            </p>
                            {gen.instructions && (
                              <p
                                className="text-xs mt-1 truncate"
                                style={{ color: "#9CA3AF" }}
                              >
                                "{gen.instructions}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : videoGenerations.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-20 gap-3"
                    data-ocid="design.history.videos.empty_state"
                  >
                    <Clapperboard
                      className="h-10 w-10"
                      style={{ color: "#E2E8F0" }}
                    />
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      No videos yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-8">
                    {videoGenerations.map((vid, idx) => (
                      <div
                        key={vid.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          border: "1px solid #E2E8F0",
                          backgroundColor: "#F8F9FA",
                        }}
                        data-ocid={`design.history.video.item.${idx + 1}`}
                      >
                        <video
                          src={vid.videoUrl}
                          className="w-full h-32 object-cover"
                          muted
                        />
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "#EEF2FF",
                                color: "#6366F1",
                              }}
                            >
                              {vid.duration}s
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "#F3F4F6",
                                color: "#6B7280",
                              }}
                            >
                              {vid.resolution}
                            </span>
                            <span
                              className="text-xs ml-auto"
                              style={{ color: "#9CA3AF" }}
                            >
                              {vid.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {vid.prompt && (
                            <p
                              className="text-xs mt-1 truncate"
                              style={{ color: "#9CA3AF" }}
                            >
                              "{vid.prompt}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0"
          style={{
            width: 220,
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid #E2E8F0",
          }}
          data-ocid="design.sidebar.panel"
        >
          <SidebarContent
            selectedTool={selectedTool}
            onSelect={setSelectedTool}
            selectedStyle={selectedStyle}
            onStyleSelect={(s) => {
              setSelectedStyle(s);
              if (s) {
                setSelectedCustomThemeId(null);
                setCustomThemePrompt("");
              }
            }}
            customThemes={customThemes}
            selectedCustomThemeId={selectedCustomThemeId}
            onCustomThemeSelect={handleCustomThemeSelect}
            onAddThemeClick={() => setIsAddThemeOpen(true)}
            onDeleteCustomTheme={handleDeleteCustomTheme}
            isAuthenticated={isAuthenticated}
          />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[240px]"
            style={{
              backgroundColor: "#FFFFFF",
              borderRight: "1px solid #E2E8F0",
            }}
            data-ocid="design.sidebar.modal"
          >
            <SheetHeader
              className="px-3 py-3"
              style={{ borderBottom: "1px solid #E2E8F0" }}
            >
              <SheetTitle className="text-sm" style={{ color: "#111827" }}>
                Tools
              </SheetTitle>
            </SheetHeader>
            <SidebarContent
              selectedTool={selectedTool}
              onSelect={(id) => {
                setSelectedTool(id);
                setSidebarOpen(false);
              }}
              selectedStyle={selectedStyle}
              onStyleSelect={(s) => {
                setSelectedStyle(s);
                if (s) {
                  setSelectedCustomThemeId(null);
                  setCustomThemePrompt("");
                }
              }}
              customThemes={customThemes}
              selectedCustomThemeId={selectedCustomThemeId}
              onCustomThemeSelect={handleCustomThemeSelect}
              onAddThemeClick={() => {
                setIsAddThemeOpen(true);
                setSidebarOpen(false);
              }}
              onDeleteCustomTheme={handleDeleteCustomTheme}
              isAuthenticated={isAuthenticated}
            />
          </SheetContent>
        </Sheet>

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Chat Area */}
          <main className="flex-1 overflow-y-auto">
            {chatItems.length === 0 && !isGenerating ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 px-4"
                data-ocid="design.chat.empty_state"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isVideoMode
                      ? "linear-gradient(135deg, #EEF2FF, #F5F3FF)"
                      : "linear-gradient(135deg, #E6F7F6, #F0FAFA)",
                    border: isVideoMode
                      ? "1px solid #C7D2FE"
                      : "1px solid #B2EBE8",
                  }}
                >
                  {isVideoMode ? (
                    <Clapperboard
                      className="h-9 w-9"
                      style={{ color: "#6366F1" }}
                    />
                  ) : (
                    <Wand2 className="h-9 w-9" style={{ color: "#4ECDC4" }} />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className="text-lg font-semibold mb-1"
                    style={{ color: "#111827" }}
                  >
                    {activeTool.label}
                  </p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {isVideoMode
                      ? "Upload a photo and describe the animation below"
                      : "Upload a photo below to get started"}
                  </p>
                  {selectedStyle && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#E6F7F6" }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#2D9B94" }}
                      >
                        Style: {selectedStyle}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <AnimatePresence>
                  {chatItems.map((item) => {
                    if (item.type === "image") {
                      const gen = item.data;
                      return (
                        <motion.div
                          key={gen.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-2xl overflow-hidden"
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                          }}
                          data-ocid="design.chat.card"
                        >
                          <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderBottom: "1px solid #E2E8F0" }}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle
                                className="h-4 w-4"
                                style={{ color: "#4ECDC4" }}
                              />
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "#111827" }}
                              >
                                Version {gen.version}
                              </span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: "#E6F7F6",
                                  color: "#4ECDC4",
                                }}
                              >
                                {gen.tool}
                              </span>
                              {gen.roomType && (
                                <span
                                  className="text-xs"
                                  style={{ color: "#9CA3AF" }}
                                >
                                  · {gen.roomType}
                                </span>
                              )}
                              {gen.style && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: "#F3F4F6",
                                    color: "#6B7280",
                                  }}
                                >
                                  {gen.style}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startRefine(gen.id)}
                                className="text-xs px-3 py-1 rounded-lg transition-colors hover:bg-teal-50"
                                style={{
                                  color: "#4ECDC4",
                                  border: "1px solid #B2EBE8",
                                }}
                                data-ocid="design.chat.edit_button"
                              >
                                Refine this
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(gen)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-colors hover:bg-gray-50"
                                style={{
                                  color: "#6B7280",
                                  border: "1px solid #E2E8F0",
                                }}
                                data-ocid="design.chat.download.button"
                              >
                                <Download className="h-3 w-3" />
                                Save
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <BeforeAfterSlider
                              beforeSrc={gen.originalImageUrl}
                              afterSrc={gen.generatedImageUrl}
                            />
                          </div>
                          {gen.instructions && (
                            <div
                              className="px-4 py-2"
                              style={{ borderTop: "1px solid #E2E8F0" }}
                            >
                              <p
                                className="text-xs"
                                style={{ color: "#9CA3AF" }}
                              >
                                "{gen.instructions}"
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    }

                    const vid = item.data;
                    return (
                      <motion.div
                        key={vid.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #C7D2FE",
                        }}
                        data-ocid="design.chat.video.card"
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3"
                          style={{
                            borderBottom: "1px solid #E2E8F0",
                            backgroundColor: "#F5F3FF",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Clapperboard
                              className="h-4 w-4"
                              style={{ color: "#6366F1" }}
                            />
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "#111827" }}
                            >
                              Video Generated
                            </span>
                            <Badge
                              className="text-[10px] px-2 py-0.5"
                              style={{
                                backgroundColor: "#EEF2FF",
                                color: "#6366F1",
                                border: "none",
                              }}
                            >
                              {vid.duration}s
                            </Badge>
                            <Badge
                              className="text-[10px] px-2 py-0.5"
                              style={{
                                backgroundColor: "#F3F4F6",
                                color: "#6B7280",
                                border: "none",
                              }}
                            >
                              {vid.resolution}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startVideoRefine(vid.id)}
                              className="text-xs px-3 py-1 rounded-lg transition-colors hover:bg-indigo-50"
                              style={{
                                color: "#6366F1",
                                border: "1px solid #C7D2FE",
                              }}
                              data-ocid="design.chat.video.edit_button"
                            >
                              Re-generate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVideoDownload(vid)}
                              className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-colors hover:bg-gray-50"
                              style={{
                                color: "#6B7280",
                                border: "1px solid #E2E8F0",
                              }}
                              data-ocid="design.chat.video.download.button"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <video
                            controls
                            src={vid.videoUrl}
                            className="w-full rounded-lg"
                            style={{ maxHeight: 400 }}
                          >
                            <track kind="captions" />
                          </video>
                        </div>
                        {vid.prompt && (
                          <div className="px-4 pb-3">
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>
                              "{vid.prompt}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl p-5"
                      style={{
                        backgroundColor: isVideoMode ? "#F5F3FF" : "#F8F9FA",
                        border: `1px solid ${isVideoMode ? "#C7D2FE" : "#E2E8F0"}`,
                      }}
                      data-ocid="design.generate.loading_state"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          style={{ color: isVideoMode ? "#6366F1" : "#4ECDC4" }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#111827" }}
                        >
                          {statusMsg}
                        </span>
                        {isVideoMode && (
                          <span
                            className="text-xs"
                            style={{ color: "#9CA3AF" }}
                          >
                            (may take 1-2 min)
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
                        {Math.round(progress)}% complete
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={chatBottomRef} />
              </div>
            )}
          </main>

          {/* Bottom Input Bar */}
          <div
            className="flex-shrink-0"
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <AnimatePresence>
              {(refineTarget || videoRefineTarget) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between px-4 py-2"
                  style={{
                    backgroundColor: videoRefineTarget ? "#F5F3FF" : "#F0FAFA",
                    borderBottom: `1px solid ${videoRefineTarget ? "#C7D2FE" : "#B2EBE8"}`,
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: videoRefineTarget ? "#6366F1" : "#4ECDC4" }}
                  >
                    {videoRefineTarget
                      ? "Re-generating video — describe changes or adjust duration/resolution below"
                      : `Refining Version ${refineTarget?.version} — describe your changes below`}
                  </span>
                  <button
                    type="button"
                    onClick={
                      videoRefineTarget ? cancelVideoRefine : cancelRefine
                    }
                    className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100"
                    style={{ color: videoRefineTarget ? "#6366F1" : "#4ECDC4" }}
                    data-ocid="design.refine.cancel_button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {uploadedImageUrls.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-4 pt-3 flex-wrap"
                >
                  {uploadedImageUrls.map((url, idx) => (
                    <div
                      key={url.substring(url.length - 20) + String(idx)}
                      className="relative flex-shrink-0"
                    >
                      <img
                        src={url}
                        alt={`Room ${idx + 1}`}
                        className="w-12 h-12 object-cover rounded-lg"
                        style={{ border: "1px solid #E2E8F0" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#9CA3AF", color: "white" }}
                        data-ocid={`design.upload.delete_button.${idx + 1}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                  {uploadedImageUrls.length < 4 && (
                    <button
                      type="button"
                      onClick={() => addImageInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-colors hover:bg-gray-100"
                      style={{ border: "1px dashed #D1D5DB", color: "#9CA3AF" }}
                      data-ocid="design.add-image.button"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span className="text-[9px]">Add</span>
                    </button>
                  )}
                  <input
                    ref={addImageInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) =>
                      e.target.files?.[0] && handleAddImage(e.target.files[0])
                    }
                  />
                  {uploadedImageUrls.length === 1 && (
                    <p
                      className="text-xs self-center"
                      style={{ color: "#6B7280" }}
                    >
                      {uploadedFile?.name}
                    </p>
                  )}
                  {uploadedImageUrls.length > 1 && (
                    <p
                      className="text-xs self-center"
                      style={{ color: "#6B7280" }}
                    >
                      {uploadedImageUrls.length} images
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-gray-100"
                style={{ border: "1px solid #E2E8F0", color: "#6B7280" }}
                data-ocid="design.upload.button"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
                data-ocid="design.upload.input"
              />

              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  videoRefineTarget
                    ? "Describe changes for the new video..."
                    : refineTarget
                      ? "Describe changes to apply..."
                      : isVideoMode
                        ? "Describe the video animation (optional)..."
                        : "Add instructions (optional)..."
                }
                className="flex-1 h-10 text-sm"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "#111827",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                data-ocid="design.chat.input"
              />

              {isVideoMode ? (
                <>
                  <Select
                    value={String(selectedDuration)}
                    onValueChange={(v) => setSelectedDuration(Number(v))}
                  >
                    <SelectTrigger
                      className="w-[80px] h-10 text-xs flex-shrink-0"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #C7D2FE",
                        color: "#6366F1",
                      }}
                      data-ocid="design.video.duration.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem
                          key={d.value}
                          value={String(d.value)}
                          className="text-xs"
                        >
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedResolution}
                    onValueChange={setSelectedResolution}
                  >
                    <SelectTrigger
                      className="w-[110px] h-10 text-xs flex-shrink-0"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #C7D2FE",
                        color: "#6366F1",
                      }}
                      data-ocid="design.video.resolution.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {RESOLUTION_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <Select
                  value={selectedRoom || "none"}
                  onValueChange={(v) => setSelectedRoom(v === "none" ? "" : v)}
                >
                  <SelectTrigger
                    className="w-[130px] h-10 text-xs flex-shrink-0"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      color: "#6B7280",
                    }}
                    data-ocid="design.room.select"
                  >
                    <SelectValue placeholder="Room (optional)" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <SelectItem
                      value="none"
                      className="text-xs"
                      style={{ color: "#9CA3AF" }}
                    >
                      Any Room
                    </SelectItem>
                    {ROOM_TYPES.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-xs"
                        style={{ color: "#111827" }}
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <button
                type="button"
                onClick={handleSend}
                disabled={
                  !uploadedImageUrl ||
                  isGenerating ||
                  (isVideoMode && !uploadedFile)
                }
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background:
                    !uploadedImageUrl || isGenerating
                      ? "#E5E7EB"
                      : isVideoMode
                        ? "linear-gradient(135deg, #6366F1, #4F46E5)"
                        : "linear-gradient(135deg, #4ECDC4, #2D9B94)",
                }}
                data-ocid="design.generate.primary_button"
              >
                {isGenerating ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    style={{ color: isVideoMode ? "#6366F1" : "#4ECDC4" }}
                  />
                ) : isVideoMode ? (
                  <Clapperboard
                    className="h-4 w-4"
                    style={{ color: uploadedImageUrl ? "#FFFFFF" : "#9CA3AF" }}
                  />
                ) : (
                  <Wand2
                    className="h-4 w-4"
                    style={{ color: uploadedImageUrl ? "#FFFFFF" : "#9CA3AF" }}
                  />
                )}
              </button>
            </div>

            <p
              className="text-center text-xs pb-2"
              style={{ color: "#9CA3AF" }}
            >
              © {year}. Built with ❤️ using{" "}
              <a
                href={caffeineHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
                style={{ color: "#4ECDC4" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Add Custom Theme Dialog */}
      <Dialog open={isAddThemeOpen} onOpenChange={setIsAddThemeOpen}>
        <DialogContent
          className="max-w-sm"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#111827" }}>
              Add Custom Theme
            </DialogTitle>
            <DialogDescription style={{ color: "#6B7280" }}>
              Create a personalized design style that will be saved to your
              account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="theme-name"
                className="text-sm font-medium"
                style={{ color: "#374151" }}
              >
                Theme Name
              </Label>
              <Input
                id="theme-name"
                placeholder="e.g. Earthy Boho"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                style={{ border: "1px solid #E2E8F0" }}
                data-ocid="design.add-theme.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="theme-prompt"
                className="text-sm font-medium"
                style={{ color: "#374151" }}
              >
                Style Prompt
              </Label>
              <Textarea
                id="theme-prompt"
                placeholder="e.g. Bohemian with warm earth tones, rattan furniture, and lush indoor plants"
                value={newThemePromptText}
                onChange={(e) => setNewThemePromptText(e.target.value)}
                rows={3}
                style={{ border: "1px solid #E2E8F0", resize: "none" }}
                data-ocid="design.add-theme.textarea"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddThemeOpen(false)}
              data-ocid="design.add-theme.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomTheme}
              disabled={
                isSavingTheme ||
                !newThemeName.trim() ||
                !newThemePromptText.trim()
              }
              style={{
                background: "linear-gradient(135deg, #4ECDC4, #2D9B94)",
                color: "white",
                border: "none",
              }}
              data-ocid="design.add-theme.save_button"
            >
              {isSavingTheme ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSavingTheme ? "Saving..." : "Save Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent
          className="max-w-md"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              style={{ color: "#111827" }}
            >
              <Crown className="h-5 w-5" style={{ color: "#4ECDC4" }} />
              You've reached your limit
            </DialogTitle>
            <DialogDescription style={{ color: "#6B7280" }}>
              {!isAuthenticated
                ? "Sign in and upgrade to a plan to generate more designs."
                : "Upgrade your plan to get more photos and videos this month."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  onLogin();
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #4ECDC4, #2D9B94)",
                }}
              >
                Sign In with Internet Identity
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowUpgradeModal(false);
                onUpgrade();
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
              }}
            >
              View Plans
            </button>
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-2 text-sm"
              style={{ color: "#9CA3AF" }}
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
