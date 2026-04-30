import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPlan,
});

function BillingPlan() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState({
    name: "Free",
    price: "0",
    is_active: true,
    renewal_date: "N/A"
  });
  const [usage, setUsage] = useState({
    listings: { used: 0, total: 5 },
    images: { used: 0, total: 100 },
    ai: { used: 0, total: 10 }
  });

  const fetchBillingData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Fetch payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (payments) {
      setHistory(payments.map(p => ({
        id: p.id.substring(0, 8).toUpperCase(),
        date: new Date(p.created_at).toLocaleDateString(),
        desc: "Pro Plan - Monthly Subscription",
        amount: `GHS ${p.amount.toFixed(2)}`,
        status: p.status === 'success' ? 'Paid' : 'Failed'
      })));
    }

    // Fetch profile for plan info
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, subscription_renewal')
      .eq('id', session.user.id)
      .single();

    // Fetch Usage Stats
    const [
      { count: listingsUsed },
      { data: listingsData },
      { count: aiUsed }
    ] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('owner_id', session.user.id),
      supabase.from('listings').select('gallery_images').eq('owner_id', session.user.id),
      supabase.from('ai_usage').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
    ]);

    const imagesCount = listingsData?.reduce((acc, curr) => acc + (curr.gallery_images?.length || 0), 0) || 0;

      if (profile) {
        const rawPlan = profile.subscription_plan || "Free";
        // Normalize plan name to title case for UI matching
        const planName = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1).toLowerCase();
        
        const planLimits: any = {
          "Free": { listings: 5, images: 100, ai: 10 },
          "Starter": { listings: 100, images: 1000, ai: 100 },
          "Pro": { listings: 1000, images: 5000, ai: 500 },
          "Ultra": { listings: 10000, images: 20000, ai: 2000 },
          "Enterprise": { listings: 10000, images: 20000, ai: 2000 }
        };
      
      const limits = planLimits[planName] || planLimits["Free"];

      setUserPlan({
        name: planName,
        price: planName === "Ultra" ? "500" : planName === "Pro" ? "150" : planName === "Starter" ? "50" : "0",
        is_active: profile.subscription_status === 'active',
        renewal_date: profile.subscription_renewal ? new Date(profile.subscription_renewal).toLocaleDateString() : "N/A"
      });

      setUsage({
        listings: { used: listingsUsed || 0, total: limits.listings },
        images: { used: imagesCount, total: limits.images },
        ai: { used: aiUsed || 0, total: limits.ai }
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchBillingData();

    // REAL-TIME UPDATES FOR PLAN STATUS
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const profileSub = supabase.channel(`billing-profile-${session.user.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${session.user.id}` 
        }, () => {
          fetchBillingData();
        })
        .subscribe();

      const paymentsSub = supabase.channel(`billing-payments-${session.user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments', 
          filter: `user_id=eq.${session.user.id}` 
        }, () => {
          fetchBillingData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(profileSub);
        supabase.removeChannel(paymentsSub);
      };
    };

    const cleanup = setupRealtime();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  const scrollToPlans = () => {
    document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadInvoice = (id: string) => {
    setDownloading(id);
    setTimeout(() => {
      alert(`Invoice ${id} downloaded successfully.`);
      setDownloading(null);
    }, 1500);
  };

  const handlePayment = async (planName: string, amount: number) => {
    console.log("Initializing payment for:", planName, amount);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert("Please log in to continue with the payment.");
      return;
    }

    // Ensure Paystack is loaded
    if (!(window as any).PaystackPop) {
      console.log("Paystack script not found, loading dynamically...");
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://js.paystack.co/v1/inline.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const paystack = (window as any).PaystackPop;
    if (!paystack) {
      alert("Payment system failed to initialize. Please check your internet connection.");
      return;
    }

    // Fetch Public Key from settings
    const { data: settings } = await supabase.from('settings').select('paystack_public_key').maybeSingle();
    const paystackKey = settings?.paystack_public_key || "pk_test_62a882da2b5348732a1220f494288036431bc140";

    if (!paystackKey) {
      alert("Payment system is currently being configured. Please try again later.");
      return;
    }

    const handler = paystack.setup({
      key: paystackKey,
      email: session.user.email,
      amount: amount * 100, // Paystack takes amount in kobo/pesewas
      currency: "GHS",
      callback: async (response: any) => {
        // Record payment in database
        const { error } = await supabase.from('payments').insert({
          user_id: session.user.id,
          amount: amount,
          status: 'success',
          reference: response.reference,
          metadata: { plan: planName }
        });

        if (error) {
          console.error("Database error recording payment:", error);
          // If the payments table doesn't exist, we should still try to upgrade the profile manually
          await supabase.from('profiles').update({
            subscription_plan: planName.toLowerCase(),
            subscription_status: 'active',
            subscription_renewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }).eq('id', session.user.id);
        }

        alert(`Payment successful! Your account has been upgraded to ${planName}.`);
        fetchBillingData();
      },
      onClose: () => {
        alert("Transaction cancelled.");
      }
    });
    handler.openIframe();
  };

  const plans = [
    {
      name: "Free",
      price: "0",
      desc: "For individuals starting out",
      features: ["5 Listings", "Basic AI Tools"],
      active: userPlan.name === "Free",
    },
    {
      name: "Starter",
      price: "50",
      desc: "Essential for small teams",
      features: ["100 Listings", "Enhanced AI", "Email Support"],
      active: userPlan.name === "Starter",
    },
    {
      name: "Pro",
      price: "150",
      desc: "Power users & medium business",
      features: ["1,000 Listings", "Priority AI Access", "Advanced Analytics"],
      active: userPlan.name === "Pro",
    },
    {
      name: "Ultra",
      price: "500",
      desc: "Large scale organizations",
      features: ["Unlimited Listings", "Custom Integrations", "Account Manager"],
      active: userPlan.name === "Ultra" || userPlan.name === "Enterprise",
    },
  ];

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 space-y-8 overflow-hidden">
      {/* Page Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-bold font-display text-slate-900">Billing & Plan</h1>
        <p className="text-sm text-slate-500 font-body-base">Manage your subscription and payment history</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group transition-all duration-500">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                  {userPlan.is_active ? 'Active Subscription' : 'Inactive Subscription'}
                </span>
                <h2 className="text-3xl font-bold font-display mt-4">{userPlan.name} Plan</h2>
                <p className="text-blue-100 text-sm mt-1">Renewal Date: {userPlan.renewal_date}</p>
              </div>
              <div className="md:text-right">
                <p className="text-4xl font-bold font-display leading-tight">GHS {userPlan.price}</p>
                <p className="text-blue-100 text-sm">per month</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-10">
              {["Unlimited basic listings", "Priority AI processing", "Advanced analytics", "Dedicated support"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-200">check_circle</span>
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-auto">
              <button 
                onClick={scrollToPlans}
                className="px-6 py-2.5 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all active:scale-95 text-sm shadow-md shadow-black/5"
              >
                Manage Plan
              </button>
              <button 
                onClick={() => window.open('https://paystack.com', '_blank')}
                className="px-6 py-2.5 bg-blue-400/20 text-white font-bold rounded-lg border border-white/20 hover:bg-white/10 transition-all active:scale-95 text-sm backdrop-blur-sm"
              >
                Payment Methods
              </button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-[120px]">payments</span>
          </div>
        </div>

        {/* Usage Meters */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">bar_chart</span>
            Current Usage
          </h3>
          <div className="space-y-8 flex-1">
            {[
              { label: "Listings", used: usage.listings.used, total: usage.listings.total, color: "bg-blue-600" },
              { label: "Images", used: usage.images.used, total: usage.images.total, color: "bg-blue-600" },
              { label: "AI Generations", used: usage.ai.used, total: usage.ai.total, color: "bg-amber-500", warning: usage.ai.used / usage.ai.total > 0.8 },
            ].map((meter) => (
              <div key={meter.label}>
                <div className="flex justify-between text-sm mb-2.5">
                  <span className="font-bold text-slate-700">{meter.label}</span>
                  <span className="text-slate-500 font-medium">
                    {meter.used.toLocaleString()} / {meter.total.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div
                    className={`h-full ${meter.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${(meter.used / meter.total) * 100}%` }}
                  ></div>
                </div>
                {meter.warning && (
                  <p className="text-[11px] text-amber-600 mt-2.5 flex items-center gap-1.5 font-bold animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Approaching monthly limit
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Comparison Section */}
      <div id="plans-section" className="pt-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Change Your Plan</h2>
          <p className="text-slate-500 text-sm">Choose the best fit for your business growth</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`bg-white border-2 rounded-2xl p-6 flex flex-col transition-all group hover:shadow-lg ${
                p.active ? "border-blue-600 shadow-xl shadow-blue-600/10 scale-105 relative z-10" : "border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              {p.active && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Current
                </div>
              )}
              <h4 className="text-lg font-bold text-slate-900">{p.name}</h4>
              <div className="flex items-baseline gap-1 mt-3">
                <p className={`text-3xl font-bold ${p.active ? "text-blue-600" : "text-slate-900"}`}>
                  {p.price === "Custom" ? "Custom" : `GHS ${p.price}`}
                </p>
                {p.price !== "Custom" && <span className="text-sm font-medium text-slate-500">/mo</span>}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">{p.desc}</p>

              <ul className="mt-8 space-y-4 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <span className={`material-symbols-outlined text-[18px] ${p.active ? "text-blue-600" : "text-slate-400"}`}>check</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={p.active}
                onClick={() => {
                  if (p.name !== "Free") {
                    const priceNum = p.price === "Custom" ? 0 : Number(p.price);
                    if (priceNum > 0) {
                      handlePayment(p.name, priceNum);
                    }
                  }
                }}
                className={`mt-10 w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  p.active
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20"
                }`}
              >
                {p.active ? "Active Now" : p.name === "Free" ? "Current Plan" : "Switch Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Invoice ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.length > 0 ? history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{h.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{h.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{h.desc}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{h.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${h.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(h.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {downloading === h.id ? "downloading" : "file_download"}
                      </span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    {isLoading ? 'Loading payment history...' : 'No payments recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
