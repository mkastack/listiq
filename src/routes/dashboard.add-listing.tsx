import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { uploadFile } from "../lib/storage-helper";

export const Route = createFileRoute("/dashboard/add-listing")({
  component: AddListing,
});

function AddListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    subcategory: "",
    keywords: ["Roastery", "Specialty"],
    shortDesc: "",
    fullDesc: "",
    address: "",
    city: "",
    region: "",
    zipCode: "",
    logo_url: "",
    customCategory: "",
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleAutoFill = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        businessName: formData.businessName || "Artisan Coffee Co.",
        category: "Hospitality",
        subcategory: "Cafe & Bakery",
        shortDesc: "Experience the finest hand-roasted beans in the heart of the city.",
        fullDesc: "Welcome to Artisan Coffee Co., where tradition meets taste. Our master roasters select only the finest ethically sourced beans from across the globe. Each batch is small-roasted to perfection to ensure you receive the richest flavor profile possible. Whether you are a fan of a bold dark roast or a citrusy light roast, we have something special waiting for you.",
        address: "123 High Street, Osu",
        city: "Accra",
        region: "Greater Accra",
      });
      setIsGenerating(false);
    }, 2000);
  };

  const removeKeyword = (tag: string) => {
    setFormData({ ...formData, keywords: formData.keywords.filter(k => k !== tag) });
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert("You must be logged in to add a listing.");
      setIsSubmitting(false);
      return;
    }

    // CHECK PLAN LIMITS
    const { data: profile } = await supabase.from('profiles').select('subscription_plan').eq('id', session.user.id).single();
    const { count: currentListings } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('owner_id', session.user.id);

    const planLimits: any = {
      "Free": 5,
      "Starter": 100,
      "Pro": 1000,
      "Ultra": 10000,
      "Enterprise": 10000
    };

    // Normalize plan name for limit lookup
    const rawPlan = profile?.subscription_plan || "Free";
    const currentPlan = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1).toLowerCase();
    const limit = planLimits[currentPlan] || 5;

    if ((currentListings || 0) >= limit) {
      alert(`Limit Reached: Your ${currentPlan} plan only allows up to ${limit} listings. Please upgrade your plan in the Billing section to add more.`);
      setIsSubmitting(false);
      return;
    }

    const { customCategory, ...submitData } = formData;
    const slug = formData.businessName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    const { data, error } = await supabase
      .from('listings')
      .insert({
        name: formData.businessName,
        category: formData.category === "Other" ? formData.customCategory : formData.category,
        short_description: formData.shortDesc,
        description: formData.fullDesc,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        logo_url: formData.logo_url,
        owner_id: session.user.id,
        status: 'pending',
        slug: slug
      })
      .select()
      .single();

    if (error) {
      alert("Error creating listing: " + error.message);
    } else {
      alert("Listing submitted for review!");
      navigate({ to: '/dashboard/listings' });
    }
    setIsSubmitting(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/listings/${Math.random()}.${fileExt}`;

      const publicUrl = await uploadFile('listings', filePath, file);
      setFormData({ ...formData, logo_url: publicUrl });
      alert("Logo uploaded!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full pb-24 overflow-hidden max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-bold font-display text-slate-900 mb-1">Add New Listing</h1>
        <p className="text-sm text-slate-500 font-body-base">Fill in your business details to get listed</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Progress Stepper */}
        <div className="col-span-12 lg:col-span-3">
          <div className="flex lg:flex-col lg:sticky lg:top-24 gap-4 lg:gap-6 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
            {[
              { id: 1, label: "Basic Info", status: step === 1 ? "Current Step" : step > 1 ? "Completed" : "Pending" },
              { id: 2, label: "Location", status: step === 2 ? "Current Step" : step > 2 ? "Completed" : "Pending" },
              { id: 3, label: "Media", status: step === 3 ? "Current Step" : step > 3 ? "Completed" : "Pending" },
              { id: 4, label: "Preview", status: step === 4 ? "Current Step" : "Pending" },
            ].map((s) => (
              <div key={s.id} className={`flex items-center gap-4 shrink-0 lg:shrink ${s.status === "Pending" ? "opacity-40" : ""}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shrink-0 ${
                    s.status === "Current Step"
                      ? "bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.1)] scale-110"
                      : s.status === "Completed"
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.status === "Completed" ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    s.id
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-bold whitespace-nowrap ${s.status === "Current Step" ? "text-blue-600" : "text-slate-700"}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form Content */}
        <div className="col-span-12 lg:col-span-9 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {step === 1 && (
            <>
              {/* AI Section */}
              <div className="bg-gradient-to-br from-blue-600/5 to-transparent border-2 border-dashed border-blue-600/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-6">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0 ${isGenerating ? 'animate-pulse' : ''}`}>
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        auto_awesome
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Generate with AI</h3>
                      <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                        Let our AI draft your listing description and select the best keywords based on your business name.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className="bg-white/80 p-1 rounded-lg border border-slate-200 flex items-center">
                      <button className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-md shadow-sm">GPT-4o</button>
                      <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800">Gemini</button>
                    </div>
                    <button 
                      onClick={handleAutoFill}
                      disabled={isGenerating}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${isGenerating ? 'animate-spin' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isGenerating ? 'sync' : 'colors_spark'}
                      </span>
                      {isGenerating ? 'Generating...' : 'Auto-Fill Content'}
                    </button>
                  </div>
                </div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
              </div>

              {/* Form Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900">General Information</h2>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">BUSINESS NAME</label>
                      <input
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                        placeholder="e.g. Modern Coffee Roasters"
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">CATEGORY</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm cursor-pointer"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          unfold_more
                        </span>
                      </div>
                      
                      {formData.category === "Other" && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-2">PREFERRED CATEGORY</label>
                          <input
                            required
                            className="w-full bg-blue-50/30 border border-blue-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                            placeholder="Type your custom category..."
                            value={formData.customCategory}
                            onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">SUBCATEGORY</label>
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm cursor-pointer"
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        >
                          <option value="">Select Subcategory</option>
                          <option>Software</option>
                          <option>Cafe & Bakery</option>
                          <option>Hardware</option>
                          <option>E-commerce</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          unfold_more
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">KEYWORDS</label>
                      <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all min-h-[42px]">
                        {formData.keywords.map(tag => (
                          <span key={tag} className="bg-blue-600/10 text-blue-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            {tag} <span className="material-symbols-outlined text-[14px] cursor-pointer" onClick={() => removeKeyword(tag)}>close</span>
                          </span>
                        ))}
                        <input 
                          className="border-none focus:ring-0 p-0 px-2 text-sm flex-1 min-w-[100px] outline-none" 
                          placeholder="Add tag..." 
                          type="text" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value) {
                                setFormData({ ...formData, keywords: [...formData.keywords, target.value] });
                                target.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">SHORT DESCRIPTION</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                      placeholder="A brief one-sentence hook for your business"
                      type="text"
                      value={formData.shortDesc}
                      onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">FULL DESCRIPTION</label>
                    <textarea
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 resize-none outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                      placeholder="Tell your business's story in detail..."
                      rows={6}
                      value={formData.fullDesc}
                      onChange={(e) => setFormData({ ...formData, fullDesc: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Business Location</h2>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">BUSINESS ADDRESS</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                      <input
                        className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                        placeholder="Start typing your address..."
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">CITY / TOWN</label>
                      <input
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                        placeholder="e.g. Accra"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">REGION / STATE</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm cursor-pointer appearance-none"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      >
                        <option value="">Select Region</option>
                        <option>Greater Accra</option>
                        <option>Ashanti</option>
                        <option>Central</option>
                        <option>Eastern</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900">Business Media</h2>
                </div>
                <div className="p-8 space-y-8">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-12 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer relative group">
                    {formData.logo_url ? (
                      <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg mb-4">
                        <img src={formData.logo_url} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-all">
                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-slate-900 mb-1">Business Logo</h3>
                    <p className="text-xs text-slate-500">Click to upload or drag and drop. PNG or JPG (Max 2MB)</p>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="h-48 bg-slate-100 relative">
                  <div className="absolute -bottom-12 left-10 w-32 h-32 rounded-3xl bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-5xl">store</span>
                    )}
                  </div>
                </div>
                <div className="pt-16 pb-10 px-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">{formData.businessName || 'Business Name'}</h2>
                      <p className="text-blue-600 font-bold mt-1 uppercase tracking-widest text-xs">{formData.category || 'Category'}</p>
                      <div className="flex items-center gap-2 text-slate-500 mt-4">
                        <span className="material-symbols-outlined text-lg">location_on</span>
                        <span className="text-sm font-medium">{formData.address}, {formData.city}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full md:w-64">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Short Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {formData.shortDesc || 'No description provided yet.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-10 border-t border-slate-100 pt-8">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">About Us</h4>
                    <p className="text-slate-600 text-sm leading-loose whitespace-pre-wrap">
                      {formData.fullDesc || 'Detailed description will appear here.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200 gap-4 sm:gap-0">
            <button 
              onClick={() => alert("Draft saved successfully!")}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
            >
              Save as Draft
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {step > 1 && (
                <button 
                  onClick={handlePrev}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Back
                </button>
              )}
              <button 
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : step === 4 ? 'Finish' : 'Next Step'}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
