import React, { useState } from "react";
import { User, Lock, X, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [userid, setUserid] = useState("");
  const [user_pass, setUserPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userid || !user_pass) {
      setError("Please fill in both username and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login({ userid, user_pass });
      setUserid("");
      setUserPass("");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm">
      <div className="bento-card w-full max-w-sm p-0 overflow-hidden shadow-2xl">
        {/* Title Bar */}
        <div className="bg-surface2 border-b border-border px-3.5 py-2.5 sm:p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User size={16} className="text-accent" />
            <span className="font-bold text-xs sm:text-sm text-primary uppercase tracking-wide">
              Player Account Login
            </span>
          </div>
          <button
            onClick={closeLoginModal}
            className="text-muted hover:text-primary transition-colors p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-surface">
          <div className="text-xs sm:text-sm text-muted">
            Log in with your rAthena credentials to access your private Net Worth, Investment Bank, and Character data.
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center space-x-2 text-xs sm:text-sm text-danger">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-muted font-medium uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                placeholder="Account User ID"
                className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2.5 pl-10 text-sm text-primary placeholder:text-muted outline-none transition-colors min-h-[42px]"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted font-medium uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="password"
                value={user_pass}
                onChange={(e) => setUserPass(e.target.value)}
                placeholder="Account Password"
                className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2.5 pl-10 text-sm text-primary placeholder:text-muted outline-none transition-colors min-h-[42px]"
                required
              />
            </div>
          </div>

          <div className="pt-3 sm:pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeLoginModal}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-primary hover:bg-primary/90 text-background font-bold text-sm py-2 px-6 rounded-md transition-colors min-h-[42px] ${loading ? "opacity-60" : ""}`}
            >
              {loading ? "Authenticating..." : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
