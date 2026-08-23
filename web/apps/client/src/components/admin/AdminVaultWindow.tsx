import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Database,
  Download,
  Upload,
  UserPlus,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Coins,
  Server,
} from "lucide-react";
import { RoWindow } from "../layout/RoWindow";
import { api } from "../../lib/api";
import { formatZeny } from "../../lib/assets";

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
    localStorage.getItem("rathena_admin_key") || "SoloCentricKey2026!"
  );
  const [isKeyUnlocked, setIsKeyUnlocked] = useState<boolean>(
    Boolean(localStorage.getItem("rathena_admin_key"))
  );
  const [activeTab, setActiveTab] = useState<"setup" | "vault" | "stats">("vault");

  // System Stats
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  // Day 1 Account Setup Form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newSex, setNewSex] = useState<"M" | "F">("M");
  const [newGroupId, setNewGroupId] = useState<number>(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Backup & Restore State
  const [passphrase, setPassphrase] = useState<string>(
    localStorage.getItem("rathena_backup_passphrase") || "SoloCentricKey2026!"
  );
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch status & stats
  const fetchStatus = async () => {
    setIsLoadingStats(true);
    try {
      const res = await api.get<{ status: string; stats: SystemStats }>("/api/admin/status");
      setStats(res.stats);
      setIsKeyUnlocked(true);
    } catch {
      setIsKeyUnlocked(false);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Save Admin Key
  const handleSaveKey = () => {
    localStorage.setItem("rathena_admin_key", adminKey);
    setIsKeyUnlocked(true);
    fetchStatus();
  };

  const handleClearKey = () => {
    localStorage.removeItem("rathena_admin_key");
    setAdminKey("");
    setIsKeyUnlocked(false);
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
        text: `Account created successfully! ID: #${res.accountId} (${newGroupId === 99 ? "Admin/GM" : "Player"})`,
      });
      setNewUsername("");
      setNewPassword("");
      fetchStatus();
    } catch (err: any) {
      setAccountFeedback({
        type: "error",
        text: err.message || "Failed to create account",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // 2. Handle 1-Click Zero-Knowledge Backup Export
  const handleExportBackup = async () => {
    if (!passphrase) {
      setBackupFeedback({ type: "error", text: "Please enter a passphrase for encryption." });
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

      // Trigger standard browser download
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
        text: `Encrypted backup downloaded: ${filename} (${(blob.size / 1024).toFixed(1)} KB)`,
      });
    } catch (err: any) {
      setBackupFeedback({
        type: "error",
        text: err.message || "Failed to export backup",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Handle 1-Click Restore
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      setRestoreFeedback({ type: "error", text: "Please select a .sql.gz.enc backup file." });
      return;
    }
    if (!passphrase) {
      setRestoreFeedback({ type: "error", text: "Please provide the decryption passphrase." });
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
        text: `Restored successfully! Restored ${(res.restoredBytes / 1024).toFixed(1)} KB of database schema & data.`,
      });
      setSelectedFile(null);
      setRestoreConfirm(false);
      fetchStatus();
    } catch (err: any) {
      setRestoreFeedback({
        type: "error",
        text: err.message || "Restore failed. Incorrect passphrase or corrupt file.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <RoWindow
          title="SYSTEM & ZERO-KNOWLEDGE VAULT"
          icon={<Shield size={16} />}
          onClose={onClose}
          className="shadow-2xl border border-ro-borderLight/60 rounded-lg overflow-hidden"
        >
          {/* Top Bar: Master Key & Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-ro-borderLight/30 text-xs">
            {/* Key Status */}
            <div className="flex items-center space-x-2">
              <Key size={14} className={isKeyUnlocked ? "text-emerald-400" : "text-amber-400"} />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Master Admin Key"
                className="bg-[#121824] border border-ro-borderLight/40 rounded px-2 py-1 text-slate-200 text-xs w-36 focus:outline-none focus:border-ro-gold"
              />
              <button
                onClick={handleSaveKey}
                className="bg-[#2a3c50] hover:bg-[#3b5370] text-slate-200 px-2 py-1 rounded font-cinzel font-bold text-[11px] border border-ro-borderLight/40"
              >
                {isKeyUnlocked ? "Key Saved" : "Unlock"}
              </button>
              {isKeyUnlocked && (
                <button
                  onClick={handleClearKey}
                  className="text-slate-400 hover:text-red-400 text-[10px] underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-[#121824] p-0.5 rounded border border-ro-borderLight/30">
              <button
                onClick={() => setActiveTab("vault")}
                className={`px-3 py-1 rounded text-xs font-cinzel font-bold transition-colors ${
                  activeTab === "vault"
                    ? "bg-ro-gold/20 text-ro-gold border border-ro-gold/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Zero-Knowledge Vault
              </button>
              <button
                onClick={() => setActiveTab("setup")}
                className={`px-3 py-1 rounded text-xs font-cinzel font-bold transition-colors ${
                  activeTab === "setup"
                    ? "bg-ro-gold/20 text-ro-gold border border-ro-gold/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Day 1 Setup
              </button>
              <button
                onClick={() => {
                  setActiveTab("stats");
                  fetchStatus();
                }}
                className={`px-3 py-1 rounded text-xs font-cinzel font-bold transition-colors ${
                  activeTab === "stats"
                    ? "bg-ro-gold/20 text-ro-gold border border-ro-gold/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                System Health
              </button>
            </div>
          </div>

          {/* TAB 1: ZERO-KNOWLEDGE VAULT */}
          {activeTab === "vault" && (
            <div className="space-y-4">
              {/* Passphrase Input Section */}
              <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel font-bold text-ro-gold flex items-center gap-1.5">
                    <Lock size={13} />
                    AES-256 Encryption Passphrase
                  </span>
                  <span className="text-[10px] text-slate-400">PBKDF2 SHA-256 (100k iters)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassphrase ? "text" : "password"}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter secret passphrase to encrypt/decrypt..."
                      className="w-full bg-[#0d121c] border border-ro-borderLight/50 rounded px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-ro-gold pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassphrase ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassphrase(`Ragnarok_${Math.random().toString(36).slice(2, 10)}!`)}
                    className="bg-[#2a3c50] hover:bg-[#3b5370] text-slate-300 px-2.5 py-1.5 rounded font-cinzel text-[11px] border border-ro-borderLight/30 whitespace-nowrap"
                  >
                    Generate Key
                  </button>
                </div>
              </div>

              {/* Grid: 1-Click Export & 1-Click Restore */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1-Click Export */}
                <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-400 font-cinzel font-bold text-xs mb-1">
                      <Download size={14} />
                      <span>Download Savegame Backup</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Snapshots your live characters, inventory, storage, zeny, quest progress, and stock portfolio into a Zero-Knowledge encrypted binary (<code className="text-ro-gold">.sql.gz.enc</code>).
                    </p>
                  </div>

                  {backupFeedback && (
                    <div
                      className={`text-[11px] p-2 rounded border ${
                        backupFeedback.type === "success"
                          ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                          : "bg-red-950/40 border-red-700/50 text-red-300"
                      }`}
                    >
                      {backupFeedback.text}
                    </div>
                  )}

                  <button
                    onClick={handleExportBackup}
                    disabled={isExporting}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-cinzel font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-2 border border-emerald-500/40 shadow transition-colors"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Encrypting & Streaming...</span>
                      </>
                    ) : (
                      <>
                        <Download size={13} />
                        <span>Download Encrypted Backup</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1-Click Restore */}
                <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-amber-400 font-cinzel font-bold text-xs mb-1">
                      <Upload size={14} />
                      <span>Disaster Recovery Restore</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Restore from an encrypted snapshot. Overwrites database state with backup contents safely.
                    </p>
                  </div>

                  {/* File Input Box */}
                  <div className="bg-[#0d121c] border border-dashed border-ro-borderLight/60 rounded p-2 text-center text-xs">
                    <input
                      type="file"
                      accept=".enc,.sql"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                          setRestoreFeedback(null);
                        }
                      }}
                      className="hidden"
                      id="backup-file-upload"
                    />
                    <label
                      htmlFor="backup-file-upload"
                      className="cursor-pointer block text-slate-300 hover:text-ro-gold font-medium py-1"
                    >
                      {selectedFile ? (
                        <span className="text-emerald-400 font-mono text-[11px]">
                          📁 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Click to pick .sql.gz.enc file</span>
                      )}
                    </label>
                  </div>

                  {restoreFeedback && (
                    <div
                      className={`text-[11px] p-2 rounded border ${
                        restoreFeedback.type === "success"
                          ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                          : "bg-red-950/40 border-red-700/50 text-red-300"
                      }`}
                    >
                      {restoreFeedback.text}
                    </div>
                  )}

                  {restoreConfirm ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-red-400 font-bold justify-center">
                        <AlertTriangle size={12} />
                        <span>Confirm database overwrite?</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRestoreBackup}
                          disabled={isRestoring}
                          className="flex-1 bg-red-700 hover:bg-red-600 text-white font-cinzel font-bold text-xs py-1.5 px-2 rounded border border-red-500/50"
                        >
                          {isRestoring ? "Restoring..." : "Yes, Restore Now"}
                        </button>
                        <button
                          onClick={() => setRestoreConfirm(false)}
                          className="bg-[#2a3c50] text-slate-300 font-cinzel text-xs px-3 py-1.5 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!selectedFile) {
                          setRestoreFeedback({ type: "error", text: "Please pick a backup file first." });
                          return;
                        }
                        setRestoreConfirm(true);
                      }}
                      disabled={!selectedFile || isRestoring}
                      className="w-full bg-[#2a3c50] hover:bg-[#3b5370] disabled:opacity-50 text-slate-200 font-cinzel font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-2 border border-ro-borderLight/40 shadow transition-colors"
                    >
                      <Upload size={13} />
                      <span>Restore Database</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAY 1 SETUP & ACCOUNTS */}
          {activeTab === "setup" && (
            <div className="space-y-4">
              <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-3 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-ro-gold font-cinzel font-bold text-xs">
                  <UserPlus size={14} />
                  <span>Create Player or Master Account</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Instant account setup directly into the primary database. No need to open HeidiSQL or run terminal queries.
                </p>

                {accountFeedback && (
                  <div
                    className={`text-[11px] p-2 rounded border ${
                      accountFeedback.type === "success"
                        ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                        : "bg-red-950/40 border-red-700/50 text-red-300"
                    }`}
                  >
                    {accountFeedback.text}
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. AliceHero"
                        className="w-full bg-[#0d121c] border border-ro-borderLight/50 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-ro-gold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d121c] border border-ro-borderLight/50 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-ro-gold font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={newSex}
                        onChange={(e) => setNewSex(e.target.value as "M" | "F")}
                        className="w-full bg-[#0d121c] border border-ro-borderLight/50 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-ro-gold"
                      >
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Account Role
                      </label>
                      <select
                        value={newGroupId}
                        onChange={(e) => setNewGroupId(Number(e.target.value))}
                        className="w-full bg-[#0d121c] border border-ro-borderLight/50 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-ro-gold"
                      >
                        <option value={0}>Standard Player (Group 0)</option>
                        <option value={99}>Master Administrator / GM (Group 99)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingAccount}
                    className="w-full bg-ro-gold/20 hover:bg-ro-gold/30 text-ro-gold font-cinzel font-bold text-xs py-2 px-3 rounded border border-ro-gold/50 shadow transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreatingAccount ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} />
                        <span>Create Account in Database</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM HEALTH & STATS */}
          {activeTab === "stats" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-2.5 text-center">
                  <Users size={16} className="text-ro-gold mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Accounts</span>
                  <span className="text-sm font-bold font-mono text-slate-100">
                    {stats ? stats.totalAccounts : "—"}
                  </span>
                </div>
                <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-2.5 text-center">
                  <Server size={16} className="text-emerald-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Characters</span>
                  <span className="text-sm font-bold font-mono text-slate-100">
                    {stats ? stats.totalCharacters : "—"}
                  </span>
                </div>
                <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-2.5 text-center">
                  <Coins size={16} className="text-amber-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Circulating Zeny</span>
                  <span className="text-xs font-bold font-mono text-amber-300 block truncate">
                    {stats ? formatZeny(stats.totalZeny) : "—"}
                  </span>
                </div>
                <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-2.5 text-center">
                  <Database size={16} className="text-info mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Active Online</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {stats ? stats.onlineCharacters : "—"}
                  </span>
                </div>
              </div>

              <div className="bg-[#141b28] border border-ro-borderLight/40 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel font-bold text-slate-200">Database Topology</span>
                  <button
                    onClick={fetchStatus}
                    className="text-slate-400 hover:text-ro-gold flex items-center gap-1 text-[10px]"
                  >
                    <RefreshCw size={11} className={isLoadingStats ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Read Replica (Analytics & Web):</span>
                    <span className="text-emerald-400">Connected (:3307)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Primary Database (Live Game & Backups):</span>
                    <span className="text-emerald-400">Connected (:3306)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zero-Knowledge AES Engine:</span>
                    <span className="text-ro-gold">Enabled (Hardware AES-256)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </RoWindow>
      </div>
    </div>
  );
};
