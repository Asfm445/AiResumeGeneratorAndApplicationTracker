"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Briefcase, Plus, Trash2, Edit2 } from "lucide-react";
import api from "@/lib/api";

interface Experience {
  id: string;
  company_name: string;
  role_title: string;
  employement_type: string;
  short_description: string;
  start_date: string;
  end_date?: string;
  tech_stack?: string[];
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    role_title: "",
    employement_type: "Full-time",
    short_description: "",
    start_date: "",
    end_date: "",
    tech_stack: [] as string[],
  });

  const fetchExperiences = async () => {
    try {
      const response = await api.get("/api/v1/profile/experiences");
      setExperiences(response.data);
    } catch (err) {
      console.error("Failed to fetch experiences", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/v1/profile/experiences", formData);
      setShowAdd(false);
      setFormData({ 
        company_name: "", 
        role_title: "", 
        employement_type: "Full-time", 
        short_description: "", 
        start_date: "", 
        end_date: "", 
        tech_stack: [] 
      });
      fetchExperiences();
    } catch (err) {
      alert("Failed to add experience");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this experience?")) {
      try {
        await api.delete(`/api/v1/profile/experiences/${id}`);
        fetchExperiences();
      } catch (err) {
        alert("Failed to delete experience");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Experience</h1>
          <p className="text-muted-foreground">Manage your professional background.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Experience</>}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>Add New Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input 
                    required 
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder="e.g. Google" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Title</label>
                  <Input 
                    required 
                    value={formData.role_title}
                    onChange={(e) => setFormData({...formData, role_title: e.target.value})}
                    placeholder="e.g. Senior Software Engineer" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employment Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    value={formData.employement_type}
                    onChange={(e) => setFormData({...formData, employement_type: e.target.value})}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input 
                    required 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date (Optional)</label>
                <Input 
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Description</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  placeholder="Describe your key achievements and responsibilities..."
                />
              </div>
              <Button type="submit" className="w-full">Save Experience</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : experiences.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No experiences yet</h3>
            <p className="text-muted-foreground max-w-sm">Share your professional journey to help our AI generate a better resume for you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiences.map((exp) => (
            <Card key={exp.id} className="group transition-all hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{exp.role_title}</CardTitle>
                  <CardDescription className="text-primary font-medium">{exp.company_name} • {exp.employement_type}</CardDescription>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(exp.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-4">
                  {new Date(exp.start_date).toLocaleDateString()} — {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : "Present"}
                </div>
                <p className="text-sm whitespace-pre-wrap">{exp.short_description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
