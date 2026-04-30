import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadFile } from "../../lib/storage-helper";

interface AdminAddArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAddArticleModal({ isOpen, onClose, onSuccess }: AdminAddArticleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    status: "published",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('articles')
      .insert({
        ...formData,
        author_id: session?.user?.id || null,
        is_ai_generated: false
      });

    if (error) {
      alert("Error: " + error.message);
    } else {
      onSuccess();
      onClose();
      setFormData({
        title: "",
        content: "",
        image_url: "",
        status: "published",
      });
    }
    setIsSubmitting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `articles/${Math.random()}.${fileExt}`;
      const publicUrl = await uploadFile('articles', filePath, file);
      setFormData({ ...formData, image_url: publicUrl });
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Compose New Article</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Internal Content Engine</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Cover Image Upload */}
          <div className="relative h-48 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 transition-all">
            {formData.image_url ? (
              <>
                <img src={formData.image_url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Change Cover Image</span>
                </div>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">image</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Cover Image</p>
              </>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Article Title</label>
            <input
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-lg font-bold transition-all"
              placeholder="Enter a compelling title..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Publishing Status</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm font-bold transition-all"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
               <p className="text-[10px] text-slate-400 font-medium italic mb-2">Tip: Use Shift+Enter for new paragraphs in the editor below.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Article Content</label>
            <textarea
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none text-sm leading-relaxed font-medium transition-all min-h-[300px] resize-none"
              placeholder="Write your article content here..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Publishing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  {formData.status === 'published' ? 'Publish Article' : 'Save as Draft'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
