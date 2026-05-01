// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { generateArticleAI } from "../lib/openai";
import { AdminAddArticleModal } from "../components/admin/AdminAddArticleModal";

export const Route = createFileRoute("/admin/articles")({
  component: AdminArticles,
});

function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [fetchJobs, setFetchJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    aiGenerated: 0,
  });

  const fetchContent = async () => {
    setIsLoading(true);

    // Fetch Articles
    let query = supabase.from("articles").select("*").order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    if (statusFilter !== "All Status") {
      query = query.eq("status", statusFilter.toLowerCase());
    }

    const { data: articlesData } = await query;
    if (articlesData) setArticles(articlesData);

    // Fetch Fetch Jobs
    const { data: jobsData } = await supabase
      .from("fetch_jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (jobsData) setFetchJobs(jobsData);

    // Stats
    const [{ count: pubCount }, { count: draftCount }, { count: aiCount }] = await Promise.all([
      supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("is_ai_generated", true),
    ]);

    setStats({
      published: pubCount || 0,
      drafts: draftCount || 0,
      aiGenerated: aiCount || 0,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    fetchContent();
    const channel = supabase
      .channel("admin-articles-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, fetchContent)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Permanently delete this article?")) {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) alert(error.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("articles").update({ status }).eq("id", id);
    if (error) alert(error.message);
  };

  const triggerFetch = async () => {
    // In a real scenario, this might trigger an edge function
    alert("Triggering RSS Fetch Sync...");
  };

  const handleAIGenerate = async () => {
    const prompt = window.prompt("Enter a topic for the AI to generate an article about:");
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const result = await generateArticleAI(prompt);

      const { error } = await supabase.from("articles").insert({
        title: result.title,
        content: result.content,
        status: "draft",
        is_ai_generated: true,
        author_id: (await supabase.auth.getSession()).data.session?.user.id,
      });

      if (error) throw error;
      alert("AI Article generated and saved as draft!");
      fetchContent();
    } catch (error: any) {
      alert("Error generating article: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Dashboard
            </span>
            <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
              Content Engine
            </span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Articles & News</h1>
          <p className="text-sm text-slate-500 font-medium">
            Moderate platform content and manage automated news feeds
          </p>
        </div>
        <div className="bg-white px-5 py-4 border border-slate-200 rounded-2xl flex items-center gap-8 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              PUBLISHED
            </span>
            <span className="text-xl font-bold text-slate-900">
              {isLoading ? "..." : stats.published.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              DRAFTS
            </span>
            <span className="text-xl font-bold text-slate-900">
              {isLoading ? "..." : stats.drafts.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              AI AGENT
            </span>
            <span className="text-xl font-bold text-blue-600">
              {isLoading ? "..." : stats.aiGenerated.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all"
              placeholder="Search articles by title..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-widest bg-slate-50 text-slate-600 outline-none focus:border-blue-600 cursor-pointer transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerFetch}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Fetch Sync
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Compose
          </button>
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20 group disabled:opacity-70"
          >
            {isGenerating ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">
                colors_spark
              </span>
            )}
            {isGenerating ? "Generating..." : "AI Generate"}
          </button>
        </div>
      </div>

      {/* Auto-fetch Config Panel */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200 shadow-sm">
              <span className="material-symbols-outlined">rss_feed</span>
            </div>
            <h2 className="text-lg font-bold text-emerald-900">Automation Hub</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-emerald-700 font-black uppercase tracking-[0.2em]">
              AUTOPILOT MODE
            </span>
            <button className="w-10 h-5 bg-emerald-500 rounded-full relative shadow-inner">
              <span className="absolute right-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-sm"></span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <label className="text-[9px] font-black text-emerald-800 mb-2 block uppercase tracking-[0.2em]">
              CONFIGURED FEEDS
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-white border border-emerald-100 rounded-xl min-h-[44px] shadow-sm">
              {fetchJobs.length > 0 ? (
                fetchJobs.map((job) => (
                  <span
                    key={job.id}
                    className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-2 border border-emerald-100 font-black uppercase tracking-wider"
                  >
                    {job.source_url.replace("https://", "")}
                    <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-rose-500 transition-colors">
                      close
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-emerald-300 text-[10px] p-2 font-bold uppercase">
                  No feeds configured
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-emerald-800 mb-2 block uppercase tracking-[0.2em]">
              SCAN FREQUENCY
            </label>
            <select className="w-full bg-white border border-emerald-100 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-emerald-500/10">
              <option>Every 30 Minutes</option>
              <option>Every Hour</option>
              <option>Daily Batch</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-emerald-800 mb-2 block uppercase tracking-[0.2em]">
              AI REWRITE LEVEL
            </label>
            <select className="w-full bg-white border border-emerald-100 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-emerald-500/10">
              <option>Full Translation</option>
              <option>Summarize Only</option>
              <option>No AI Change</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  CONTENT PREVIEW
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  SOURCE / AUTHOR
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  TYPE
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  STATUS
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  ENGAGEMENT
                </th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className={`hover:bg-slate-50/50 transition-colors ${article.status === "draft" ? "border-l-4 border-l-amber-400" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {article.image_url ? (
                        <img
                          className="w-16 h-10 object-cover rounded-lg border border-slate-200 shadow-sm"
                          src={article.image_url}
                          alt="Article Cover"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 line-clamp-1 text-sm">
                          {article.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase shadow-sm ${article.is_ai_generated ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"}`}
                      >
                        {article.is_ai_generated ? "AI" : "US"}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {article.is_ai_generated ? "Auto Agent" : "Platform Staff"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        article.is_ai_generated
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {article.is_ai_generated ? "AI SYNTHETIC" : "MANUAL ENTRY"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${article.status === "published" ? "bg-emerald-500" : "bg-amber-500"}`}
                      ></span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${article.status === "published" ? "text-emerald-700" : "text-amber-700"}`}
                      >
                        {article.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-slate-700 font-black">
                        {article.views_count?.toLocaleString() || 0}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Reads</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {article.status === "draft" && (
                        <button
                          onClick={() => handleUpdateStatus(article.id, "published")}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Publish Now"
                        >
                          <span className="material-symbols-outlined text-xl">publish</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                        title="Delete Content"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-slate-400 italic font-medium uppercase tracking-widest text-[10px]"
                  >
                    No news entries found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Add Article Modal */}
      <AdminAddArticleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchContent}
      />

      {/* Contextual FAB */}
      <div className="fixed bottom-10 right-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-transform">
            add
          </span>
        </button>
      </div>
    </main>
  );
}

