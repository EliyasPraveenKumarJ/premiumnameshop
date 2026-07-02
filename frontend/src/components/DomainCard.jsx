import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function DomainCard({ domain, onRequest, index = 0 }) {
  const sold = domain.status === "sold";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
      data-testid={`domain-card-${domain.name}`}
      className="group relative flex flex-col justify-between rounded-2xl bg-surface border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_8px_32px_rgba(212,175,55,0.12)]"
    >
      {domain.featured && (
        <span className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase font-bold text-gold">
          Featured
        </span>
      )}
      <div>
        <h3 className="font-display text-xl md:text-2xl font-semibold text-white break-words leading-tight">
          {domain.name}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {(domain.tags || []).slice(0, 3).map((t) => (
            <span key={t} className="tag-chip text-[10px] tracking-wider uppercase px-2 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          {sold ? (
            <span className="text-sm font-semibold text-red-400 uppercase tracking-wide">Sold</span>
          ) : domain.price ? (
            <div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Buy Now</p>
              <p className="text-lg font-display font-semibold text-white">
                ${Number(domain.price).toLocaleString()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Price</p>
              <p className="text-sm text-neutral-300">On Request</p>
            </div>
          )}
        </div>
        {!sold && (
          <Button
            size="sm"
            data-testid={`request-btn-${domain.name}`}
            onClick={() => onRequest(domain)}
            className="bg-gold text-black hover:bg-gold-hover font-semibold rounded-full px-4"
          >
            {domain.price ? "Inquire" : "Make Offer"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
