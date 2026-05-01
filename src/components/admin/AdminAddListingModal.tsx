import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { uploadFile } from "../../lib/storage-helper";

interface AdminAddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAddListingModal({ isOpen, onClose, onSuccess }: AdminAddListingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    customCategory: "",
    short_description: "",
    description: "",
    address: "",
    city: "",
    region: "",
    logo_url: "",
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    }
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Clean formData to remove UI-only fields before submission
    const { customCategory, ...insertData } = formData;

    const { error } = await supabase.from("listings").insert({
      ...insertData,
      category: formData.category === "Other" ? formData.customCategory : formData.category,
      owner_id: session?.user?.id || null,
      status: "active",
      slug:
        formData.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "") +
        "-" +
        Math.random().toString(36).substring(2, 7),
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      onSuccess();
      onClose();
      setFormData({
        name: "",
        category: "",
        short_description: "",
        description: "",
        address: "",
        city: "",
        region: "",
        logo_url: "",
      });
    }
    setIsSubmitting(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `admin/listings/${Math.random()}.${fileExt}`;
      const publicUrl = await uploadFile("listings", filePath, file);
      setFormData({ ...formData, logo_url: publicUrl });
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Directory Listing</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
              Internal Admin Tool
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Business Logo Upload */}
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {formData.logo_url ? (
                <img src={formData.logo_url} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-slate-300 text-3xl">store</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Business Logo</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Upload a high-quality logo for the listing.
              </p>
              <label className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors inline-block">
                Choose File
                <input
                  type="file"
                  className="hidden"
                  onChange={handleLogoUpload}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Business Name
              </label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
                placeholder="e.g. Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Category
                </label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category === "Other" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-2">
                    Specify Preferred Category
                  </label>
                  <input
                    required
                    className="w-full bg-blue-50/30 border border-blue-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
                    placeholder="Enter your custom category..."
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Short Catchphrase
            </label>
            <input
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
              placeholder="A brief one-sentence hook"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Detailed Description
            </label>
            <textarea
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all min-h-[120px] resize-none"
              placeholder="Tell the full story..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Physical Address
            </label>
            <input
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
              placeholder="e.g. 123 Business Way, Suite 400"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                City
              </label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
                placeholder="Accra"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Region
              </label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-medium transition-all"
                placeholder="Greater Accra"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add_task</span>
                  Create Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
