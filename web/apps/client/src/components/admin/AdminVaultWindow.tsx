import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Database,
  Download,
  Upload,
  UserPlus,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Coins,
  Server,
  X,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileArchive,
  UserCheck,
  Activity,
  Dices,
} from "lucide-react";
import { api } from "../../lib/api";
import { formatZeny } from "../../lib/assets";
import { AdminGachaManager } from "./AdminGachaManager";

interface AdminVaultWindowProps {
  onClose: () => void;
}

interface SystemStats {
  totalAccounts: number;
  totalCharacters: number;
  totalZeny: number;
  onlineCharacters: number;
}

export const AdminVaultWindow: React.FC<AdminVaultWindowProps> = ({ onClose }) => {
  // Master Admin Key State
  const [adminKey, setAdminKey] = useState<string>(
    localStorage.getItem("rathena_admin_key") || ""
  );
  const [isKeyUnlocked, setIsKeyUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"backup" | "accounts" | "overview" | "gacha">("backup");

  // System Stats
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  // Account Setup Form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newSex, setNewSex] = useState<"M" | "F">("M");
  const [newGroupId, setNewGroupId] = useState<number>(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Backup & Restore State
  const [passphrase, setPassphrase] = useState<string>(
    localStorage.getItem("rathena_backup_passphrase") || ""
  );
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Keyboard navigation (Escape key closes modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch status & stats
  const fetchStatus = async () => {
    setIsLoadingStats(true);
    try {
      const res = await api.get<{ status: string; stats: SystemStats }>("/api/admin/status");
      setStats(res.stats);
      setIsKeyUnlocked(true);
    } catch {
      setIsKeyUnlocked(false);
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Save / Clear Admin Key
  const handleSaveKey = () => {
    if (!adminKey.trim()) {
      handleClearKey();
      return;
    }
    localStorage.setItem("rathena_admin_key", adminKey);
    fetchStatus();
  };

  const handleClearKey = () => {
    localStorage.removeItem("rathena_admin_key");
    setAdminKey("");
    setIsKeyUnlocked(false);
    setStats(null);
  };

  // 1. Handle Account Creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setIsCreatingAccount(true);
    setAccountFeedback(null);

    try {
      const res = await api.post<{ success: boolean; message: string; accountId: number }>(
        "/api/admin/setup/account",
        {
          username: newUsername,
          password: newPassword,
          sex: newSex,
          groupId: newGroupId,
        }
      );

      setAccountFeedback({
        type: "success",
        text: `Account created successfully! ID: #${res.accountId} (${newGroupId === 99 ? "Admin / GM" : "Player"})`,
      });
      setNewUsername("");
      setNewPassword("");
      fetchStatus();
    } catch (err: any) {
      setAccountFeedback({
        type: "error",
        text: err.message || "Failed to create account. Check your Master Key.",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // 2. Handle Savegame Backup Export
  const handleExportBackup = async () => {
    if (!passphrase) {
      setBackupFeedback({ type: "error", text: "Please set a backup password or passphrase first." });
      return;
    }

    setIsExporting(true);
    setBackupFeedback(null);
    localStorage.setItem("rathena_backup_passphrase", passphrase);

    try {
      const queryParams = new URLSearchParams({
        passphrase,
        adminKey,
      });

      const response = await fetch(`/api/admin/backup/export?${queryParams.toString()}`, {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      let filename = `ragnarok_save_${new Date().toISOString().slice(0, 10)}.sql.gz.enc`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setBackupFeedback({
        type: "success",
        text: `Savegame backup downloaded: ${filename} (${(blob.size / 1024).toFixed(1)} KB)`,
      });
    } catch (err: any) {
      setBackupFeedback({
        type: "error",
        text: err.message || "Failed to export backup. Please verify your Master Key.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Handle Backup Restore
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      setRestoreFeedback({ type: "error", text: "Please select a backup file." });
      return;
    }
    if (!passphrase) {
      setRestoreFeedback({ type: "error", text: "Please provide the decryption password." });
      return;
    }

    setIsRestoring(true);
    setRestoreFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("passphrase", passphrase);

      const response = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: {
          "x-admin-key": adminKey,
        },
        body: formData,
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || "Failed to restore database");
      }

      setRestoreFeedback({
        type: "success",
        text: `Database restored successfully! Processed ${(res.restoredBytes / 1024).toFixed(1)} KB of game data.`,
      });
      setSelectedFile(null);
      setRestoreConfirm(false);
      fetchStatus();
    } catch (err: any) {
      setRestoreFeedback({
        type: "error",
        text: err.message || "Restore failed. Incorrect password or invalid file.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header & Title Bar */}
        <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-primary tracking-wide">
                  Server Management & Backups
                </span>
              </div>
              <div className="text-[11px] text-muted flex items-center gap-1.5">
                <span>Solo-Centric Admin Portal</span>
                <span>•</span>
                <span className="text-success flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Game Server Online
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface shrink-0 cursor-pointer"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Master Key Security Drawer */}
        <div className="bg-surface border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs flex-1 min-w-[240px]">
            <Key size={14} className={isKeyUnlocked ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
            <span className="text-muted font-medium text-xs">Master Key:</span>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin Key (ADMIN_KEY in .env)..."
              className="bg-background border border-border focus:border-accent rounded px-2.5 py-1 text-xs text-primary font-mono outline-none flex-1 max-w-xs transition-colors"
            />
            <button
              onClick={handleSaveKey}
              className="bg-surface2 hover:bg-surface2/80 text-primary border border-border px-2.5 py-1 rounded text-xs font-semibold transition-colors"
            >
              {isKeyUnlocked ? "Saved" : "Unlock"}
            </button>
            {isKeyUnlocked && (
              <button
                onClick={handleClearKey}
                className="text-muted hover:text-danger text-[11px] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-[11px] text-muted flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isKeyUnlocked ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={isKeyUnlocked ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
              {isKeyUnlocked ? "Admin Authenticated" : "Key Locked"}
            </span>
          </div>
        </div>

        {/* 3. Segmented Navigation Tabs */}
        <div className="flex border-b border-border bg-surface px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("backup")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === "backup"
                ? "border-accent text-accent bg-surface2/40"
                : "border-transparent text-muted hover:text-primary font-medium"
            }`}
          >
            <Lock size={14} />
            <span>Savegame Backup & Restore</span>
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === "accounts"
                ? "border-accent text-accent bg-surface2/40"
                : "border-transparent text-muted hover:text-primary font-medium"
            }`}
          >
            <UserPlus size={14} />
            <span>Account Manager</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("overview");
              fetchStatus();
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === "overview"
                ? "border-accent text-accent bg-surface2/40"
                : "border-transparent text-muted hover:text-primary font-medium"
            }`}
          >
            <Activity size={14} />
            <span>Server Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("gacha")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === "gacha"
                ? "border-accent text-accent bg-surface2/40"
                : "border-transparent text-muted hover:text-primary font-medium"
            }`}
          >
            <Dices size={14} />
            <span>Gacha Manager</span>
          </button>
        </div>

        {/* 4. Tab Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-surface text-xs sm:text-sm">
          {/* TAB 1: SAVEGAME BACKUP & RESTORE */}
          {activeTab === "backup" && (
            <div className="space-y-4">
              {/* Passphrase Card */}
              <div className="p-3.5 rounded-xl bg-surface2/50 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-accent" />
                    <span className="font-bold text-xs text-primary">
                      Backup Password / Passphrase
                    </span>
                  </div>
                  <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded border border-border">
                    Optional Encryption
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassphrase ? "text" : "password"}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter a password to protect your savegame file..."
                      className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs text-primary font-mono outline-none pr-9 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                    >
                      {showPassphrase ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassphrase(`Ragnarok_${Math.random().toString(36).slice(2, 10)}!`)}
                    className="bg-surface2 hover:bg-surface2/80 text-primary border border-border px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className="text-accent" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Left Card: Export Snapshot */}
                <div className="p-4 rounded-xl bg-surface2/30 border border-border flex flex-col justify-between space-y-3.5 hover:border-border/80 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-success font-bold text-xs">
                      <div className="w-6 h-6 rounded-md bg-success/10 border border-success/20 flex items-center justify-center">
                        <Download size={14} className="text-success" />
                      </div>
                      <span>Export Savegame Backup</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Downloads a complete snapshot of your characters, inventories, storage, quest progression, and market holdings.
                    </p>
                  </div>

                  {backupFeedback && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        backupFeedback.type === "success"
                          ? "bg-success/10 border-success/20 text-success"
                          : "bg-danger/10 border-danger/20 text-danger"
                      }`}
                    >
                      {backupFeedback.type === "success" ? (
                        <CheckCircle size={15} className="shrink-0" />
                      ) : (
                        <AlertTriangle size={15} className="shrink-0" />
                      )}
                      <span>{backupFeedback.text}</span>
                    </div>
                  )}

                  <button
                    onClick={handleExportBackup}
                    disabled={isExporting}
                    className="w-full bg-success/20 hover:bg-success/30 text-success border border-success/30 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Packaging Savegame...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Download Savegame Backup</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Card: Restore from Backup */}
                <div className="p-4 rounded-xl bg-surface2/30 border border-border flex flex-col justify-between space-y-3.5 hover:border-border/80 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent font-bold text-xs">
                      <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Upload size={14} className="text-accent" />
                      </div>
                      <span>Restore from Backup</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Restores your server game data and stock exchange state from a previously exported backup file.
                    </p>
                  </div>

                  {/* File Picker */}
                  <div
                    className="p-3 rounded-lg bg-background border border-dashed border-border hover:border-accent/50 text-center cursor-pointer transition-colors"
                    onClick={() => document.getElementById("admin-backup-file-upload")?.click()}
                  >
                    <input
                      type="file"
                      accept=".enc,.sql,.gz"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                          setRestoreFeedback(null);
                        }
                      }}
                      className="hidden"
                      id="admin-backup-file-upload"
                    />
                    <div className="flex flex-col items-center gap-1 text-xs text-muted">
                      <FileArchive size={16} className="text-accent" />
                      <span className={`font-medium ${selectedFile ? "text-success font-mono" : "text-primary"}`}>
                        {selectedFile ? `📁 ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : "Click to select backup file"}
                      </span>
                      <span className="text-[10px] text-muted">
                        Select an exported .sql.gz.enc backup file
                      </span>
                    </div>
                  </div>

                  {restoreFeedback && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        restoreFeedback.type === "success"
                          ? "bg-success/10 border-success/20 text-success"
                          : "bg-danger/10 border-danger/20 text-danger"
                      }`}
                    >
                      {restoreFeedback.type === "success" ? (
                        <CheckCircle size={15} className="shrink-0" />
                      ) : (
                        <AlertTriangle size={15} className="shrink-0" />
                      )}
                      <span>{restoreFeedback.text}</span>
                    </div>
                  )}

                  {restoreConfirm ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[11px] text-danger font-bold justify-center">
                        <AlertTriangle size={13} />
                        <span>Warning: This will overwrite existing game data!</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRestoreBackup}
                          disabled={isRestoring}
                          className="flex-1 bg-danger hover:bg-danger/90 text-background font-bold text-xs py-2 px-3 rounded-lg border border-danger/50 transition-colors cursor-pointer"
                        >
                          {isRestoring ? "Restoring..." : "Yes, Restore Now"}
                        </button>
                        <button
                          onClick={() => setRestoreConfirm(false)}
                          className="bg-surface2 hover:bg-surface2/80 text-muted hover:text-primary text-xs px-3 py-2 rounded-lg border border-border transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!selectedFile) {
                          setRestoreFeedback({ type: "error", text: "Please select a backup file first." });
                          return;
                        }
                        setRestoreConfirm(true);
                      }}
                      disabled={!selectedFile || isRestoring}
                      className="w-full bg-surface2 hover:bg-surface2/80 text-primary border border-border font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Upload size={14} className="text-accent" />
                      <span>Restore Game Database</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT MANAGER */}
          {activeTab === "accounts" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface2/40 border border-border space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <UserPlus size={16} className="text-accent" />
                  <span>Create Game Account</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Instantly provision new player or Game Master (GM) accounts for your server without manual database tools.
                </p>

                {accountFeedback && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      accountFeedback.type === "success"
                        ? "bg-success/10 border-success/20 text-success"
                        : "bg-danger/10 border-danger/20 text-danger"
                    }`}
                  >
                    {accountFeedback.type === "success" ? (
                      <CheckCircle size={15} className="shrink-0" />
                    ) : (
                      <AlertTriangle size={15} className="shrink-0" />
                    )}
                    <span>{accountFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Username</label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. AliceHero"
                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs text-primary font-mono outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Password</label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs text-primary font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Gender</label>
                      <select
                        value={newSex}
                        onChange={(e) => setNewSex(e.target.value as "M" | "F")}
                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs text-primary outline-none transition-colors"
                      >
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Account Role</label>
                      <select
                        value={newGroupId}
                        onChange={(e) => setNewGroupId(Number(e.target.value))}
                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs text-primary outline-none transition-colors"
                      >
                        <option value={0}>Standard Player (Group 0)</option>
                        <option value={99}>Master Administrator / GM (Group 99)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingAccount}
                    className="w-full bg-accent hover:bg-accent/90 text-background font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isCreatingAccount ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SERVER OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-3.5">
              {!isKeyUnlocked && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                  <Key size={16} className="shrink-0 text-amber-400" />
                  <span>Master Key required to query live metrics. Enter your key in the top bar to authenticate.</span>
                </div>
              )}

              {/* 4-Stat Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-surface2/50 border border-border rounded-xl p-3 text-center">
                  <Users size={16} className="text-accent mx-auto mb-1" />
                  <div className="text-[10px] text-muted uppercase tracking-wider font-medium">Accounts</div>
                  <div className="text-sm font-bold font-mono text-primary mt-0.5">
                    {stats ? stats.totalAccounts : "—"}
                  </div>
                </div>
                <div className="bg-surface2/50 border border-border rounded-xl p-3 text-center">
                  <Server size={16} className="text-info mx-auto mb-1" />
                  <div className="text-[10px] text-muted uppercase tracking-wider font-medium">Characters</div>
                  <div className="text-sm font-bold font-mono text-primary mt-0.5">
                    {stats ? stats.totalCharacters : "—"}
                  </div>
                </div>
                <div className="bg-surface2/50 border border-border rounded-xl p-3 text-center">
                  <Coins size={16} className="text-accent mx-auto mb-1" />
                  <div className="text-[10px] text-muted uppercase tracking-wider font-medium">Circulating Zeny</div>
                  <div className="text-xs font-bold font-mono text-accent mt-1 truncate">
                    {stats ? formatZeny(stats.totalZeny) : "—"} Z
                  </div>
                </div>
                <div className="bg-surface2/50 border border-border rounded-xl p-3 text-center">
                  <Database size={16} className="text-success mx-auto mb-1" />
                  <div className="text-[10px] text-muted uppercase tracking-wider font-medium">Online Players</div>
                  <div className="text-sm font-bold font-mono text-success mt-0.5">
                    {stats ? `${stats.onlineCharacters} Live` : "—"}
                  </div>
                </div>
              </div>

              {/* Services Card */}
              <div className="p-4 rounded-xl bg-surface2/40 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-primary">
                    <Server size={15} className="text-info" />
                    <span>Server Services Status</span>
                  </div>
                  <button
                    onClick={fetchStatus}
                    className="text-xs text-muted hover:text-primary flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} className={`text-accent ${isLoadingStats ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="text-xs text-muted space-y-1.5 pt-1">
                  <div className="flex justify-between items-center bg-background/60 p-2 rounded-lg border border-border/50">
                    <span className="text-muted font-medium">Primary Game Database:</span>
                    <span className="text-success font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-background/60 p-2 rounded-lg border border-border/50">
                    <span className="text-muted font-medium">Live Analytics & Web Portal:</span>
                    <span className="text-success font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-background/60 p-2 rounded-lg border border-border/50">
                    <span className="text-muted font-medium">Savegame Backup Engine:</span>
                    <span className="text-accent font-bold">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GACHA MANAGER */}
          {activeTab === "gacha" && (
            <AdminGachaManager adminKey={adminKey} />
          )}
        </div>

        {/* 5. Modal Footer */}
        <div className="bg-surface2 border-t border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted shrink-0">
          <span>Solo-Centric Server Management</span>
          <span className="text-primary/70">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px]">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
