import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Edit2, Loader2, Star, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StarredEntry {
  id: bigint;
  name: string;
  description: string;
  imageUrl: string;
  prompt: string;
  createdAt: bigint;
  updatedAt: bigint;
}

interface HistoryPageProps {
  onBack: () => void;
  actor: any;
}

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HistoryPage({ onBack, actor }: HistoryPageProps) {
  const [entries, setEntries] = useState<StarredEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEntry, setEditEntry] = useState<StarredEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!actor) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (actor as any)
      .getMyStarredEntries()
      .then((result: StarredEntry[]) => {
        setEntries(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Failed to load starred entries:", err);
        toast.error("Failed to load history");
        setLoading(false);
      });
  }, [actor]);

  const handleEditOpen = (entry: StarredEntry) => {
    setEditEntry(entry);
    setEditName(entry.name);
    setEditDescription(entry.description);
  };

  const handleEditSave = async () => {
    if (!editEntry || !actor) return;
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);
    try {
      await (actor as any).updateStarredEntry(
        editEntry.id,
        editName.trim(),
        editDescription.trim(),
      );
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editEntry.id
            ? {
                ...e,
                name: editName.trim(),
                description: editDescription.trim(),
              }
            : e,
        ),
      );
      toast.success("Entry updated!");
      setEditEntry(null);
    } catch (err) {
      console.error("Failed to update entry:", err);
      toast.error("Failed to update entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId === null || !actor) return;
    setIsDeleting(true);
    try {
      await (actor as any).deleteStarredEntry(deleteConfirmId);
      setEntries((prev) => prev.filter((e) => e.id !== deleteConfirmId));
      toast.success("Entry deleted");
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete entry:", err);
      toast.error("Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F0E6" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "#EEE7DA", borderColor: "#DDD6C8" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "#6F9D79" }}
            data-ocid="history.back.button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#6F9D79" }}
            >
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <h1 className="font-bold text-lg" style={{ color: "#1A1A1A" }}>
              My History
            </h1>
          </div>
          {!loading && entries.length > 0 && (
            <span className="ml-auto text-sm" style={{ color: "#7A7A7A" }}>
              {entries.length} starred item{entries.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading skeleton */}
        {loading && (
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
            data-ocid="history.loading_state"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDD6C8",
                }}
              >
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
            data-ocid="history.empty_state"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#EEE7DA" }}
            >
              <Star className="w-10 h-10" style={{ color: "#6F9D79" }} />
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1A1A1A" }}
            >
              No starred images yet
            </h2>
            <p
              className="text-base mb-6 max-w-md mx-auto"
              style={{ color: "#7A7A7A" }}
            >
              When you generate an AI design or staging result, click the ⭐
              star button to save it here with a name and description.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "#6F9D79", color: "#fff" }}
              data-ocid="history.back.button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Design Tool
            </button>
          </motion.div>
        )}

        {/* Entries grid */}
        {!loading && entries.length > 0 && (
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
            data-ocid="history.list"
          >
            {entries.map((entry, idx) => (
              <motion.div
                key={String(entry.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDD6C8",
                }}
                data-ocid={`history.item.${idx + 1}`}
              >
                {/* Image */}
                <div
                  className="relative w-full bg-gray-100"
                  style={{ paddingBottom: "60%" }}
                >
                  <img
                    src={entry.imageUrl}
                    alt={entry.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'%3E%3Crect width='100' height='60' fill='%23EEE7DA'/%3E%3Ctext x='50' y='35' text-anchor='middle' fill='%236F9D79' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(111,157,121,0.9)" }}
                  >
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3
                    className="font-bold text-base mb-1 line-clamp-1"
                    style={{ color: "#1A1A1A" }}
                  >
                    {entry.name}
                  </h3>
                  {entry.description && (
                    <p
                      className="text-sm mb-2 line-clamp-2 flex-1"
                      style={{ color: "#5A5A5A" }}
                    >
                      {entry.description}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-1 text-xs mb-3"
                    style={{ color: "#9A9A9A" }}
                  >
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleEditOpen(entry)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                      style={{
                        border: "1px solid #6F9D79",
                        color: "#6F9D79",
                      }}
                      data-ocid={`history.edit_button.${idx + 1}`}
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-xs transition-colors hover:bg-red-50"
                      style={{
                        border: "1px solid #FCA5A5",
                        color: "#EF4444",
                      }}
                      data-ocid={`history.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <Dialog
        open={editEntry !== null}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          style={{ backgroundColor: "#F3F0E6" }}
          data-ocid="history.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label style={{ color: "#3A3A3A" }}>Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Living Room Redesign"
                style={{ backgroundColor: "#fff", borderColor: "#DDD6C8" }}
                data-ocid="history.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#3A3A3A" }}>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add notes about this design..."
                rows={3}
                style={{ backgroundColor: "#fff", borderColor: "#DDD6C8" }}
                data-ocid="history.textarea"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setEditEntry(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
              style={{ border: "1px solid #DDD6C8", color: "#5A5A5A" }}
              data-ocid="history.cancel_button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEditSave}
              disabled={isSaving || !editName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#6F9D79", color: "#fff" }}
              data-ocid="history.save_button"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteConfirmId(null);
        }}
      >
        <DialogContent
          className="sm:max-w-sm"
          style={{ backgroundColor: "#F3F0E6" }}
          data-ocid="history.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm py-2" style={{ color: "#5A5A5A" }}>
            Are you sure you want to delete this starred entry? This action
            cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ border: "1px solid #DDD6C8", color: "#5A5A5A" }}
              data-ocid="history.cancel_button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#EF4444", color: "#fff" }}
              data-ocid="history.confirm_button"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
