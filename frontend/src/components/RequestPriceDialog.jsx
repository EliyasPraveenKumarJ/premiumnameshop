import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function RequestPriceDialog({ domain, open, onOpenChange }) {
  const [form, setForm] = useState({ name: "", email: "", offer_amount: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", offer_amount: "", message: "" });
      setDone(false);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/offers", {
        domain_id: domain?.id,
        domain_name: domain?.name,
        name: form.name,
        email: form.email,
        offer_amount: form.offer_amount ? Number(form.offer_amount) : null,
        message: form.message,
      });
      setDone(true);
      toast.success("Inquiry sent! We'll get back to you shortly.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="request-price-dialog"
        className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-md"
      >
        {done ? (
          <div className="py-8 text-center" data-testid="offer-success">
            <CheckCircle2 className="w-14 h-14 text-gold mx-auto" />
            <h3 className="font-display text-2xl mt-4">Inquiry Received</h3>
            <p className="text-neutral-400 mt-2 text-sm">
              Thanks {form.name || "there"}. We received your interest in{" "}
              <span className="text-gold">{domain?.name}</span> and will respond via email soon.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              data-testid="offer-close-btn"
              className="mt-6 bg-gold text-black hover:bg-gold-hover font-semibold rounded-full"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {domain?.price ? "Inquire about" : "Make an Offer"}
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                <span className="text-gold font-medium">{domain?.name}</span>
                {domain?.price ? ` — Buy Now $${Number(domain.price).toLocaleString()}` : ""}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="name" className="text-neutral-300">Your Name</Label>
                <Input
                  id="name"
                  required
                  data-testid="offer-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-neutral-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  data-testid="offer-email-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <Label htmlFor="offer" className="text-neutral-300">
                  Your Offer (USD) <span className="text-neutral-500">— optional</span>
                </Label>
                <Input
                  id="offer"
                  type="number"
                  min="0"
                  data-testid="offer-amount-input"
                  placeholder="e.g. 2500"
                  value={form.offer_amount}
                  onChange={(e) => setForm({ ...form, offer_amount: e.target.value })}
                  className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-neutral-300">Message</Label>
                <Textarea
                  id="message"
                  rows={3}
                  data-testid="offer-message-input"
                  placeholder="Tell us about your interest..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                data-testid="offer-submit-btn"
                className="w-full bg-gold text-black hover:bg-gold-hover font-semibold rounded-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Inquiry"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
