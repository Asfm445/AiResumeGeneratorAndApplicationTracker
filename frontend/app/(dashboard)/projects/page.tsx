"use client";

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FolderKanban, Plus, Trash2, ExternalLink, Tag, ArrowLeft, Info, Cpu, Layers, Pencil, X, Save } from "lucide-react";
import api from "@/lib/api";
import { useToastStore } from "@/lib/store";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface ProjectDescription {
  type: string;
  text: string;
}

interface Project {
  id: string;
  name: string;
  short_description: string;
  repo_url?: string;
  status: string;
  project_description?: ProjectDescription[];
}

export default function ProjectsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [addingDesc, setAddingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState({ type: "overview", text: "" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    repo_url: "",
    status: "active",
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/profile/projects");
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetail = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/profile/projects/${id}`);
      setSelectedProject(response.data);
      setSelectedProjectId(id);
    } catch (err) {
      console.error("Failed to fetch project detail", err);
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
      addToast("Failed to add project", "error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;
    try {
      await api.put(`/api/v1/profile/projects/${editingProjectId}`, formData);
      setEditingProjectId(null);
      setFormData({ name: "", short_description: "", repo_url: "", status: "active" });
      fetchProjects();
    } catch (err) {
      addToast("Failed to update project", "error");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/profile/projects/${projectToDelete}`);
      fetchProjects();
      addToast("Project deleted successfully", "success");
    } catch (err) {
      addToast("Failed to delete project", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  const startEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: project.name,
      short_description: project.short_description,
      repo_url: project.repo_url || "",
      status: project.status,
    });
    setEditingProjectId(project.id);
    setShowAdd(true);
  };

  const handleAddDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await api.post(`/api/v1/profile/projects/${selectedProjectId}/description`, newDesc);
      setAddingDesc(false);
      setNewDesc({ type: "overview", text: "" });
      fetchProjectDetail(selectedProjectId);
    } catch (err) {
      addToast("Failed to add description", "error");
    }
  };

  if (selectedProjectId && selectedProject) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Button variant="ghost" onClick={() => { setSelectedProjectId(null); setSelectedProject(null); }} className="mb-4 hover:bg-primary/10 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>

        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{selectedProject.name}</h1>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedProject.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProject.status.toUpperCase()}
                  </span>
                  {selectedProject.repo_url && (
                    <a href={selectedProject.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink size={14} className="mr-1" /> Repository
                    </a>
                  )}
                </div>
              </div>
              <Button onClick={() => setAddingDesc(!addingDesc)} variant={addingDesc ? "outline" : "default"} className="shadow-sm">
                {addingDesc ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add Detail</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {addingDesc && (
          <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Add Project Detail</CardTitle>
              <CardDescription>Break down your project into specific categories for better presentation.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDescription} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detail Type</label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={newDesc.type}
                      onChange={(e) => setNewDesc({...newDesc, type: e.target.value})}
                    >
                      <option value="overview">General Overview</option>
                      <option value="features">Key Features</option>
                      <option value="tech_stack">Technical Stack</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Details</label>
                  <textarea 
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    required
                    value={newDesc.text}
                    onChange={(e) => setNewDesc({...newDesc, text: e.target.value})}
                    placeholder="Describe the technical challenges, implementation details, or user features..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                   <Button type="button" variant="outline" onClick={() => setAddingDesc(false)}>Cancel</Button>
                   <Button type="submit" className="px-8">Save Detail</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 pb-12">
          {selectedProject.project_description && selectedProject.project_description.length > 0 ? (
            selectedProject.project_description.map((desc, idx) => (
              <Card key={idx} className="shadow-md border-primary/5 overflow-hidden hover:border-primary/20 transition-all">
                <CardHeader className="bg-muted/30 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {desc.type === 'tech_stack' ? <Cpu size={20} className="text-primary" /> : 
                       desc.type === 'features' ? <Layers size={20} className="text-primary" /> : 
                       <Info size={20} className="text-primary" />}
                    </div>
                    <CardTitle className="text-lg capitalize font-bold">{desc.type.replace('_', ' ')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-base">
                    {desc.text}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Info size={32} className="opacity-20" />
                </div>
                <p className="font-medium text-lg">No detailed sections yet.</p>
                <p className="text-sm max-w-xs mb-4">Add sections like Technical Stack or Features to make your project stand out.</p>
                <Button variant="outline" onClick={() => setAddingDesc(true)}>Add your first detail</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-lg mt-1">Showcase your technical expertise and portfolio.</p>
        </div>
        <Button 
          onClick={() => {
            if (showAdd) {
              setEditingProjectId(null);
              setFormData({ name: "", short_description: "", repo_url: "", status: "active" });
            }
            setShowAdd(!showAdd);
          }}
          size="lg"
          className="shadow-md hover:shadow-lg transition-all"
        >
          {showAdd ? <><X className="mr-2 h-5 w-5" /> Cancel</> : <><Plus className="mr-2 h-5 w-5" /> New Project</>}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle>{editingProjectId ? "Edit Project" : "Create New Project"}</CardTitle>
            <CardDescription>Provide the high-level details for your project.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={editingProjectId ? handleUpdate : handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <FolderKanban size={14} className="text-primary" /> Project Name
                  </label>
                  <Input 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Distributed Task Queue" 
                    className="focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <ExternalLink size={14} className="text-primary" /> Repository URL
                  </label>
                  <Input 
                    value={formData.repo_url}
                    onChange={(e) => setFormData({...formData, repo_url: e.target.value})}
                    placeholder="https://github.com/yourusername/repo" 
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold">Short Summary</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                  required
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  placeholder="A one or two sentence summary of the project's purpose and tech stack..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                 <Button type="button" variant="outline" onClick={() => {
                   setShowAdd(false);
                   setEditingProjectId(null);
                 }}>Cancel</Button>
                 <Button type="submit" className="px-10 font-bold">
                   {editingProjectId ? <><Save className="mr-2 h-4 w-4" /> Update Project</> : "Create Project"}
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading your portfolio...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-muted/30 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-20 text-center">
            <div className="p-6 bg-background rounded-full shadow-inner mb-6">
              <FolderKanban className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Build Your Portfolio</h3>
            <p className="text-muted-foreground max-w-md text-lg">Your projects are the best way to demonstrate your practical skills. Start by adding your favorite build.</p>
            <Button onClick={() => setShowAdd(true)} className="mt-8" size="lg">
              <Plus className="mr-2 h-5 w-5" /> Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="group flex flex-col h-full border-primary/5 hover:border-primary/30 transition-all cursor-pointer hover:shadow-xl relative overflow-hidden bg-card"
              onClick={() => fetchProjectDetail(project.id)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{project.name}</CardTitle>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={(e) => startEdit(project, e)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(project.id, e)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-0">
                <p className="text-muted-foreground leading-relaxed">
                  {project.short_description}
                </p>
              </CardContent>

              <div className="p-4 pt-4 mt-auto border-t bg-muted/30 flex justify-between items-center text-xs font-bold text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-4">
                  {project.repo_url && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink size={12} />
                      <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="hover:underline">REPO</a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Info size={12} />
                    <span>DETAILS</span>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 rotate-180 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also remove any detailed sections associated with it."
        isLoading={isDeleting}
      />
    </div>
  );
}
