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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="ro-window w-full max-w-sm shadow-2xl">
        {/* Title Bar */}
        <div className="ro-titlebar">
          <div className="flex items-center space-x-2">
            <User size={14} className="text-ro-gold" />
            <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
              Player Account Login
            </span>
          </div>
          <button
            onClick={closeLoginModal}
            className="w-5 h-5 rounded bg-[#2a3c50] hover:bg-red-900 text-slate-300 flex items-center justify-center border border-ro-borderLight/30 text-xs"
          >
            <X size={12} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 bg-[#1a2332]/95">
          <div className="text-[11px] text-slate-300">
            Log in with your rAthena credentials to access your private Net Worth, Investment Bank, and Character data.
          </div>

          {error && (
            <div className="p-2.5 rounded bg-red-950/80 border border-red-500/50 flex items-center space-x-2 text-xs text-red-200">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-mono font-medium">Username</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                placeholder="Account User ID"
                className="w-full bg-[#121824] border border-[#364960] focus:border-ro-gold rounded px-3 py-1.5 pl-8 text-xs text-slate-100 placeholder:text-slate-500 outline-none shadow-roInset font-mono"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-mono font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="password"
                value={user_pass}
                onChange={(e) => setUserPass(e.target.value)}
                placeholder="Account Password"
                className="w-full bg-[#121824] border border-[#364960] focus:border-ro-gold rounded px-3 py-1.5 pl-8 text-xs text-slate-100 placeholder:text-slate-500 outline-none shadow-roInset font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeLoginModal}
              className="ro-button py-1 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`ro-button-gold py-1 px-4 ${loading ? "opacity-60" : ""}`}
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
