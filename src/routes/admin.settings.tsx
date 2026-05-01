// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [activeTab, setActiveTab] = useState("Integrations");
  const [settings, setSettings] = useState<any>({
    paystack_secret_key: "",
    paystack_public_key: "",
    mnotify_api_key: "",
    mnotify_sender_id: "",
    google_maps_key: "",
    openai_api_key: "",
    sms_gateway_active: "mnotify",
    is_test_mode: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("settings").select("*").single();

    if (data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel("admin-settings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, (payload) => {
        if (payload.new) {
          setSettings(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("settings").upsert({ id: settings.id || 1, ...settings });

    if (error) alert(error.message);
    else alert("Settings updated in real-time!");
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (resetConfirm !== "RESET") return;
    if (window.confirm("Are you sure? This will wipe platform configurations.")) {
      setSettings({
        paystack_secret_key: "",
        paystack_public_key: "",
        mnotify_api_key: "",
        mnotify_sender_id: "",
        google_maps_key: "",
        openai_api_key: "",
        sms_gateway_active: "mnotify",
        is_test_mode: true,
      });
      setResetConfirm("");
      alert("Settings have been locally reset. Click save to commit.");
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest">Platform Core</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
            Configurations
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage API credentials, security protocols, and third-party integrations.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 mb-10 gap-10">
        {["Integrations", "SEO", "Notifications", "Security"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          {activeTab === "Integrations" && (
            <>
              {/* Payment Integration Card */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                      <span className="material-symbols-outlined text-2xl font-bold">payments</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-none mb-1.5">
                        Payment Gateway
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Configure Paystack for subscription billing and claims processing.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                    <button
                      onClick={() => setSettings({ ...settings, is_test_mode: true })}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${settings.is_test_mode ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
                    >
                      TEST
                    </button>
                    <button
                      onClick={() => setSettings({ ...settings, is_test_mode: false })}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${!settings.is_test_mode ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
                    >
                      LIVE
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Secret Authorization Key
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all"
                      type="password"
                      value={settings.paystack_secret_key}
                      onChange={(e) =>
                        setSettings({ ...settings, paystack_secret_key: e.target.value })
                      }
                      placeholder="sk_test_..."
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Public Access Key
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all"
                      type="text"
                      value={settings.paystack_public_key}
                      onChange={(e) =>
                        setSettings({ ...settings, paystack_public_key: e.target.value })
                      }
                      placeholder="pk_test_..."
                    />
                  </div>
                </div>
                <div className="mt-10 flex justify-end gap-3">
                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-8 py-3.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20 flex items-center gap-2"
                  >
                    {isSaving && (
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    )}
                    Save Credentials
                  </button>
                </div>
              </section>

              {/* OpenAI Integration */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">psychology</span>
                    Artificial Intelligence (OpenAI)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure API keys for AI-powered content generation and rewriting.
                  </p>
                </div>
                <div className="space-y-2.5 max-w-xl">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    OPENAI API KEY (CHATGPT)
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all pr-12"
                      type="password"
                      value={settings.openai_api_key}
                      onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                      placeholder="sk-proj-..."
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-8 py-3.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20 flex items-center gap-2"
                  >
                    {isSaving && (
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    )}
                    Save Credentials
                  </button>
                </div>
              </section>

              {/* Maps Integration */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">map</span>
                    Geospatial Discovery
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure map layers and location search parameters.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-2.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        GOOGLE PLACES API KEY
                      </label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:bg-white transition-all"
                        type="password"
                        value={settings.google_maps_key}
                        onChange={(e) =>
                          setSettings({ ...settings, google_maps_key: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-8 py-3.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20 flex items-center gap-2"
                  >
                    {isSaving && (
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    )}
                    Save Credentials
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === "SEO" && (
            <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Search Engine Optimization</h2>
              <p className="text-sm text-slate-500 mb-8">
                Manage how your platform appears in search engines.
              </p>
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Site Meta Title
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                    placeholder="ListIQ - Business Directory"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Meta Description
                  </label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-32"
                    placeholder="The #1 business directory in Ghana..."
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === "Notifications" && (
            <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">sms</span>
                  SMS Communications
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      mNotify API AUTH KEY
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:bg-white transition-all"
                      type="password"
                      value={settings.mnotify_api_key}
                      onChange={(e) =>
                        setSettings({ ...settings, mnotify_api_key: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      SENDER IDENTITY
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white transition-all"
                      type="text"
                      value={settings.mnotify_sender_id}
                      onChange={(e) =>
                        setSettings({ ...settings, mnotify_sender_id: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-8 py-3.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20 flex items-center gap-2"
                  >
                    Save SMS Settings
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Security" && (
            <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 text-rose-600">
                Platform Security
              </h2>
              <p className="text-sm text-slate-500 mb-8">
                Manage authentication protocols and system access.
              </p>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-rose-50 border border-rose-100 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-rose-900 leading-none mb-1.5">
                      Multi-Factor Authentication
                    </p>
                    <p className="text-xs text-rose-600">
                      Require MFA for all administrator accounts.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newState = !settings.mfa_enabled;
                      setSettings({ ...settings, mfa_enabled: newState });
                    }}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.mfa_enabled ? "bg-rose-600" : "bg-slate-200"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.mfa_enabled ? "left-7" : "left-1"}`}
                    ></div>
                  </button>
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <button
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-8 py-3.5 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-600/20 flex items-center gap-2"
                >
                  {isSaving && (
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  )}
                  Apply Security Updates
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info / Danger Zone */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          {/* Helper Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-600">help</span>
              KNOWLEDGE BASE
            </h3>
            <ul className="space-y-8">
              {[
                {
                  title: "API Compliance",
                  sub: "Guidelines for secure credential storage.",
                  icon: "verified_user",
                },
                {
                  title: "System Heartbeat",
                  sub: "Last successful sync: 2 minutes ago.",
                  icon: "monitor_heart",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-slate-100">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      {item.sub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Danger Zone */}
          <div className="bg-white border-2 border-rose-100 rounded-3xl p-8 shadow-xl shadow-rose-600/5">
            <div className="flex items-center gap-3 mb-6 text-rose-600">
              <span className="material-symbols-outlined font-bold">warning</span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                Security Protocol
              </h3>
            </div>
            <div className="space-y-6">
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Resetting configuration will disconnect all live APIs and clear session tokens. This
                action is irreversible.
              </p>
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-rose-300 uppercase tracking-widest">
                  VERIFICATION TOKEN
                </label>
                <input
                  className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-4 py-3 font-mono text-xs text-rose-600 placeholder:text-rose-200 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
                  placeholder="TYPE 'RESET' TO CONFIRM"
                  type="text"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                />
              </div>
              <button
                disabled={resetConfirm !== "RESET"}
                onClick={handleReset}
                className="w-full py-4 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-600/20 disabled:opacity-30 disabled:shadow-none"
              >
                Execute Factory Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

