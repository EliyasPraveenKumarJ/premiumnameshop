# PremiumNameShop — Product Requirements Document

## Original Problem Statement
Professional website for "PremiumNameShop" to list premium domains for sale. Owner updates the domain list (admin panel), SEO-friendly, customers can request price / make an offer. Contact: yazziestech@gmail.com, WhatsApp +91 6383926053, LinkedIn, Facebook. Keep top-domainer portfolio as reference. 51 domains supplied via CSV.

## Users
- **Visitors / Buyers**: browse portfolio, search/filter, request price or make an offer.
- **Owner (Admin)**: single JWT account — add/edit/delete domains, set prices, mark featured/sold, view & manage inquiries.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT auth (Bearer + cookie). Routes under `/api`.
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion. Dark luxury theme (obsidian #050505 + champagne gold #d4af37), Sora/Manrope fonts.
- **Email**: Resend (optional, gated by RESEND_API_KEY — currently empty; offers still persist to DB).

## Implemented (2026-06)
- Landing page: hero, trust bar, featured domains, searchable/filterable/sortable portfolio (51 seeded), about/broker section, contact section, footer with all social links.
- Request Price / Make Offer modal → stores offer in DB + emails owner if RESEND_API_KEY set.
- Admin: JWT login, stats dashboard, domain CRUD (add/edit/delete, price, tags, category, featured, status), inquiries management (reply/mark-read/delete).
- SEO: meta/OG tags, JSON-LD, robots.txt, sitemap.xml, semantic headings.
- Verified: 24/24 backend tests, 13/13 frontend flows pass.

## Credentials
- Admin: yazziestech@gmail.com / PremiumNames@2026 (see /app/memory/test_credentials.md)

## Backlog / Next
- P1: Add RESEND_API_KEY to enable email notifications to yazziestech@gmail.com.
- P1: CSV bulk import in admin (user mentioned Excel updates).
- P2: Escrow/payment link (Stripe) for buy-now domains; per-domain SEO pages; analytics on domain views.
- P2: Rate-limiting on login; explicit CORS origin for production.
