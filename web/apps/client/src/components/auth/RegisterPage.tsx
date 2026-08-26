import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, ArrowRight, UserCheck, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface RegisterPageProps {
  onNavigate?: (tab: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { user, register } = useAuth();
  const [userid, setUserid] = useState("");
  const [email, setEmail] = useState("");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [user_pass, setUserPass] = useState("");
  const [confirm_pass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigateTo = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      window.location.hash = tab.toLowerCase();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = userid.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUser || !user_pass) {
      setError("Please fill in all required fields.");
      return;
    }

    if (trimmedUser.length < 4 || trimmedUser.length > 23) {
      setError("Username must be between 4 and 23 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (user_pass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (user_pass !== confirm_pass) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register({
        userid: trimmedUser,
        user_pass,
        confirm_pass,
        email: trimmedEmail,
        sex,
      });
      navigateTo("CHARACTER");
    } catch (err: any) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bento-card max-w-md w-full p-6 sm:p-7 shadow-xl space-y-4 bg-surface border-border">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center text-success">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">New Account</h1>
              <p className="text-[11px] text-muted font-medium mt-0.5">Register for Solo Server</p>
            </div>
          </div>
          <span className="text-[11px] text-success font-medium font-mono">Free</span>
        </div>

        {/* Title */}
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-primary">Create an account</h2>
          <p className="text-xs text-muted">Your account works for both game client and web portal.</p>
        </div>

        {/* Alt-Account Banner if already logged in */}
        {user && (
          <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent space-y-0.5">
            <div className="font-semibold">Notice: Active session detected</div>
            <div className="text-[11px] text-muted">
              You are currently logged in as <span className="text-primary font-mono font-bold">{user.userid}</span>. Registering will switch to your new alt account.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center gap-2 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Username */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted font-medium" htmlFor="reg-user">Username</label>
              <span className="text-[10px] text-muted font-mono">4–23 characters</span>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-user"
                type="text"
                required
                minLength={4}
                maxLength={23}
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted/60 outline-none transition-all min-h-[42px]"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium" htmlFor="reg-email">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted/60 outline-none transition-all min-h-[42px]"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Gender Selection (rAthena character base sprite) */}
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Account Gender (Character Model)</label>
            <div className="grid grid-cols-2 gap-2 bg-surface2 p-1 rounded-lg border border-border/80">
              <button
                type="button"
                onClick={() => setSex("M")}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sex === "M"
                    ? "bg-surface text-accent shadow-sm border border-border/60"
                    : "text-muted hover:text-primary"
                }`}
              >
                <span>♂ Male</span>
              </button>
              <button
                type="button"
                onClick={() => setSex("F")}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sex === "F"
                    ? "bg-surface text-pink-400 shadow-sm border border-border/60"
                    : "text-muted hover:text-primary"
                }`}
              >
                <span>♀ Female</span>
              </button>
            </div>
          </div>

          {/* Password & Confirm Password (2-column layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium" htmlFor="reg-pass">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-pass"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={user_pass}
                  onChange={(e) => setUserPass(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg pl-9 pr-8 py-2 text-sm text-primary placeholder:text-muted/60 outline-none transition-all min-h-[42px]"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted font-medium" htmlFor="reg-confirm">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirm_pass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted/60 outline-none transition-all min-h-[42px]"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-success hover:bg-success/90 text-background font-bold text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[42px] mt-2 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Creating Account..." : "Create Account & Log In"}</span>
          </button>
        </form>

        {/* Divider & Switch to Login */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs">
          <span className="text-muted">Already registered?</span>
          <button
            type="button"
            onClick={() => navigateTo("LOGIN")}
            className="text-accent hover:underline font-medium flex items-center gap-1"
          >
            <span>Sign in here</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
