import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, ShieldCheck, Zap, Globe, Mail, MessageCircle, Linkedin, Facebook } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DomainCard from "@/components/DomainCard";
import RequestPriceDialog from "@/components/RequestPriceDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { CONTACTS } from "@/lib/contacts";

const HERO_BG =
  "https://images.pexels.com/photos/10653941/pexels-photo-10653941.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Home() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    document.title = "PremiumNameShop — Premium Domain Names for Sale";
    Promise.all([api.get("/domains"), api.get("/categories")])
      .then(([d, c]) => {
        setDomains(d.data);
        setCategories(c.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = useMemo(() => domains.filter((d) => d.featured).slice(0, 6), [domains]);

  const filtered = useMemo(() => {
    let list = [...domains];
    if (query) list = list.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
    if (category !== "All") list = list.filter((d) => d.category === category);
    if (sort === "price_asc") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "price_desc") list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [domains, query, category, sort]);

  const openRequest = (domain) => {
    setSelected(domain);
    setDialogOpen(true);
  };

  const available = domains.filter((d) => d.status === "available").length;

  return (
    <div className="min-h-screen bg-obsidian text-white" id="top">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/70 via-obsidian/85 to-obsidian" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold text-gold border border-gold/30 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> {available} Premium Domains Available
            </span>
            <h1 className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter leading-[1.05]">
              Own the name that <span className="text-gold font-semibold">defines your brand.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400 max-w-xl">
              A hand-curated portfolio of premium, brandable domains across AI, finance,
              tech and lifestyle. Secure, verified and ready to transfer.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#portfolio">
                <Button data-testid="hero-browse-btn" className="bg-gold text-white hover:bg-gold-hover font-semibold rounded-full px-7 h-12">
                  Explore Portfolio <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="#contact">
                <Button variant="outline" data-testid="hero-contact-btn" className="border-white/20 bg-transparent text-white hover:bg-white/5 rounded-full px-7 h-12">
                  Contact Broker
                </Button>
              </a>
            </div>
            <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { k: `${domains.length}+`, v: "Curated Domains" },
                { k: "100%", v: "Secure Transfer" },
                { k: "24h", v: "Response Time" },
              ].map((s) => (
                <div key={s.v}>
                  <p className="font-display text-2xl md:text-3xl font-semibold text-white">{s.k}</p>
                  <p className="text-xs text-neutral-500 mt-1">{s.v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid gap-6 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Escrow-Protected", d: "Safe, verified ownership transfer" },
            { icon: Zap, t: "Fast Turnaround", d: "Quick response & smooth handover" },
            { icon: Globe, t: "Global Portfolio", d: "Brandable names across industries" },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3">
              <f.icon className="w-5 h-5 text-gold mt-0.5" />
              <div>
                <p className="font-medium text-white text-sm">{f.t}</p>
                <p className="text-neutral-500 text-xs mt-0.5">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section id="featured" className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase font-bold text-gold">Handpicked</p>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight mt-2">
                  Featured Domains
                </h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((d, i) => (
                <DomainCard key={d.id} domain={d} onRequest={openRequest} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-20 md:py-28 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-10">
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-gold">The Collection</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight mt-2">
              Full Domain Portfolio
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                data-testid="domain-search-input"
                placeholder="Search domains..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11 h-12 bg-surface border-white/10 focus:border-gold focus:ring-1 focus:ring-gold rounded-full"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="category-filter" className="md:w-56 h-12 bg-surface border-white/10 rounded-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger data-testid="sort-filter" className="md:w-48 h-12 bg-surface border-white/10 rounded-full">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="az">A → Z</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-neutral-500">Loading portfolio…</p>
          ) : filtered.length === 0 ? (
            <p className="text-neutral-500" data-testid="no-results">No domains match your search.</p>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-6" data-testid="results-count">
                Showing {filtered.length} domain{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((d, i) => (
                  <DomainCard key={d.id} domain={d} onRequest={openRequest} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ABOUT / BROKER */}
      <section id="about" className="py-20 md:py-28 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-12 lg:grid-cols-2 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gold/10 blur-3xl rounded-full" />
            <div className="relative rounded-2xl border border-white/10 bg-surface p-8 md:p-10" data-testid="portfolio-panel">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                <span className="font-display text-lg font-semibold tracking-tight">
                  Premium<span className="text-gold">Name</span>Shop
                </span>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
                  <p className="font-display text-3xl font-semibold text-white">{domains.length}+</p>
                  <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Curated Domains</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
                  <p className="font-display text-3xl font-semibold text-white">{categories.length}</p>
                  <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Categories</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
                  <p className="font-display text-3xl font-semibold text-gold">100%</p>
                  <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Secure Transfer</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
                  <p className="font-display text-3xl font-semibold text-white">24h</p>
                  <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Response Time</p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["AI", "Fintech", "SaaS", "Brandable", "Premium"].map((t) => (
                  <span key={t} className="tag-chip text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-gold">About the Portfolio</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight mt-3">
              Built like a top domainer's portfolio.
            </h2>
            <p className="text-neutral-400 mt-5 leading-relaxed">
              PremiumNameShop is a personally curated collection of high-potential domain
              names — the same disciplined approach used by leading domain investors. Every
              name is selected for brandability, memorability and commercial upside across
              fast-growing categories like AI, fintech, and consumer tech.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Verified ownership & clean history",
                "Secure escrow-based transfers",
                "Flexible pricing — buy now or make an offer",
                "Direct, responsive communication with the owner",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 md:py-28 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-gold">Get in touch</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight mt-3">
            Interested in a domain? Let's talk.
          </h2>
          <p className="text-neutral-400 mt-4 max-w-xl mx-auto">
            Reach out for pricing, negotiations or portfolio inquiries. We typically respond
            within 24 hours.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <a href={`mailto:${CONTACTS.email}`} data-testid="contact-email" className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-5 hover:border-gold/50 transition-colors">
              <Mail className="w-5 h-5 text-gold" />
              <div className="text-left">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Email</p>
                <p className="text-white text-sm">{CONTACTS.email}</p>
              </div>
            </a>
            <a href={CONTACTS.whatsappLink} target="_blank" rel="noreferrer" data-testid="contact-whatsapp" className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-5 hover:border-gold/50 transition-colors">
              <MessageCircle className="w-5 h-5 text-gold" />
              <div className="text-left">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">WhatsApp</p>
                <p className="text-white text-sm">{CONTACTS.whatsappDisplay}</p>
              </div>
            </a>
            <a href={CONTACTS.linkedin} target="_blank" rel="noreferrer" data-testid="contact-linkedin" className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-5 hover:border-gold/50 transition-colors">
              <Linkedin className="w-5 h-5 text-gold" />
              <div className="text-left">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">LinkedIn</p>
                <p className="text-white text-sm">Eliyas Yazzies — Domains</p>
              </div>
            </a>
            <a href={CONTACTS.facebook} target="_blank" rel="noreferrer" data-testid="contact-facebook" className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-5 hover:border-gold/50 transition-colors">
              <Facebook className="w-5 h-5 text-gold" />
              <div className="text-left">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Facebook</p>
                <p className="text-white text-sm">PremiumNameShop</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <RequestPriceDialog domain={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
