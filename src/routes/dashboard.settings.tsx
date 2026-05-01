// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { uploadFile } from "../lib/storage-helper";

export const Route = createFileRoute("/dashboard/settings")({
  component: AccountSettings,
});

function AccountSettings() {
  const navigate = useNavigate();
  const [twoFactor, setTwoFactor] = useState(true);
  const [notifications, setNotifications] = useState({
    reviews: true,
    approvals: true,
    billing: false,
  });

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    bio: "",
    avatar_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        email: session.user.email || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
    }
    setIsSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

      const publicUrl = await uploadFile("avatars", filePath, file);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", session.user.id);

      if (!updateError) {
        setProfile({ ...profile, avatar_url: publicUrl });
        alert("Avatar updated!");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to permanently delete your account? This action cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Delete the user's profile - this might cascade or trigger an edge function depending on DB rules
      const { error } = await supabase.from("profiles").delete().eq("id", session.user.id);
      if (error) throw error;

      await supabase.auth.signOut();
      alert("Your account has been permanently deleted.");
      navigate({ to: "/" });
    } catch (error: any) {
      alert("Failed to delete account: " + error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 space-y-8 overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 font-body-base mt-1">
          Manage your profile information, security preferences, and notification settings.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Settings */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
            <div className="p-8">
              {/* Avatar Upload Section */}
              <div className="flex items-center gap-8 mb-10">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border-4 border-slate-50 shadow-sm overflow-hidden flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        alt="Profile"
                        className="w-full h-full object-cover"
                        src={profile.avatar_url}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-4xl">
                        person
                      </span>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:scale-110 transition-all">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">
                      edit
                    </span>
                    <input
                      className="hidden"
                      type="file"
                      onChange={handleAvatarChange}
                      accept="image/*"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Profile Photo</h3>
                  <p className="text-[13px] text-slate-500 mt-1">
                    PNG, JPG or GIF. Max size of 1MB.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-blue-600 text-sm font-bold hover:underline cursor-pointer">
                      Upload new
                      <input
                        className="hidden"
                        type="file"
                        onChange={handleAvatarChange}
                        accept="image/*"
                      />
                    </label>
                    <span className="text-slate-300">•</span>
                    <button className="text-red-500 text-sm font-bold hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                    Full Name
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all"
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-medium cursor-not-allowed"
                    readOnly
                    type="email"
                    value={profile.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                    Phone Number
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+233..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                    WhatsApp Contact
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all"
                    type="tel"
                    value={profile.whatsapp}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    placeholder="+233..."
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                    Professional Bio
                  </label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all resize-none"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-right text-[11px] text-slate-400 font-medium italic">
                    {profile.bio.length}/500 characters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stacked Security/Notifications/Danger */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          {/* Security Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-blue-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  security
                </span>
                Security
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Password</p>
                  <p className="text-[13px] text-slate-500">Manage your password settings</p>
                </div>
                <button className="px-5 py-2 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                  Update
                </button>
              </div>
              <div className="h-[1px] bg-slate-50 w-full"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Two-Factor Auth</p>
                  <p className="text-[13px] text-slate-500">Add an extra layer of security</p>
                </div>
                <button
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${twoFactor ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${twoFactor ? "translate-x-6" : "translate-x-1"}`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-blue-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  notifications_active
                </span>
                Notifications
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <label className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Listing Reviews
                  </p>
                  <p className="text-[13px] text-slate-500">
                    Get notified when someone reviews your listing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.reviews}
                  onChange={(e) =>
                    setNotifications({ ...notifications, reviews: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-600/20 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Approvals
                  </p>
                  <p className="text-[13px] text-slate-500">
                    Alerts when your submissions are approved
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.approvals}
                  onChange={(e) =>
                    setNotifications({ ...notifications, approvals: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-600/20 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Billing Reports
                  </p>
                  <p className="text-[13px] text-slate-500">
                    Monthly invoice summaries and payment alerts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.billing}
                  onChange={(e) =>
                    setNotifications({ ...notifications, billing: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-600/20 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-red-50/50 rounded-2xl border border-red-100 overflow-hidden">
            <div className="p-6 bg-red-100/30 border-b border-red-100">
              <h2 className="text-lg font-bold text-red-700 flex items-center gap-3">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warning
                </span>{" "}
                Danger Zone
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-6 font-medium">
                Permanently delete your account and all associated data. This action is
                irreversible.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

