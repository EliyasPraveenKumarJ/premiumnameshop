import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/contacts";

const links = [
  { label: "Portfolio", href: "#portfolio" },
  { label: "Featured", href: "#featured" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/70 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <a href="#top" data-testid="brand-logo" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 rounded-full bg-gold group-hover:scale-125 transition-transform" />
          <span className="font-display text-lg md:text-xl font-semibold tracking-tight text-white">
            Premium<span className="text-gold">Name</span>Shop
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a href="#portfolio">
            <Button
              size="sm"
              data-testid="nav-browse-btn"
              className="bg-gold text-white hover:bg-gold-hover font-semibold rounded-full px-5"
            >
              Browse Domains
            </Button>
          </a>
        </nav>

        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-6 py-6 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-neutral-300 hover:text-gold transition-colors"
              data-testid={`mobile-nav-${l.label.toLowerCase()}`}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
