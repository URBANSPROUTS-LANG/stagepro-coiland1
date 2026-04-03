import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, LayoutDashboard, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Page } from "../App";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

interface StoredOrder {
  id: string;
  imagePreview: string;
  style: string;
  plan: string;
  amount: number;
  status: "pending" | "paid" | "staged";
  stagedImageUrl?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  staged: "bg-primary/20 text-primary border-primary/30",
};

export default function Dashboard({
  navigate,
}: { navigate: (p: Page) => void }) {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [selected, setSelected] = useState<StoredOrder | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("stagepro_orders") || "[]");
    setOrders(stored);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar navigate={navigate} currentPage="dashboard" />
      <main className="flex-1 py-10">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                My Dashboard
              </h1>
            </div>

            {/* Order detail modal */}
            {selected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                onClick={() => setSelected(null)}
                onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
                tabIndex={-1}
                data-ocid="dashboard.modal"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-card border border-border rounded-2xl max-w-lg w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-display text-xl font-bold mb-4">
                    Order #{selected.id.slice(-8)}
                  </h3>
                  {selected.stagedImageUrl && (
                    <img
                      src={selected.stagedImageUrl}
                      alt="Staged"
                      className="w-full h-48 object-cover rounded-xl mb-4"
                    />
                  )}
                  <div className="space-y-2 text-sm mb-5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Style</span>
                      <span className="font-medium">{selected.style}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{selected.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium text-primary">
                        ₹{selected.amount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={STATUS_COLORS[selected.status]}>
                        {selected.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>
                        {new Date(selected.createdAt).toLocaleDateString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {selected.stagedImageUrl && (
                      <Button
                        size="sm"
                        className="gap-1"
                        asChild
                        data-ocid="dashboard.primary_button"
                      >
                        <a href={selected.stagedImageUrl} download>
                          <ExternalLink className="w-3 h-3" /> Download
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(null)}
                      data-ocid="dashboard.close_button"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Orders */}
            {orders.length === 0 ? (
              <Card data-ocid="dashboard.empty_state">
                <CardContent className="p-12 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="font-display text-xl font-bold mb-2">
                    No Stagings Yet
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    No stagings yet. Start your first staging!
                  </p>
                  <Button
                    onClick={() => navigate("staging")}
                    className="gap-2"
                    data-ocid="dashboard.primary_button"
                  >
                    <Upload className="w-4 h-4" /> Stage a Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                data-ocid="dashboard.list"
              >
                {orders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    data-ocid={`dashboard.item.${i + 1}`}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelected(order)}
                    >
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        {order.stagedImageUrl ? (
                          <img
                            src={order.stagedImageUrl}
                            alt="Staged room"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">
                            {order.style} Style
                          </span>
                          <Badge
                            className={`text-xs ${STATUS_COLORS[order.status]}`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.plan} · ₹{order.amount} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}
