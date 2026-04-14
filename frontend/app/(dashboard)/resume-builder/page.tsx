"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Download, Copy, Check, FileDown, Loader2, Trophy, Clock, FileText, ArrowLeft, Plus, MessageSquare, Edit3, Save, X, Trash2, Briefcase } from "lucide-react";
import api from "@/lib/api";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { useAuthStore } from "@/lib/store";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function ResumeBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeIdParam = searchParams.get("resume_id");

  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<any | null>(null);
  const [titles, setTitles] = useState<any[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Refinement & Edit states
  const [refinementComment, setRefinementComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showRefinePanel, setShowRefinePanel] = useState(false);

  // Tailoring states
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredJobTitle, setTailoredJobTitle] = useState("");
  const [tailoredCompany, setTailoredCompany] = useState("");

  const user = useAuthStore((state) => state.user);
  const resumeRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // Initial fetch: Titles
  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const response = await api.get("/api/v1/profile/titles");
        setTitles(response.data);
        if (response.data.length > 0 && !selectedTitleId) {
          setSelectedTitleId(response.data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to fetch titles", err);
      }
    };
    fetchTitles();
  }, []);

  // Fetch resumes whenever title changes
  useEffect(() => {
    if (selectedTitleId) {
      const fetchResumes = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/v1/resume/history/${selectedTitleId}`);
          const fetchedResumes = response.data.data;
          setResumes(fetchedResumes);
          
          if (resumeIdParam) {
            const found = fetchedResumes.find((r: any) => r.id.toString() === resumeIdParam);
            if (found) {
              setSelectedResume(found);
              setEditedData(JSON.parse(JSON.stringify(found.resume_data)));
            }
          }
        } catch (err) {
          console.error("Failed to fetch resumes", err);
        } finally {
          setLoading(false);
        }
      };
      fetchResumes();
    }
  }, [selectedTitleId, resumeIdParam]);

  const selectResume = (r: any) => {
    setSelectedResume(r);
    setEditedData(JSON.parse(JSON.stringify(r.resume_data)));
    setIsEditing(false);
  };

  const generateNewResume = async () => {
    setLoading(true);
    try {
      const url = selectedTitleId 
        ? `/api/v1/resume/generate?title_id=${selectedTitleId}` 
        : "/api/v1/resume/generate";
      const response = await api.get(url);
      
      const historyRes = await api.get(`/api/v1/resume/history/${selectedTitleId}`);
      const updatedList = historyRes.data.data;
      setResumes(updatedList);
      selectResume(updatedList[0]);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementComment.trim() || !selectedResume) return;
    setRefining(true);
    try {
      const response = await api.post(`/api/v1/resume/refine/${selectedResume.id}`, {
        comment: refinementComment
      });
      
      const historyRes = await api.get(`/api/v1/resume/history/${selectedTitleId}`);
      const updatedList = historyRes.data.data;
      setResumes(updatedList);
      selectResume(updatedList[0]);
      setRefinementComment("");
      setShowRefinePanel(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to refine resume.");
    } finally {
      setRefining(false);
    }
  };

  const handleManualSave = async () => {
    if (!selectedResume || !editedData) return;
    setLoading(true);
    try {
      const response = await api.put(`/api/v1/resume/${selectedResume.id}`, {
        resume_data: editedData
      });
      
      const historyRes = await api.get(`/api/v1/resume/history/${selectedTitleId}`);
      const updatedList = historyRes.data.data;
      setResumes(updatedList);
      selectResume(updatedList[0]);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save edits.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (e: React.MouseEvent, resumeId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/v1/resume/${resumeId}`);
      
      // Update local state
      const updatedResumes = resumes.filter(r => r.id !== resumeId);
      setResumes(updatedResumes);
      
      // If the deleted resume was selected, deselect it
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
        setIsEditing(false);
        router.push('/resume-builder');
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) {
      alert("Please provide a job description.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/v1/resume/tailor", {
        job_description: jobDescription,
        title_id: selectedTitleId ? parseInt(selectedTitleId) : null,
        job_title: tailoredJobTitle,
        company_name: tailoredCompany
      });

      const newResume = response.data.data;
      
      // Update resumes list
      const historyRes = await api.get(`/api/v1/resume/history/${selectedTitleId}`);
      setResumes(historyRes.data.data);
      
      // Select the new resume
      setSelectedResume(newResume);
      setEditedData(JSON.parse(JSON.stringify(newResume.resume_data)));
      
      // Reset and close modal
      setJobDescription("");
      setTailoredJobTitle("");
      setTailoredCompany("");
      setShowTailorModal(false);
      
      router.push(`/resume-builder?resume_id=${newResume.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to tailor resume.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (selectedResume) {
      const data = isEditing ? editedData : selectedResume.resume_data;
      const text = `${data.name}\n${data.email}\n\nSUMMARY\n${data.professional_summary}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadAsPdf = async () => {
    const element = captureRef.current;
    if (!element) return;
    
    setDownloading(true);
    try {
       const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
       await pdf.html(element, {
         callback: (doc) => { doc.save(`${user?.name || 'Resume'}_v${selectedResume.version}.pdf`); },
         x: 0, y: 0, width: 595, windowWidth: 816, autoPaging: 'text',
         html2canvas: { scale: 0.729, useCORS: true, logging: false }
       });
    } catch (error) {
       console.error("PDF generation failed", error);
       alert("Failed to generate PDF.");
    } finally {
       setDownloading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedResume(null);
    setIsEditing(false);
    router.push('/resume-builder');
  };

  const currentTitle = titles.find(t => t.id.toString() === selectedTitleId);

  return (
    <div className="space-y-8">
      {/* Hidden element for PDF capture */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        <div ref={captureRef} id="resume-capture" className="bg-white">
          {selectedResume && <ResumeDocument data={isEditing ? editedData : selectedResume.resume_data} preview={true} />}
        </div>
      </div>

      {/* Header & Title Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resume Builder</h1>
          <p className="text-muted-foreground">Manage, edit and refine your tailored resumes.</p>
        </div>
        
        {titles.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 p-2 px-4 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
            <Trophy size={18} className="text-amber-500 shrink-0" />
            <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Target Role:</span>
            <select 
              className="bg-slate-900 text-sm font-black text-white focus:outline-none min-w-[160px] cursor-pointer appearance-none pr-4"
              value={selectedTitleId}
              onChange={(e) => {
                setSelectedTitleId(e.target.value);
                setSelectedResume(null);
              }}
            >
              {titles.map((t) => (
                <option key={t.id} value={t.id.toString()} className="bg-slate-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none -ml-4">
              <svg className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {selectedResume ? (
        /* --- VIEW/EDIT MODE --- */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-wrap items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm gap-4">
              <Button variant="ghost" onClick={handleBackToList} className="hover:bg-slate-100">
                <ArrowLeft className="mr-2 h-4 w-4" /> List
              </Button>
              
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => setShowRefinePanel(!showRefinePanel)} className={showRefinePanel ? "bg-indigo-50 border-indigo-200" : ""}>
                    <Sparkles className="mr-2 h-4 w-4 text-indigo-600" /> Refine
                 </Button>
                 
                 {isEditing ? (
                   <>
                     <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleManualSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Version
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                     </Button>
                   </>
                 ) : (
                   <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                     </Button>
                     <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={(e) => handleDeleteResume(e, selectedResume.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                     </Button>
                   </div>
                 )}
                 
                 <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                 </Button>
                 <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={downloadAsPdf} disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                 </Button>
              </div>
            </div>

            {showRefinePanel && (
              <Card className="border-indigo-200 bg-indigo-50/30 animate-in slide-in-from-top duration-300">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <MessageSquare size={16} /> Ask AI to refine this resume
                  </div>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. 'Make the summary more data-focused', 'Highlight more React experience in the projects', 'Keep it under one page'"
                    value={refinementComment}
                    onChange={(e) => setRefinementComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowRefinePanel(false)}>Cancel</Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleRefine} disabled={refining || !refinementComment.trim()}>
                      {refining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                      Generate Refined Version
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="bg-slate-200 dark:bg-slate-950 p-6 md:p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-inner relative">
               {isEditing && (
                 <div className="absolute top-4 left-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm z-10 border border-amber-200 animate-pulse">
                   Manual Edit Mode: All sections are now editable inline
                 </div>
               )}
               <div className="mx-auto min-w-[816px] max-w-[816px] shadow-2xl bg-white ring-1 ring-black/5" ref={resumeRef}>
                  <ResumeDocument 
                    data={isEditing ? editedData : selectedResume.resume_data} 
                    isEditable={isEditing}
                    onUpdate={(newData) => setEditedData(newData)}
                  />
               </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock size={16} /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {resumes.map((r) => (
                  <div key={r.id} className="relative group/item">
                    <button 
                      onClick={() => selectResume(r)}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-colors hover:bg-indigo-50 group flex flex-col gap-1 ${selectedResume?.id === r.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-700">v{r.version}</span>
                          <span className="text-muted-foreground">{format(new Date(r.created_at), "MMM d")}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 pr-6">
                        {r.job_title ? (
                          <div className="flex items-center gap-1 font-bold text-indigo-900 truncate">
                            <Briefcase size={10} className="shrink-0" />
                            {r.job_title}
                          </div>
                        ) : (
                          <span className="truncate text-muted-foreground group-hover:text-indigo-900">{r.resume_data.headline}</span>
                        )}
                        {r.company_name && (
                           <span className="text-[10px] text-slate-500 truncate italic">@ {r.company_name}</span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleDeleteResume(e, r.id)}
                      className="absolute right-2 bottom-3 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete version"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* --- LIST MODE --- */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Card 
              className="border-dashed border-2 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group relative overflow-hidden h-[300px] flex flex-col items-center justify-center text-center"
              onClick={generateNewResume}
            >
              <div className="bg-indigo-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                {loading ? <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /> : <Plus className="h-8 w-8 text-indigo-600" />}
              </div>
              <div className="mt-4 px-4">
                <h3 className="font-bold text-indigo-900">Generate New</h3>
                <p className="text-xs text-indigo-600 mt-1">Create a fresh AI-tailored resume for {currentTitle?.name || 'this role'}</p>
              </div>
            </Card>

            <Card 
              className="border-dashed border-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group relative overflow-hidden h-[300px] flex flex-col items-center justify-center text-center"
              onClick={() => setShowTailorModal(true)}
            >
              <div className="bg-emerald-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Briefcase className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="mt-4 px-4">
                <h3 className="font-bold text-emerald-900">Tailor to Job</h3>
                <p className="text-xs text-emerald-600 mt-1">Paste a job description to optimize your resume</p>
              </div>
            </Card>

            {resumes.map((r) => (
              <Card 
                key={r.id} 
                className="cursor-pointer hover:shadow-lg transition-all border-slate-200 overflow-hidden h-[300px] flex flex-col group relative"
                onClick={() => selectResume(r)}
              >
                <button
                  onClick={(e) => handleDeleteResume(e, r.id)}
                  className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-red-50 p-2 rounded-full text-slate-400 hover:text-red-600 transition-all shadow-md border border-slate-200 group-hover:scale-110"
                  title="Delete resume"
                >
                  <Trash2 size={16} />
                </button>
                <div className="h-2/3 bg-slate-50 border-b relative overflow-hidden flex items-start justify-center p-4">
                   <div className="w-full h-full bg-white shadow-sm rounded-t-sm border border-slate-100 p-3 scale-95 origin-top group-hover:scale-100 transition-transform">
                      <div className="h-2 w-1/2 bg-slate-200 mb-2"></div>
                      <div className="h-1 w-full bg-slate-100 mb-1"></div>
                      <div className="h-1 w-full bg-slate-100 mb-1"></div>
                      <div className="h-1 w-3/4 bg-slate-100 mb-4"></div>
                      <div className="h-1.5 w-1/3 bg-slate-200 mb-2"></div>
                      <div className="h-1 w-full bg-slate-100 mb-1"></div>
                      <div className="h-1 w-full bg-slate-100"></div>
                   </div>
                   <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      v{r.version}
                   </div>
                </div>
                <CardHeader className="p-4 flex-grow">
                  <CardTitle className="text-sm line-clamp-1">{r.resume_data.headline}</CardTitle>
                  <CardDescription className="text-[10px] flex items-center gap-1 mt-1">
                    <Clock size={10} /> {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {resumes.length === 0 && !loading && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-600">No resumes yet</h3>
               <p className="text-sm text-slate-400">Click the "Generate New" or "Tailor to Job" card to create your first version.</p>
            </div>
          )}
        </div>
      )}

      {/* Tailor Modal */}
      {showTailorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">Tailor Resume to Job</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Job Title (Optional)</label>
                <Input value={tailoredJobTitle} onChange={(e) => setTailoredJobTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
              </div>
              <div>
                <label className="text-sm font-semibold">Company (Optional)</label>
                <Input value={tailoredCompany} onChange={(e) => setTailoredCompany(e.target.value)} placeholder="e.g. TechCorp" />
              </div>
              <div>
                <label className="text-sm font-semibold">Job Description</label>
                <textarea 
                  className="w-full min-h-[200px] p-3 border rounded-md"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowTailorModal(false)}>Cancel</Button>
              <Button onClick={handleTailorResume} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Tailor Resume"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
