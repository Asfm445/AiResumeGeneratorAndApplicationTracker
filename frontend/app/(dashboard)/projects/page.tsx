"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FolderKanban, Plus, Trash2, ExternalLink, Tag } from "lucide-react";
import api from "@/lib/api";

interface Project {
  id: string;
  name: string;
  short_description: string;
  repo_url?: string;
  status: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    repo_url: "",
    status: "active",
  });

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/v1/profile/projects");
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/v1/profile/projects", formData);
      setShowAdd(false);
      setFormData({ name: "", short_description: "", repo_url: "", status: "active" });
      fetchProjects();
    } catch (err) {
      alert("Failed to add project");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Showcase your best work and technical projects.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Project</>}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. AI Content Generator" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Repo URL (Optional)</label>
                <Input 
                  value={formData.repo_url}
                  onChange={(e) => setFormData({...formData, repo_url: e.target.value})}
                  placeholder="https://github.com/yourusername/repo" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Description</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  placeholder="Summarize what you built and the technologies used..."
                />
              </div>
              <Button type="submit" className="w-full">Save Project</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground max-w-sm">Add your portfolio to showcase your practical skills to employers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col h-full border-primary/10 hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{project.name}</CardTitle>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                  {project.repo_url && (
                    <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-balance text-muted-foreground">{project.short_description}</p>
              </CardContent>
              <div className="p-6 pt-0 border-t bg-muted/20 flex justify-between items-center">
                <Button variant="ghost" size="sm" className="text-xs">
                  <Tag className="mr-2 h-3 w-3" /> Manage Tags
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
