"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, Plus, Trash2, BookOpen } from "lucide-react";
import api from "@/lib/api";
import { useToastStore } from "@/lib/store";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Education {
  id: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  relevant_courses?: string[];
}

export default function EducationPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [educationToDelete, setEducationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    school: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    relevant_courses_text: "",
  });

  const fetchEducation = async () => {
    try {
      const response = await api.get("/api/v1/profile/education");
      setEducationList(response.data);
    } catch (err) {
      console.error("Failed to fetch education", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        relevant_courses: formData.relevant_courses_text
          .split(',')
          .map(s => s.trim())
          .filter(s => s !== "")
      };
      delete (payload as any).relevant_courses_text;

      await api.post("/api/v1/profile/education", payload);
      setShowAdd(false);
      setFormData({ 
        school: "", 
        degree: "", 
        field_of_study: "", 
        start_date: "", 
        end_date: "", 
        relevant_courses_text: "" 
      });
      fetchEducation();
      addToast("Education added successfully", "success");
    } catch (err) {
      addToast("Failed to add education", "error");
    }
  };

  const handleDelete = (id: string) => {
    setEducationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!educationToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/profile/education/${educationToDelete}`);
      fetchEducation();
      addToast("Education deleted", "success");
    } catch (err) {
      addToast("Failed to delete education", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setEducationToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Education"
        description="Are you sure you want to delete this education entry? This action cannot be undone."
        isLoading={isDeleting}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Education</h1>
          <p className="text-muted-foreground">Manage your academic background.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Education</>}
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>Add New Education</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">School / University</label>
                  <Input 
                    required 
                    value={formData.school}
                    onChange={(e) => setFormData({...formData, school: e.target.value})}
                    placeholder="e.g. Stanford University" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Degree</label>
                  <Input 
                    required 
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value})}
                    placeholder="e.g. Bachelor of Science" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field of Study</label>
                  <Input 
                    required 
                    value={formData.field_of_study}
                    onChange={(e) => setFormData({...formData, field_of_study: e.target.value})}
                    placeholder="e.g. Computer Science" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      required 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date (Optional)</label>
                    <Input 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen size={14} className="text-muted-foreground" /> Relevant Courses
                </label>
                <textarea 
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.relevant_courses_text}
                  onChange={(e) => setFormData({...formData, relevant_courses_text: e.target.value})}
                  placeholder="e.g. Data Structures, Algorithms, Artificial Intelligence (comma separated)"
                />
              </div>
              <Button type="submit" className="w-full">Save Education</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : educationList.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No education entries yet</h3>
            <p className="text-muted-foreground max-w-sm">Add your academic background to complete your professional profile.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {educationList.map((edu) => (
            <Card key={edu.id} className="group transition-all hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{edu.degree} in {edu.field_of_study}</CardTitle>
                  <CardDescription className="text-primary font-medium">{edu.school}</CardDescription>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(edu.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">
                  {new Date(edu.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })} — {edu.end_date ? new Date(edu.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "Present"}
                </div>
                {edu.relevant_courses && edu.relevant_courses.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Relevant Courses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {edu.relevant_courses.map((course, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full border border-primary/10">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
