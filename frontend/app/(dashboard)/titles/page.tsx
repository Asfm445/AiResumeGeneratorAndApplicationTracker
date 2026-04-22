"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trophy, Trash2, Pencil, Star, X, Save, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useToastStore } from "@/lib/store";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Title {
  id: string;
  name: string;
  description: string;
  priority: number;
}

export default function TitlesPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [titleToDelete, setTitleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: 1,
  });

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/profile/titles");
      setTitles(response.data);
    } catch (err) {
      console.error("Failed to fetch titles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/api/v1/profile/titles/${editingId}`, formData);
      } else {
        await api.post("/api/v1/profile/titles", formData);
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: "", description: "", priority: 1 });
      fetchTitles();
    } catch (err) {
      addToast("Failed to save title", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setTitleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!titleToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/profile/titles/${titleToDelete}`);
      fetchTitles();
      addToast("Title deleted successfully", "success");
    } catch (err) {
      addToast("Failed to delete title", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setTitleToDelete(null);
    }
  };

  const startEdit = (title: Title) => {
    setEditingId(title.id);
    setFormData({
      name: title.name,
      description: title.description || "",
      priority: title.priority,
    });
    setIsAdding(true);
  };

  if (loading && titles.length === 0) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-muted-foreground animate-pulse">Loading your target titles...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Professional Titles</h1>
          <p className="text-muted-foreground text-lg mt-1">Define the roles you are targeting to tailor your resume.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="lg" className="shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-5 w-5" /> Add New Title
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/20 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle>{editingId ? "Edit Target Title" : "Add Target Title"}</CardTitle>
            <CardDescription>Targeting specific roles helps our AI generate more relevant resume content.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Trophy size={14} className="text-primary" /> Role Title
                  </label>
                  <input
                    required
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Star size={14} className="text-primary" /> Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Role Description & Expectations</label>
                <textarea
                  className="w-full p-3 rounded-md border border-input bg-background min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                  placeholder="Describe your focus for this role. What technologies or achievements should the AI highlight?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: "", description: "", priority: 1 });
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="px-8 font-bold">
                   {editingId ? <><Save className="mr-2 h-4 w-4" /> Update Title</> : "Create Title"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {titles.length === 0 && !isAdding && (
          <Card className="col-span-full border-dashed py-20 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-background rounded-full shadow-inner mb-4">
                <Trophy size={48} className="text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-xl font-bold mb-2">No target titles yet</h3>
              <p className="text-muted-foreground max-w-sm">Define the roles you're aiming for to help the AI generate tailored resumes for each job application.</p>
              <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-6">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Title
              </Button>
            </CardContent>
          </Card>
        )}
        
        {titles.sort((a,b) => b.priority - a.priority).map((title) => (
          <Card key={title.id} className="group relative hover:border-primary/40 transition-all hover:shadow-lg overflow-hidden border-primary/5 bg-card">
            <div className={`absolute top-0 left-0 w-1.5 h-full bg-primary transition-all ${title.priority >= 8 ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
            <CardHeader className="pb-3 pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">{title.name}</CardTitle>
                    {title.priority >= 8 && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded">
                        <Star size={14} className="fill-yellow-500 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                      Priority {title.priority}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => startEdit(title)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(title.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-sm h-[4.5rem] line-clamp-3 italic">
                {title.description || "No specific focus provided for this role."}
              </p>
            </CardContent>
            <div className="px-6 py-3 bg-muted/30 border-t flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Role Card</span>
              <AlertCircle size={12} className="text-muted-foreground/40" />
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Title"
        message="Are you sure you want to delete this target title?"
        isLoading={isDeleting}
      />
    </div>
  );
}
