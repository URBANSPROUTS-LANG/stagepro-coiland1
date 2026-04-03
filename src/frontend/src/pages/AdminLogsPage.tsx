import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bookmark, Database, ImageOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AiGenerationLog {
  id: bigint;
  createdAt: bigint;
  inputImageBlobId: string;
  userPrincipal: { toString(): string };
  prompt: string;
  outputImageBlobId: string;
}

interface StarredEntry {
  id: bigint;
  imageUrl: string;
}

interface AdminLogsPageProps {
  onBack: () => void;
  actor: any;
}

function formatTimestamp(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleString("en-IN");
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 20) return principal;
  return `${principal.slice(0, 12)}...${principal.slice(-6)}`;
}

function truncatePrompt(prompt: string, maxLen = 100): string {
  if (prompt.length <= maxLen) return prompt;
  return `${prompt.slice(0, maxLen)}...`;
}

function ImageThumb({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src) {
    return <span style={{ color: "#9A9A9A" }}>—</span>;
  }

  if (error) {
    return (
      <div
        className="w-12 h-12 rounded flex items-center justify-center"
        style={{ backgroundColor: "#EEE7DA" }}
        title="Image unavailable"
      >
        <ImageOff className="w-4 h-4" style={{ color: "#9A9A9A" }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-12 h-12 object-cover rounded"
      style={{ border: "1px solid #DDD6C8" }}
      onError={() => setError(true)}
    />
  );
}

export default function AdminLogsPage({ onBack, actor }: AdminLogsPageProps) {
  const [logs, setLogs] = useState<AiGenerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [starredOutputUrls, setStarredOutputUrls] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!actor) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      (actor as any).getAiGenerationLogsReverse() as Promise<AiGenerationLog[]>,
      (actor as any).getMyStarredEntries().catch(() => []) as Promise<
        StarredEntry[]
      >,
    ])
      .then(([logsResult, starredResult]) => {
        setLogs(logsResult);
        const urls = new Set<string>(
          (starredResult as StarredEntry[]).map((s) => s.imageUrl),
        );
        setStarredOutputUrls(urls);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Failed to load AI generation logs:", err);
        toast.error("Failed to load AI generation logs");
        setLoading(false);
      });
  }, [actor]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F0E6" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "#EEE7DA", borderColor: "#DDD6C8" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "#6F9D79" }}
            data-ocid="admin_logs.back.button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#6F9D79" }}
            >
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-bold text-lg" style={{ color: "#1A1A1A" }}>
              AI Generation Logs
            </h1>
          </div>
          {!loading && logs.length > 0 && (
            <span
              className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#D9EFE1", color: "#4A7D5A" }}
              data-ocid="admin_logs.count.badge"
            >
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3" data-ocid="admin_logs.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDD6C8",
                }}
              >
                <Skeleton className="w-8 h-4 rounded" />
                <Skeleton className="w-32 h-4 rounded" />
                <Skeleton className="flex-1 h-4 rounded" />
                <Skeleton className="w-12 h-12 rounded" />
                <Skeleton className="w-12 h-12 rounded" />
                <Skeleton className="w-28 h-4 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && logs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
            data-ocid="admin_logs.empty_state"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#EEE7DA" }}
            >
              <Database className="w-10 h-10" style={{ color: "#6F9D79" }} />
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1A1A1A" }}
            >
              No logs yet
            </h2>
            <p
              className="text-base max-w-md mx-auto"
              style={{ color: "#7A7A7A" }}
            >
              AI generation logs will appear here once users start generating
              designs.
            </p>
          </motion.div>
        )}

        {/* Logs table */}
        {!loading && logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Desktop table */}
            <div
              className="hidden md:block rounded-2xl overflow-hidden"
              style={{ border: "1px solid #DDD6C8" }}
              data-ocid="admin_logs.table"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#EEE7DA" }}>
                    {[
                      "#",
                      "User",
                      "Prompt",
                      "Input",
                      "Output",
                      "Bookmarked",
                      "Time",
                    ].map((col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#7A7A7A" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const isBookmarked = log.outputImageBlobId
                      ? starredOutputUrls.has(log.outputImageBlobId)
                      : false;
                    return (
                      <tr
                        key={String(log.id)}
                        className="border-t transition-colors hover:opacity-95"
                        style={{
                          backgroundColor:
                            idx % 2 === 0 ? "#FFFFFF" : "#FAF8F4",
                          borderColor: "#DDD6C8",
                        }}
                        data-ocid={`admin_logs.row.${idx + 1}`}
                      >
                        <td
                          className="px-4 py-3 font-mono text-xs"
                          style={{ color: "#9A9A9A" }}
                        >
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "#EEE7DA",
                              color: "#4A4A4A",
                            }}
                            title={log.userPrincipal.toString()}
                          >
                            {truncatePrincipal(log.userPrincipal.toString())}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 max-w-xs"
                          style={{ color: "#3A3A3A" }}
                          title={log.prompt}
                        >
                          {truncatePrompt(log.prompt)}
                        </td>
                        <td className="px-4 py-3">
                          <ImageThumb
                            src={log.inputImageBlobId}
                            alt="Input image"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <ImageThumb
                            src={log.outputImageBlobId}
                            alt="Output image"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {isBookmarked ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: "#FEF3C7",
                                color: "#92400E",
                              }}
                              title="This image was bookmarked (starred) by the user"
                            >
                              <Bookmark className="w-3 h-3 fill-current" />
                              Bookmarked
                            </span>
                          ) : (
                            <span
                              style={{ color: "#CACACA", fontSize: "0.75rem" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-xs whitespace-nowrap"
                          style={{ color: "#7A7A7A" }}
                        >
                          {formatTimestamp(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3" data-ocid="admin_logs.list">
              {logs.map((log, idx) => {
                const isBookmarked = log.outputImageBlobId
                  ? starredOutputUrls.has(log.outputImageBlobId)
                  : false;
                return (
                  <motion.div
                    key={String(log.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #DDD6C8",
                    }}
                    data-ocid={`admin_logs.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0"
                        style={{
                          backgroundColor: "#EEE7DA",
                          color: "#4A4A4A",
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        className="font-mono text-xs truncate flex-1"
                        style={{ color: "#7A7A7A" }}
                      >
                        {truncatePrincipal(log.userPrincipal.toString())}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isBookmarked && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                            }}
                            title="This image was bookmarked (starred) by the user"
                          >
                            <Bookmark className="w-3 h-3 fill-current" />
                            Bookmarked
                          </span>
                        )}
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "#9A9A9A" }}
                        >
                          {formatTimestamp(log.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#3A3A3A" }}
                    >
                      {truncatePrompt(log.prompt)}
                    </p>
                    <div className="flex items-center gap-3">
                      <div>
                        <p
                          className="text-xs mb-1"
                          style={{ color: "#9A9A9A" }}
                        >
                          Input
                        </p>
                        <ImageThumb
                          src={log.inputImageBlobId}
                          alt="Input image"
                        />
                      </div>
                      <div>
                        <p
                          className="text-xs mb-1"
                          style={{ color: "#9A9A9A" }}
                        >
                          Output
                        </p>
                        <ImageThumb
                          src={log.outputImageBlobId}
                          alt="Output image"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
