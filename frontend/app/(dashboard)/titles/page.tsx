"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trophy, Trash2, Edit2, Star } from "lucide-react";
import api from "@/lib/api";

interface Title {
  id: number;
  title_name: string;
  description: string;
  priority: number;
}

export default function TitlesPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title_name: "",
    description: "",
    priority: 1,
  });

  const fetchTitles = async () => {
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
      setFormData({ title_name: "", description: "", priority: 1 });
      fetchTitles();
    } catch (err) {
      alert("Failed to save title");
    }
  };

  const startEdit = (title: Title) => {
    setEditingId(title.id);
    setFormData({
      title_name: title.title_name,
      description: title.description,
      priority: title.priority,
    });
    setIsAdding(true);
  };

  if (loading) return <div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Professional Titles</h1>
          <p className="text-muted-foreground">Manage target roles and their priority for AI resume generation.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-primary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" /> Add Title
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Title" : "New Target Title"}</CardTitle>
            <CardDescription>Define a role you are targeting. AI will use high-priority titles first.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title Name</label>
                  <input
                    required
                    className="w-full p-2 rounded-md border bg-background"
                    placeholder="e.g. Senior Backend Engineer"
                    value={formData.title_name}
                    onChange={(e) => setFormData({ ...formData, title_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full p-2 rounded-md border bg-background"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Description / Expectations</label>
                <textarea
                  className="w-full p-2 rounded-md border bg-background min-h-[100px]"
                  placeholder="What does this role entail for you? e.g. Focused on distributed systems and Go."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {titles.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-xl border border-dashed">
            <Trophy size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">No target titles defined yet. Add one to start tailoring your resume.</p>
          </div>
        )}
        
        {titles.sort((a,b) => b.priority - a.priority).map((title) => (
          <Card key={title.id} className="group relative hover:border-primary/50 transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 p-2 rounded-lg text-primary mb-2">
                  <Trophy size={20} />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(title)}><Edit2 size={16} /></Button>
                </div>
              </div>
              <CardTitle className="text-xl flex items-center gap-2">
                {title.title_name}
                {title.priority >= 8 && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority Level: {title.priority}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {title.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
