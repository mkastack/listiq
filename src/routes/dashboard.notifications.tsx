import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/dashboard/notifications")({
  component: Notifications,
});

function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data.map(n => ({
        id: n.id,
        type: n.type || "System",
        title: n.title,
        time: formatTime(n.created_at),
        text: n.message,
        unread: !n.is_read,
        color: getColor(n.type),
        icon: getIcon(n.type),
        actions: n.actions || [],
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const channel = supabase
        .channel('user-notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          const n = payload.new;
          setNotifications(prev => [{
            id: n.id,
            type: n.type || "System",
            title: n.title,
            time: "Just now",
            text: n.message,
            unread: !n.is_read,
            color: getColor(n.type),
            icon: getIcon(n.type),
            actions: n.actions || [],
          }, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'review': return 'emerald';
      case 'billing': return 'blue';
      case 'status': return 'amber';
      case 'danger': return 'red';
      default: return 'blue';
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'review': return 'rate_review';
      case 'billing': return 'payments';
      case 'status': return 'hourglass_empty';
      case 'danger': return 'report';
      default: return 'info';
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id);
    
    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-4xl mx-auto pb-24 space-y-8 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 font-body-base mt-1">Stay updated on your listings, reviews, and account activity.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">done_all</span>
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map((n) => (
          <div
            key={n.id}
            className={`group relative border-l-4 rounded-r-2xl shadow-sm hover:shadow-md transition-all p-5 flex gap-5 ${
              n.unread ? "bg-blue-50/50 border-blue-500" : "bg-white border-slate-100"
            } ${n.color === "emerald" ? "border-emerald-500" : n.color === "amber" ? "border-amber-500" : n.color === "red" ? "border-red-500" : "border-blue-500"}`}
          >
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                n.color === "emerald" ? "bg-emerald-100 text-emerald-600" : 
                n.color === "amber" ? "bg-amber-100 text-amber-600" : 
                n.color === "red" ? "bg-red-100 text-red-600" : 
                "bg-blue-100 text-blue-600"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {n.icon}
              </span>
            </div>
            <div className="flex-1 pr-8">
              <div className="flex justify-between items-start mb-1.5">
                <span className={`text-base font-bold ${n.color === "red" ? "text-red-700" : "text-slate-900"}`}>{n.title}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{n.time}</span>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                {n.text}
              </p>
              <div className="mt-4 flex items-center gap-3">
                {n.actions.map((action: string) => (
                  <button key={action} className="text-xs font-bold text-blue-600 hover:underline">
                    {action}
                  </button>
                ))}
                {n.unread && (
                  <>
                    <span className="text-slate-200 text-xs">•</span>
                    <button onClick={() => markAsRead(n.id)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                      Mark as read
                    </button>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteNotification(n.id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        )) : (
          <div className="bg-white rounded-2xl p-20 text-center border border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <span className="material-symbols-outlined text-[40px]">notifications_off</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No notifications</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {isLoading ? 'Checking for updates...' : "You're all caught up! No new notifications to display."}
              </p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-20 pt-10 border-t border-slate-100 flex flex-wrap gap-12 justify-center">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Received</p>
          <p className="text-3xl font-bold text-slate-900 font-display">{notifications.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Unread</p>
          <p className="text-3xl font-bold text-blue-600 font-display">{notifications.filter(n => n.unread).length}</p>
        </div>
      </div>
    </div>
  );
}
