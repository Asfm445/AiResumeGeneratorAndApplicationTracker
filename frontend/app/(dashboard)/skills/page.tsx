"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wrench, Plus, Trash2, X } from "lucide-react";
import api from "@/lib/api";

interface SkillGroup {
  id: string;
  skill_type: string;
  skills: string[];
}

export default function SkillsPage() {
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    skill_type: "",
    skills: [] as string[],
  });
  const [currentSkill, setCurrentSkill] = useState("");

  const fetchSkills = async () => {
    try {
      const response = await api.get("/api/v1/profile/skills");
      setSkillGroups(response.data);
    } catch (err) {
      console.error("Failed to fetch skills", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const addSkillToForm = () => {
    if (currentSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()]
      });
      setCurrentSkill("");
    }
  };

  const removeSkillFromForm = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.skill_type || formData.skills.length === 0) return;
    try {
      await api.post("/api/v1/profile/skills", formData);
      setShowAdd(false);
      setFormData({ skill_type: "", skills: [] });
      fetchSkills();
    } catch (err) {
      alert("Failed to save skills");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm("Delete this skill group?")) {
      try {
        await api.delete(`/api/v1/profile/skills/${id}`);
        fetchSkills();
      } catch (err) {
        alert("Failed to delete skills");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground">Organize your expertise by category.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Skill Category</>}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>New Skill Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input 
                value={formData.skill_type}
                onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
                placeholder="e.g. Programming Languages, Frameworks, Cloud" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Skills</label>
              <div className="flex gap-2">
                <Input 
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillToForm())}
                  placeholder="Type a skill and press Enter" 
                />
                <Button variant="secondary" onClick={addSkillToForm}>Add</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                  {skill}
                  <button onClick={() => removeSkillFromForm(i)} className="hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleSave} disabled={!formData.skill_type || formData.skills.length === 0}>
              Save Category
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : skillGroups.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No skills added yet</h3>
            <p className="text-muted-foreground max-w-sm">Group your skills by category to help our AI better understand your expertise.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillGroups.map((group) => (
            <Card key={group.id} className="group hover:border-primary/30 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{group.skill_type}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill, i) => (
                    <span key={i} className="bg-primary/5 text-primary border border-primary/20 px-3 py-1 rounded-md text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
