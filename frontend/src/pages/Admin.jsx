import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid, Inbox, Plus, Pencil, Trash2, LogOut, Mail, ExternalLink, CheckCheck, Home,
} from "lucide-react";

const CATEGORIES = [
  "AI & Tech", "Finance & Crypto", "Apps & SaaS", "Lifestyle & Travel",
  "Rights & Governance", "Business & Brandable", "General",
];
const emptyForm = { name: "", price: "", category: "Business & Brandable", tags: "", description: "", featured: false, status: "available" };

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    api.get("/domains").then((r) => setDomains(r.data));
    api.get("/offers").then((r) => setOffers(r.data));
    api.get("/stats").then((r) => setStats(r.data));
  };

  useEffect(() => {
    document.title = "Admin — PremiumNameShop";
    loadAll();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name,
      price: d.price ?? "",
      category: d.category,
      tags: (d.tags || []).join(", "),
      description: d.description || "",
      featured: d.featured,
      status: d.status,
    });
    setDialogOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: form.price === "" ? null : Number(form.price),
      category: form.category,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: form.description,
      featured: form.featured,
      status: form.status,
    };
    try {
      if (editing) {
        await api.put(`/domains/${editing.id}`, payload);
        toast.success("Domain updated");
      } else {
        await api.post("/domains", payload);
        toast.success("Domain added");
      }
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/domains/${deleteTarget.id}`);
      toast.success("Domain deleted");
      setDeleteTarget(null);
      loadAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const markRead = async (o) => {
    await api.patch(`/offers/${o.id}`);
    loadAll();
  };
  const deleteOffer = async (o) => {
    await api.delete(`/offers/${o.id}`);
    toast.success("Inquiry removed");
    loadAll();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const statCards = [
    { label: "Total Domains", value: stats.total ?? 0 },
    { label: "Available", value: stats.available ?? 0 },
    { label: "Sold", value: stats.sold ?? 0 },
    { label: "New Inquiries", value: stats.new_offers ?? 0, highlight: true },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold" />
            <span className="font-display font-semibold">PremiumNameShop <span className="text-neutral-500 font-normal">Admin</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-neutral-500">{user?.email}</span>
            <Button variant="outline" size="sm" data-testid="view-site-btn" onClick={() => navigate("/")} className="border-white/20 bg-transparent hover:bg-white/5 rounded-full">
              <Home className="w-4 h-4 mr-1" /> Site
            </Button>
            <Button variant="outline" size="sm" data-testid="logout-btn" onClick={handleLogout} className="border-white/20 bg-transparent hover:bg-white/5 rounded-full">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Stats */}
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4 mb-10">
          {statCards.map((s) => (
            <div key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`} className={`rounded-2xl bg-surface border p-6 ${s.highlight && s.value > 0 ? "border-gold/50" : "border-white/10"}`}>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">{s.label}</p>
              <p className={`font-display text-3xl font-semibold mt-2 ${s.highlight && s.value > 0 ? "text-gold" : "text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="domains">
          <TabsList className="bg-surface border border-white/10">
            <TabsTrigger value="domains" data-testid="tab-domains" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <LayoutGrid className="w-4 h-4 mr-2" /> Domains
            </TabsTrigger>
            <TabsTrigger value="inquiries" data-testid="tab-inquiries" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Inbox className="w-4 h-4 mr-2" /> Inquiries
              {(stats.new_offers ?? 0) > 0 && (
                <span className="ml-2 text-[10px] bg-gold text-black rounded-full px-1.5 py-0.5 font-bold">{stats.new_offers}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* DOMAINS */}
          <TabsContent value="domains" className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl">Domain Portfolio ({domains.length})</h2>
              <Button data-testid="add-domain-btn" onClick={openAdd} className="bg-gold text-black hover:bg-gold-hover font-semibold rounded-full">
                <Plus className="w-4 h-4 mr-1" /> Add Domain
              </Button>
            </div>
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0a0a0a] text-neutral-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-4">Domain</th>
                      <th className="text-left px-5 py-4">Category</th>
                      <th className="text-left px-5 py-4">Price</th>
                      <th className="text-left px-5 py-4">Status</th>
                      <th className="text-left px-5 py-4">Featured</th>
                      <th className="text-right px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((d) => (
                      <tr key={d.id} data-testid={`admin-row-${d.name}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="px-5 py-4 font-medium text-white">{d.name}</td>
                        <td className="px-5 py-4 text-neutral-400">{d.category}</td>
                        <td className="px-5 py-4 text-neutral-300">{d.price ? `$${Number(d.price).toLocaleString()}` : "On Request"}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${d.status === "sold" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>{d.status}</span>
                        </td>
                        <td className="px-5 py-4">{d.featured ? <span className="text-gold text-xs">★</span> : <span className="text-neutral-600">—</span>}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button data-testid={`edit-${d.name}`} onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-gold transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button data-testid={`delete-${d.name}`} onClick={() => setDeleteTarget(d)} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* INQUIRIES */}
          <TabsContent value="inquiries" className="mt-8">
            <h2 className="font-display text-xl mb-6">Customer Inquiries ({offers.length})</h2>
            {offers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-12 text-center text-neutral-500" data-testid="no-inquiries">
                <Inbox className="w-8 h-8 mx-auto mb-3 opacity-40" />
                No inquiries yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {offers.map((o) => (
                  <div key={o.id} data-testid={`inquiry-${o.id}`} className={`rounded-2xl bg-surface border p-6 ${o.status === "new" ? "border-gold/40" : "border-white/10"}`}>
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-lg text-white">{o.domain_name}</h3>
                          {o.status === "new" && <span className="text-[10px] bg-gold text-black rounded-full px-2 py-0.5 font-bold uppercase">New</span>}
                        </div>
                        <p className="text-sm text-neutral-400 mt-1">{o.name} · {o.email}</p>
                        {o.offer_amount != null && (
                          <p className="text-sm mt-2"><span className="text-neutral-500">Offer:</span> <span className="text-gold font-semibold">${Number(o.offer_amount).toLocaleString()}</span></p>
                        )}
                        {o.message && <p className="text-sm text-neutral-300 mt-2 max-w-xl">{o.message}</p>}
                        <p className="text-xs text-neutral-600 mt-3">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={`mailto:${o.email}?subject=Re: ${o.domain_name}`} data-testid={`reply-${o.id}`}>
                          <Button size="sm" className="bg-gold text-black hover:bg-gold-hover rounded-full w-full">
                            <Mail className="w-4 h-4 mr-1" /> Reply
                          </Button>
                        </a>
                        {o.status === "new" && (
                          <Button size="sm" variant="outline" data-testid={`mark-read-${o.id}`} onClick={() => markRead(o)} className="border-white/20 bg-transparent hover:bg-white/5 rounded-full">
                            <CheckCheck className="w-4 h-4 mr-1" /> Mark read
                          </Button>
                        )}
                        <Button size="sm" variant="outline" data-testid={`delete-inquiry-${o.id}`} onClick={() => deleteOffer(o)} className="border-white/20 bg-transparent hover:bg-white/5 text-red-400 rounded-full">
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="domain-form-dialog" className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing ? "Edit Domain" : "Add Domain"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label className="text-neutral-300">Domain Name</Label>
              <Input required data-testid="form-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold" placeholder="example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300">Price (USD)</Label>
                <Input type="number" min="0" data-testid="form-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold" placeholder="Leave empty for 'On Request'" />
              </div>
              <div>
                <Label className="text-neutral-300">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="form-category" className="mt-1 bg-[#0a0a0a] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-neutral-300">Tags <span className="text-neutral-500">(comma separated)</span></Label>
              <Input data-testid="form-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold" placeholder="AI, Brandable, Premium" />
            </div>
            <div>
              <Label className="text-neutral-300">Description</Label>
              <Textarea rows={2} data-testid="form-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 bg-[#0a0a0a] border-white/10 focus:border-gold" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch data-testid="form-featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                <Label className="text-neutral-300">Featured</Label>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-neutral-300">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="form-status" className="w-36 bg-[#0a0a0a] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving} data-testid="form-submit" className="bg-gold text-black hover:bg-gold-hover font-semibold rounded-full w-full">
                {saving ? "Saving..." : editing ? "Update Domain" : "Add Domain"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 hover:bg-white/5 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-delete-btn" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
