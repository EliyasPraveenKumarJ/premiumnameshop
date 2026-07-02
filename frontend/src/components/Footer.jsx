import { Link } from "react-router-dom";
import { Mail, Linkedin, Facebook, MessageCircle } from "lucide-react";
import { CONTACTS } from "@/lib/contacts";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a]" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <span className="font-display text-xl font-semibold text-white">
            Premium<span className="text-gold">Name</span>Shop
          </span>
          <p className="text-neutral-500 text-sm mt-3 max-w-xs">
            A curated marketplace of premium, brandable domain names for founders,
            startups and investors.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-500">Get in touch</p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <a href={`mailto:${CONTACTS.email}`} data-testid="footer-email" className="flex items-center gap-2 text-neutral-300 hover:text-gold transition-colors">
              <Mail className="w-4 h-4" /> {CONTACTS.email}
            </a>
            <a href={CONTACTS.whatsappLink} target="_blank" rel="noreferrer" data-testid="footer-whatsapp" className="flex items-center gap-2 text-neutral-300 hover:text-gold transition-colors">
              <MessageCircle className="w-4 h-4" /> {CONTACTS.whatsappDisplay}
            </a>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-500">Follow</p>
          <div className="mt-4 flex gap-3">
            <a href={CONTACTS.linkedin} target="_blank" rel="noreferrer" data-testid="footer-linkedin" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-300 hover:text-gold hover:border-gold/50 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href={CONTACTS.facebook} target="_blank" rel="noreferrer" data-testid="footer-facebook" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-300 hover:text-gold hover:border-gold/50 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href={CONTACTS.whatsappLink} target="_blank" rel="noreferrer" data-testid="footer-whatsapp-icon" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-300 hover:text-gold hover:border-gold/50 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} PremiumNameShop. All rights reserved.</p>
          <Link to="/admin/login" data-testid="footer-admin-link" className="hover:text-neutral-400 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
