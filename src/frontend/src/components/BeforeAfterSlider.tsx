import { ArrowLeftRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
    setSliderPos(pct);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePos(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updatePos(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging) updatePos(e.clientX);
    };
    const onUp = () => setIsDragging(false);
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) updatePos(e.touches[0].clientX);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, updatePos]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden select-none"
      style={{
        cursor: isDragging ? "col-resize" : "col-resize",
        aspectRatio: "16/9",
        border: "1px solid #DDD6C8",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      data-ocid="design.slider.canvas_target"
    >
      {/* After (full width behind) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before (clipped to left portion) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: `${sliderPos}%`,
          width: 3,
          backgroundColor: "white",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        {/* Handle circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
          style={{ zIndex: 11 }}
        >
          <ArrowLeftRight className="h-4 w-4" style={{ color: "#6F9D79" }} />
        </div>
      </div>

      {/* Labels */}
      <div
        className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-bold bg-black bg-opacity-40 text-white"
        style={{ zIndex: 12 }}
      >
        {beforeLabel}
      </div>
      <div
        className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-bold text-white"
        style={{ zIndex: 12, backgroundColor: "#6F9D79" }}
      >
        {afterLabel}
      </div>
    </div>
  );
}
