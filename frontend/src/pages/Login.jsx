import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatApiErrorDetail } from "@/lib/api";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-white flex items-center justify-center px-6 grid-bg">
      <div className="w-full max-w-md">
        <Link to="/" data-testid="back-home-link" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>
        <div className="rounded-2xl bg-surface border border-white/10 p-8">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-6">
            <Lock className="w-5 h-5 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Admin Access</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to manage your domain portfolio.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <Input
                id="email"
                type="email"
                required
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 bg-[#0a0a0a] border-white/10 focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-neutral-300">Password</Label>
              <Input
                id="password"
                type="password"
                required
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-11 bg-[#0a0a0a] border-white/10 focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" data-testid="login-error">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full h-11 bg-gold text-white hover:bg-gold-hover font-semibold rounded-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
