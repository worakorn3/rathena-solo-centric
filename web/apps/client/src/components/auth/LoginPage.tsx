import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, AlertCircle, LogIn, ArrowRight, Shield, Crosshair, LayoutDashboard, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginPageProps {
  onNavigate?: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { user, login, logout } = useAuth();
  const [userid, setUserid] = useState("");
  const [user_pass, setUserPass] = useState("");
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
    if (!userid || !user_pass) {
      setError("Please enter both username and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login({ userid, user_pass });
      navigateTo("CHARACTER");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate account.");
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, show active session card
  if (user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bento-card max-w-md w-full p-6 sm:p-7 shadow-xl space-y-5 bg-surface border-border">
          <div className="flex items-center gap-3 pb-3 border-b border-border/80">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted font-medium">Active Session</div>
              <div className="text-sm font-bold text-primary font-mono">{user.userid}</div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted">
            <p>You are already logged into this account.</p>
            <div className="p-3 rounded-lg bg-surface2 border border-border text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="text-primary font-semibold">{user.accountId}</span>
              </div>
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="text-accent font-semibold">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Gender:</span>
                <span className="text-primary font-semibold">{user.sex === "M" ? "Male (♂)" : "Female (♀)"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => navigateTo("CHARACTER")}
              className="w-full bg-primary hover:bg-primary/90 text-background font-bold text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[42px]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Continue to Character Sheet</span>
            </button>

            <button
              onClick={() => navigateTo("REGISTER")}
              className="w-full bg-surface2 hover:bg-surface2/80 text-primary font-semibold text-xs py-2.5 px-4 rounded-lg border border-border transition-colors flex items-center justify-center gap-2 min-h-[40px]"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>Register a Second Account</span>
            </button>

            <button
              onClick={logout}
              className="w-full bg-danger/10 hover:bg-danger/20 text-danger font-semibold text-xs py-2 px-4 rounded-lg border border-danger/20 transition-colors flex items-center justify-center gap-2 min-h-[38px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bento-card max-w-md w-full p-6 sm:p-7 shadow-xl space-y-5 bg-surface border-border">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center text-accent">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">Ragnarok Online</h1>
              <p className="text-[11px] text-muted font-medium mt-0.5">Solo Server Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface2 border border-border text-[11px] text-muted font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-primary">Log in to your account</h2>
          <p className="text-xs text-muted">Enter your game username and password to access the portal.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center gap-2 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium" htmlFor="login-user">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-user"
                type="text"
                required
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                placeholder="Game username"
                className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted/60 outline-none transition-all min-h-[42px]"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted font-medium" htmlFor="login-pass">Password</label>
              <button
                type="button"
                onClick={() => alert("Passwords can be updated in-game or via the Admin Vault.")}
                className="text-[11px] text-accent hover:underline"
              >
                Help?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-pass"
                type={showPassword ? "text" : "password"}
                required
                value={user_pass}
                onChange={(e) => setUserPass(e.target.value)}
                placeholder="Password"
                className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg pl-9 pr-10 py-2 text-sm text-primary placeholder:text-muted/60 outline-none transition-all min-h-[42px]"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-primary hover:bg-primary/90 text-background font-bold text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[42px] mt-1 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Authenticating..." : "Log In"}</span>
          </button>
        </form>

        {/* Divider & Footer Actions */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => navigateTo("REGISTER")}
            className="text-muted hover:text-accent transition-colors font-medium"
          >
            Create an account
          </button>
          <button
            type="button"
            onClick={() => navigateTo("CHARACTER")}
            className="text-muted hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>Guest View</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
