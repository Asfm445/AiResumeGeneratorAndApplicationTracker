"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Briefcase, Trash2, Pencil, Link as LinkIcon, MapPin, Globe, Save, X, Sparkles, FileText } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Job {
  id: number;
  job_title: string;
  company_name: string;
  job_description: string;
  url?: string;
  location?: string;
  created_at: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    job_title: "",
    company_name: "",
    job_description: "",
    url: "",
    location: "",
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/profile/jobs");
      setJobs(response.data);
    } catch (err) {
      console.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/v1/profile/jobs/${editingId}`, formData);
      } else {
        await api.post("/api/v1/profile/jobs", formData);
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ job_title: "", company_name: "", job_description: "", url: "", location: "" });
      fetchJobs();
    } catch (err) {
      alert("Failed to save job");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/api/v1/profile/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      alert("Failed to delete job");
    }
  };

  const startEdit = (job: Job) => {
    setEditingId(job.id);
    setFormData({
      job_title: job.job_title,
      company_name: job.company_name,
      job_description: job.job_description,
      url: job.url || "",
      location: job.location || "",
    });
    setIsAdding(true);
  };

  const handleTailor = (jobId: number) => {
    router.push(`/resume-builder?job_id=${jobId}`);
  };

  if (loading && jobs.length === 0) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-muted-foreground animate-pulse">Loading your target jobs...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Job Applications</h1>
          <p className="text-muted-foreground text-lg mt-1">Track the roles you're interested in and tailor your resumes.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="lg" className="shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-5 w-5" /> Add New Job
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/20 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle>{editingId ? "Edit Job Details" : "Add New Target Job"}</CardTitle>
            <CardDescription>Save the job description here so you can generate tailored resumes for it later.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Briefcase size={14} className="text-primary" /> Job Title
                  </label>
                  <input
                    required
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    placeholder="e.g. Senior Backend Engineer"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Globe size={14} className="text-primary" /> Company Name
                  </label>
                  <input
                    required
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    placeholder="e.g. Google"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <MapPin size={14} className="text-primary" /> Location (Optional)
                  </label>
                  <input
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    placeholder="e.g. Remote / New York, NY"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <LinkIcon size={14} className="text-primary" /> Job URL (Optional)
                  </label>
                  <input
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    placeholder="e.g. https://linkedin.com/jobs/..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Job Description</label>
                <textarea
                  required
                  className="w-full p-3 rounded-md border border-input bg-background min-h-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all font-mono text-sm"
                  placeholder="Paste the full job description text here..."
                  value={formData.job_description}
                  onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ job_title: "", company_name: "", job_description: "", url: "", location: "" });
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="px-8 font-bold">
                   {editingId ? <><Save className="mr-2 h-4 w-4" /> Update Job</> : "Save Job"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 && !isAdding && (
          <Card className="col-span-full border-dashed py-20 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-background rounded-full shadow-inner mb-4">
                <Briefcase size={48} className="text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-xl font-bold mb-2">No jobs saved yet</h3>
              <p className="text-muted-foreground max-w-sm">Save job descriptions to quickly generate and manage tailored resumes for each application.</p>
              <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-6">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Job
              </Button>
            </CardContent>
          </Card>
        )}
        
        {jobs.map((job) => (
          <Card key={job.id} className="group hover:border-primary/40 transition-all hover:shadow-lg overflow-hidden border-slate-200 bg-card flex flex-col">
            <CardHeader className="pb-3 pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1 pr-8">
                  <CardTitle className="text-xl font-bold tracking-tight line-clamp-1">{job.job_title}</CardTitle>
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    {job.company_name}
                  </div>
                </div>
                <div className="flex gap-1 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => startEdit(job)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(job.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="flex flex-wrap gap-2">
                {job.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    <MapPin size={12} /> {job.location}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                   Added {format(new Date(job.created_at), "MMM d, yyyy")}
                </div>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-4 italic border-l-2 pl-3 border-slate-100">
                {job.job_description}
              </p>
            </CardContent>
            <div className="px-4 py-3 bg-muted/30 border-t flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold shadow-sm"
                onClick={() => handleTailor(job.id)}
              >
                <Sparkles size={14} className="mr-2" /> Tailor Resume
              </Button>
              {job.url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-2"
                  onClick={() => window.open(job.url, '_blank')}
                >
                  <LinkIcon size={14} />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
