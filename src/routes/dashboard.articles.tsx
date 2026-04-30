import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/dashboard/articles")({
  component: MyArticles,
});

function MyArticles() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [tone, setTone] = useState("Professional");
  const [wordCount, setWordCount] = useState("1,000");
  const [engine, setEngine] = useState("GPT-4o");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [articles, setArticles] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [topic, setTopic] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");

  const fetchArticles = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Fetch user's articles
    const { data: articlesData } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false });

    if (articlesData) setArticles(articlesData);

    // Fetch user's listings for the generator
    let listingsQuery = supabase.from('listings').select('id, name');
    
    // If admin, show all listings. Otherwise only owned ones.
    if (session.user.email !== 'mkastack373@gmail.com') {
      listingsQuery = listingsQuery.eq('owner_id', session.user.id);
    }
    
    const { data: listingsData, error: listingsError } = await listingsQuery;
    
    if (listingsError) {
      console.error("Error fetching listings for articles:", listingsError);
    }
    
    console.log("Fetched listings for articles:", listingsData?.length);
    if (listingsData) setUserListings(listingsData);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleGenerateArticle = async () => {
    if (!topic) {
      alert("Please enter an article topic.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const { generateArticleAI } = await import("../lib/openai");
      const prompt = `Write a ${tone} article about ${topic}. The article should be approximately ${wordCount} words. Target engine: ${engine}.`;
      
      const content = await generateArticleAI(prompt);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No session found");

      const { data, error } = await supabase.from('articles').insert({
        title: content.title,
        body: content.content,
        author_id: session.user.id,
        listing_id: selectedListingId || null,
        status: 'Draft',
        is_ai_generated: true,
        excerpt: content.content.substring(0, 150) + "..."
      }).select().single();

      if (error) throw error;

      alert("Article generated successfully!");
      setArticles([data, ...articles]);
      setTopic("");
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate article: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) {
      setArticles(articles.filter(a => a.id !== id));
      setActiveDropdown(null);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredArticles = articles.filter(a => {
    if (activeFilter === "All") return true;
    return a.status === activeFilter;
  });

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 space-y-8 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">My Articles</h2>
          <p className="text-sm text-slate-500 font-body-base mt-1">Write and manage your business articles</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => document.getElementById('ai-panel')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 border-2 border-purple-200 text-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            Generate with AI
          </button>
          <Link 
            to="/dashboard/add-listing"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            Write New Article
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {["All", "Published", "Draft", "Archived"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeFilter === f ? "bg-white shadow-sm text-blue-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* AI Generator Panel */}
      <div id="ai-panel" className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {isGenerating && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-purple-700 font-bold animate-pulse text-sm">AI is writing your article...</p>
          </div>
        )}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Article Generator</h3>
            <p className="text-xs text-slate-500 font-medium">Instantly create SEO-optimized articles for your listings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2.5">Article Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all placeholder:text-slate-400"
                placeholder="e.g. Benefits of living in Kumasi..."
                type="text"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2.5">Related Listing</label>
              <select 
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">{userListings.length === 0 ? "No listings found. Create one first." : "Select a listing..."}</option>
                {userListings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {userListings.length === 0 && (
                <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  You need a listing to generate a related article.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3">Tone</label>
              <div className="flex flex-wrap gap-2">
                {["Professional", "Casual", "Storytelling"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
                      tone === t ? "bg-purple-600 text-white border-purple-600" : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3">Word Count</label>
              <div className="flex gap-2">
                {["500", "1,000", "1,500+"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWordCount(w)}
                    className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
                      wordCount === w ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3">AI Engine</label>
              <div className="flex bg-slate-100 p-1.5 rounded-xl">
                {["GPT-4o", "Gemini"].map((e) => (
                  <button
                    key={e}
                    onClick={() => setEngine(e)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      engine === e ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={handleGenerateArticle}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-600/20 active:scale-95 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              {isGenerating ? "Generating..." : "Generate Article"}
            </button>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Title</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">AI Generated</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Views</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Published Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredArticles.length > 0 ? filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                        {article.image_url ? (
                          <img src={article.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{article.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      article.status === "Published" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      article.status === "Draft" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-slate-50 text-slate-600 border-slate-100"
                    }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      {article.is_ai_generated && (
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-medium">{article.views || 0} views</td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-medium">{article.published_at ? new Date(article.published_at).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-5 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === article.id ? null : article.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    
                    {activeDropdown === article.id && (
                      <div ref={dropdownRef} className="absolute right-6 top-14 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-left">
                          <span className="material-symbols-outlined text-[18px]">visibility</span> View Article
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-left">
                          <span className="material-symbols-outlined text-[18px]">edit</span> Edit Content
                        </button>
                        <div className="h-[1px] bg-slate-50 my-1 mx-2"></div>
                        <button 
                          onClick={() => handleDeleteArticle(article.id)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span> Delete Permanently
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <span className="material-symbols-outlined text-[40px]">article</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No articles found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {isLoading ? 'Fetching your latest articles...' : "You haven't written any articles yet. Start by generating one with AI or writing a new post!"}
                    </p>
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
