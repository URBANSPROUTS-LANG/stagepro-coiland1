import { Button } from "@/components/ui/button";
import { Layers, Menu, X } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";

interface NavbarProps {
  navigate: (page: Page) => void;
  currentPage?: Page;
}

export default function Navbar({ navigate, currentPage }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("landing")}
            className="flex items-center gap-2 font-display font-bold text-xl text-primary"
            data-ocid="nav.link"
          >
            <Layers className="w-6 h-6" />
            <span className="text-foreground">Stage</span>
            <span className="text-primary">Pro</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => navigate("landing")}
              className={`transition-colors hover:text-primary ${
                currentPage === "landing"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-ocid="nav.link"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate("staging")}
              className={`transition-colors hover:text-primary ${
                currentPage === "staging"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-ocid="nav.link"
            >
              Stage a Room
            </button>
            <button
              type="button"
              onClick={() => navigate("dashboard")}
              className={`transition-colors hover:text-primary ${
                currentPage === "dashboard"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-ocid="nav.link"
            >
              Dashboard
            </button>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("staging")}
              data-ocid="nav.primary_button"
            >
              Start Staging
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            data-ocid="nav.toggle"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              navigate("landing");
              setMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1 text-muted-foreground"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("staging");
              setMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1 text-muted-foreground"
          >
            Stage a Room
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("dashboard");
              setMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1 text-muted-foreground"
          >
            Dashboard
          </button>
          <Button
            size="sm"
            onClick={() => {
              navigate("staging");
              setMenuOpen(false);
            }}
            className="mt-2"
            data-ocid="nav.primary_button"
          >
            Start Staging
          </Button>
        </div>
      )}
    </header>
  );
}
