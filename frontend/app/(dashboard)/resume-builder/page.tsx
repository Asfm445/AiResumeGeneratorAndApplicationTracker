"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sparkles, Download, Copy, Check, FileDown, Loader2, Trophy, Clock,
  FileText, ArrowLeft, Plus, MessageSquare, Edit3, Save, X, Trash2,
  Briefcase, ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { useAuthStore } from "@/lib/store";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ResumeItem {
  id: number;
  user_id: string;
  title_id: number | null;
  job_id: number | null;
  resume_data: Record<string, any>;
  version: number;
  created_at: string;
}

interface Job {
  id: number;
  job_title: string;
  company_name: string;
  job_description: string;
  url?: string;
  location?: string;
}

interface Title {
  id: string;  // backend returns id as string
  name: string;
  priority: number;
  description?: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // mode: 'title' = browsing by career title | 'job' = browsing by a specific job
  const [mode, setMode] = useState<"title" | "job">("title");

  // Data
  const [titles, setTitles] = useState<Title[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeItem | null>(null);

  // Selectors
  const [selectedTitleId, setSelectedTitleId] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");   // used in job mode and tailor modal

  // UI state
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showRefinePanel, setShowRefinePanel] = useState(false);
  const [refinementComment, setRefinementComment] = useState("");

  // Tailor modal
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [isNewJob, setIsNewJob] = useState(false);
  const [tailorJobId, setTailorJobId] = useState<string>("");         // selected saved job in modal
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");

  const user = useAuthStore((s) => s.user);
  const resumeRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [titlesRes, jobsRes] = await Promise.all([
          api.get("/api/v1/profile/titles"),
          api.get("/api/v1/profile/jobs"),
        ]);

        const fetchedTitles: Title[] = titlesRes.data;
        const fetchedJobs: Job[] = jobsRes.data;
        setTitles(fetchedTitles);
        setJobs(fetchedJobs);

        const jobIdParam = searchParams.get("job_id");
        const resumeIdParam = searchParams.get("resume_id");

        if (jobIdParam) {
          // Came from Jobs page → switch to job mode, open tailor modal pre-selected
          setMode("job");
          setSelectedJobId(jobIdParam);
          setTailorJobId(jobIdParam);
          setShowTailorModal(true);
          // Also fetch any existing resumes for this job
          await fetchResumesByJob(jobIdParam);
        } else {
          // Default title mode
          if (fetchedTitles.length > 0) {
            setSelectedTitleId(fetchedTitles[0].id.toString());
          }
          if (resumeIdParam) {
            // Will be picked up after history fetch
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch resumes by title ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode === "title" && selectedTitleId) {
      fetchResumesByTitle(selectedTitleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTitleId, mode]);

  const fetchResumesByTitle = async (titleId: string, selectResumeId?: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/resume/history/${titleId}`);
      const fetched: ResumeItem[] = res.data.data;
      setResumes(fetched);

      if (selectResumeId) {
        const found = fetched.find((r) => r.id === selectResumeId);
        if (found) selectResume(found);
      } else {
        const resumeIdParam = searchParams.get("resume_id");
        if (resumeIdParam) {
          const found = fetched.find((r) => r.id.toString() === resumeIdParam);
          if (found) selectResume(found);
        }
      }
    } catch (err) {
      console.error("Failed to fetch resumes by title", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch resumes by job ───────────────────────────────────────────────────
  const fetchResumesByJob = async (jobId: string, selectResumeId?: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/resume/job/${jobId}`);
      const fetched: ResumeItem[] = res.data.data;
      setResumes(fetched);

      if (selectResumeId) {
        const found = fetched.find((r) => r.id === selectResumeId);
        if (found) selectResume(found);
      } else if (fetched.length > 0) {
        selectResume(fetched[0]);
      }
    } catch (err) {
      console.error("Failed to fetch resumes by job", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectResume = (r: ResumeItem) => {
    setSelectedResume(r);
    setEditedData(JSON.parse(JSON.stringify(r.resume_data)));
    setIsEditing(false);
    setShowRefinePanel(false);
  };

  const refreshCurrentList = async (newResumeId?: number) => {
    if (mode === "job" && selectedJobId) {
      await fetchResumesByJob(selectedJobId, newResumeId);
    } else if (selectedTitleId) {
      await fetchResumesByTitle(selectedTitleId, newResumeId);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const generateNewResume = async () => {
    setLoading(true);
    try {
      const url = selectedTitleId
        ? `/api/v1/resume/generate?title_id=${selectedTitleId}`
        : "/api/v1/resume/generate";
      const res = await api.get(url);
      await fetchResumesByTitle(selectedTitleId, res.data.data.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!isNewJob && !tailorJobId) {
      alert("Please select a saved job or choose 'Paste New Job'.");
      return;
    }
    if (isNewJob && (!newJobDescription.trim() || !newJobTitle.trim() || !newCompany.trim())) {
      alert("Please fill in Company, Job Title and Job Description.");
      return;
    }

    setLoading(true);
    try {
      let resolvedJobId = tailorJobId;

      // If pasting a new job, create it first then tailor
      if (isNewJob) {
        const jobRes = await api.post("/api/v1/profile/jobs", {
          job_title: newJobTitle,
          company_name: newCompany,
          job_description: newJobDescription,
        });
        const createdJob = jobRes.data;
        resolvedJobId = createdJob.id.toString();
        // Refresh jobs list so it shows up everywhere
        const jobsRes = await api.get("/api/v1/profile/jobs");
        setJobs(jobsRes.data);
      }

      // Tailor the resume to the job
      const res = await api.post("/api/v1/resume/tailor", {
        job_id: parseInt(resolvedJobId),
      });
      const newResume: ResumeItem = res.data.data;

      // Switch to job mode and show the result
      setMode("job");
      setSelectedJobId(resolvedJobId);
      setShowTailorModal(false);
      resetTailorModal();

      // Fetch all resumes for this job and select the new one
      await fetchResumesByJob(resolvedJobId, newResume.id);

      router.push(`/resume-builder?job_id=${resolvedJobId}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to tailor resume.");
    } finally {
      setLoading(false);
    }
  };

  const resetTailorModal = () => {
    setIsNewJob(false);
    setTailorJobId("");
    setNewJobTitle("");
    setNewCompany("");
    setNewJobDescription("");
  };

  const handleRefine = async () => {
    if (!refinementComment.trim() || !selectedResume) return;
    setRefining(true);
    try {
      await api.post(`/api/v1/resume/refine/${selectedResume.id}`, {
        comment: refinementComment,
      });
      setRefinementComment("");
      setShowRefinePanel(false);
      await refreshCurrentList();
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
      await api.put(`/api/v1/resume/${selectedResume.id}`, { resume_data: editedData });
      setIsEditing(false);
      await refreshCurrentList(selectedResume.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save edits.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (e: React.MouseEvent, resumeId: number) => {
    e.stopPropagation();
    if (!confirm("Delete this resume version? This cannot be undone.")) return;
    setLoading(true);
    try {
      await api.delete(`/api/v1/resume/${resumeId}`);
      const updated = resumes.filter((r) => r.id !== resumeId);
      setResumes(updated);
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
        setIsEditing(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete resume.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (selectedResume) {
      const data = isEditing ? editedData : selectedResume.resume_data;
      navigator.clipboard.writeText(
        `${data.name}\n${data.email}\n\nSUMMARY\n${data.professional_summary}`
      );
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
        callback: (doc) => doc.save(`${user?.name || "Resume"}_v${selectedResume?.version}.pdf`),
        x: 0, y: 0, width: 595, windowWidth: 816, autoPaging: "text",
        html2canvas: { scale: 0.729, useCORS: true, logging: false },
      });
    } catch {
      alert("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentTitle = titles.find((t) => t.id === selectedTitleId);
  const currentJob = jobs.find((j) => j.id.toString() === selectedJobId);

  // ── Tailor modal pre-selection when job_id param provided ──────────────────
  useEffect(() => {
    if (tailorJobId === "" && searchParams.get("job_id")) {
      setTailorJobId(searchParams.get("job_id")!);
    }
  }, [tailorJobId, searchParams]);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Hidden PDF capture target */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        <div ref={captureRef} className="bg-white">
          {selectedResume && (
            <ResumeDocument
              data={isEditing ? editedData : selectedResume.resume_data}
              preview={true}
            />
          )}
        </div>
      </div>

      {/* ── Header & mode selector ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resume Builder</h1>
          <p className="text-muted-foreground">
            {mode === "job" && currentJob
              ? `Viewing resumes tailored for ${currentJob.job_title} @ ${currentJob.company_name}`
              : "Manage, edit and refine your tailored resumes."}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border text-sm font-bold">
            <button
              onClick={() => {
                setMode("title");
                setSelectedResume(null);
                router.push("/resume-builder");
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                mode === "title"
                  ? "bg-white dark:bg-slate-700 shadow text-indigo-600"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              By Title
            </button>
            <button
              onClick={() => {
                setMode("job");
                setSelectedResume(null);
                if (jobs.length > 0 && !selectedJobId) {
                  const firstJob = jobs[0];
                  setSelectedJobId(firstJob.id.toString());
                  fetchResumesByJob(firstJob.id.toString());
                }
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                mode === "job"
                  ? "bg-white dark:bg-slate-700 shadow text-emerald-600"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              By Job
            </button>
          </div>

          {/* Context selector */}
          {mode === "title" && titles.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 p-2 px-4 rounded-xl border border-slate-700 shadow-sm">
              <Trophy size={16} className="text-amber-500 shrink-0" />
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Role:</span>
              <select
                className="bg-slate-900 text-sm font-black text-white focus:outline-none min-w-[140px] cursor-pointer appearance-none pr-4"
                value={selectedTitleId}
                onChange={(e) => {
                  setSelectedTitleId(e.target.value);
                  setSelectedResume(null);
                }}
              >
                {titles.map((t) => (
                  <option key={t.id} value={t.id.toString()} className="bg-slate-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "job" && jobs.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 p-2 px-4 rounded-xl border border-slate-700 shadow-sm">
              <Briefcase size={16} className="text-emerald-400 shrink-0" />
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Job:</span>
              <select
                className="bg-slate-900 text-sm font-black text-white focus:outline-none min-w-[160px] cursor-pointer appearance-none pr-4"
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  setSelectedResume(null);
                  fetchResumesByJob(e.target.value);
                }}
              >
                <option value="" className="bg-slate-900">-- Select a job --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id.toString()} className="bg-slate-900">
                    {j.company_name} — {j.job_title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Resume detail view ─────────────────────────────────────────────── */}
      {selectedResume ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedResume(null);
                  setIsEditing(false);
                }}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> List
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRefinePanel(!showRefinePanel)}
                  className={showRefinePanel ? "bg-indigo-50 border-indigo-200" : ""}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-indigo-600" /> Refine
                </Button>

                {isEditing ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleManualSave}
                    >
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={(e) => handleDeleteResume(e, selectedResume.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={downloadAsPdf}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Refine panel */}
            {showRefinePanel && (
              <Card className="border-indigo-200 bg-indigo-50/30 animate-in slide-in-from-top duration-300">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <MessageSquare size={16} /> Ask AI to refine this resume
                  </div>
                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. 'Make the summary more data-focused', 'Highlight more React experience'"
                    value={refinementComment}
                    onChange={(e) => setRefinementComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowRefinePanel(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleRefine}
                      disabled={refining || !refinementComment.trim()}
                    >
                      {refining ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles size={14} className="mr-2" />
                      )}
                      Generate Refined Version
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resume preview */}
            <div className="bg-slate-200 dark:bg-slate-950 p-6 md:p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-inner relative">
              {isEditing && (
                <div className="absolute top-4 left-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm z-10 border border-amber-200 animate-pulse">
                  Manual Edit Mode — sections are editable inline
                </div>
              )}
              <div
                className="mx-auto min-w-[816px] max-w-[816px] shadow-2xl bg-white ring-1 ring-black/5"
                ref={resumeRef}
              >
                <ResumeDocument
                  data={isEditing ? editedData : selectedResume.resume_data}
                  isEditable={isEditing}
                  onUpdate={(newData) => setEditedData(newData)}
                />
              </div>
            </div>
          </div>

          {/* Version history sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock size={16} /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {resumes.map((r) => {
                  const linkedJob = jobs.find((j) => j.id === r.job_id);
                  return (
                    <div key={r.id} className="relative group/item">
                      <button
                        onClick={() => selectResume(r)}
                        className={`w-full text-left p-3 rounded-lg text-xs transition-colors hover:bg-indigo-50 flex flex-col gap-1 ${
                          selectedResume?.id === r.id
                            ? "bg-indigo-50 border-l-2 border-indigo-600"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-700">v{r.version}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(r.created_at), "MMM d")}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 pr-6">
                          {linkedJob ? (
                            <>
                              <div className="flex items-center gap-1 font-bold text-indigo-900 truncate">
                                <Briefcase size={10} className="shrink-0" />
                                {linkedJob.job_title}
                              </div>
                              <span className="text-[10px] text-slate-500 truncate italic">
                                @ {linkedJob.company_name}
                              </span>
                            </>
                          ) : (
                            <span className="truncate text-muted-foreground">
                              {r.resume_data.headline}
                            </span>
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
                  );
                })}
                {resumes.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No versions yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ── List / Generate mode ─────────────────────────────────────────── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Generate new (title mode only) */}
            {mode === "title" && (
              <Card
                className="border-dashed border-2 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group h-[300px] flex flex-col items-center justify-center text-center"
                onClick={generateNewResume}
              >
                <div className="bg-indigo-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                  {loading ? (
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  ) : (
                    <Plus className="h-8 w-8 text-indigo-600" />
                  )}
                </div>
                <div className="mt-4 px-4">
                  <h3 className="font-bold text-indigo-900">Generate New</h3>
                  <p className="text-xs text-indigo-600 mt-1">
                    Create a fresh AI-tailored resume for {currentTitle?.name || "this role"}
                  </p>
                </div>
              </Card>
            )}

            {/* Tailor to job card */}
            <Card
              className="border-dashed border-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group h-[300px] flex flex-col items-center justify-center text-center"
              onClick={() => {
                if (mode === "job" && selectedJobId) {
                  setTailorJobId(selectedJobId);
                }
                setShowTailorModal(true);
              }}
            >
              <div className="bg-emerald-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Briefcase className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="mt-4 px-4">
                <h3 className="font-bold text-emerald-900">Tailor to Job</h3>
                <p className="text-xs text-emerald-600 mt-1">
                  {mode === "job" && currentJob
                    ? `Generate another version for ${currentJob.company_name}`
                    : "Paste a job description to optimize your resume"}
                </p>
              </div>
            </Card>

            {/* Existing resumes */}
            {resumes.map((r) => {
              const linkedJob = jobs.find((j) => j.id === r.job_id);
              return (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-slate-200 overflow-hidden h-[300px] flex flex-col group relative"
                  onClick={() => selectResume(r)}
                >
                  <button
                    onClick={(e) => handleDeleteResume(e, r.id)}
                    className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-red-50 p-2 rounded-full text-slate-400 hover:text-red-600 transition-all shadow-md border border-slate-200"
                    title="Delete resume"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="h-2/3 bg-slate-50 border-b relative overflow-hidden flex items-start justify-center p-4">
                    <div className="w-full h-full bg-white shadow-sm rounded-t-sm border border-slate-100 p-3 scale-95 origin-top group-hover:scale-100 transition-transform">
                      <div className="h-2 w-1/2 bg-slate-200 mb-2" />
                      <div className="h-1 w-full bg-slate-100 mb-1" />
                      <div className="h-1 w-full bg-slate-100 mb-1" />
                      <div className="h-1 w-3/4 bg-slate-100 mb-4" />
                      <div className="h-1.5 w-1/3 bg-slate-200 mb-2" />
                      <div className="h-1 w-full bg-slate-100 mb-1" />
                      <div className="h-1 w-full bg-slate-100" />
                    </div>
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      v{r.version}
                    </div>
                    {linkedJob && (
                      <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Briefcase size={8} /> Job
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4 flex-grow">
                    <CardTitle className="text-sm line-clamp-1">
                      {linkedJob ? linkedJob.job_title : r.resume_data.headline}
                    </CardTitle>
                    <CardDescription className="text-[10px] flex flex-col gap-1 mt-1">
                      {linkedJob && (
                        <span className="font-bold text-indigo-600 truncate">
                          @ {linkedJob.company_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Empty state */}
          {resumes.length === 0 && !loading && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-600">No resumes yet</h3>
              <p className="text-sm text-slate-400 mt-1">
                {mode === "job" && currentJob
                  ? `No resumes tailored for ${currentJob.job_title} at ${currentJob.company_name} yet. Click "Tailor to Job" above.`
                  : `Click "Generate New" or "Tailor to Job" to create your first version.`}
              </p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* ── Tailor Modal ───────────────────────────────────────────────────── */}
      {showTailorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl border-indigo-100">
            <CardHeader className="bg-indigo-600 text-white pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-black">Tailor Your Resume</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowTailorModal(false);
                    resetTailorModal();
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <X size={24} />
                </Button>
              </div>
              <CardDescription className="text-indigo-100">
                Align your skills and experience with a specific job for maximum impact.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setIsNewJob(false)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    !isNewJob ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Select Saved Job
                </button>
                <button
                  onClick={() => setIsNewJob(true)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    isNewJob ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Paste New Job
                </button>
              </div>

              {!isNewJob ? (
                <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                      Target Job
                    </label>
                    <div className="relative">
                      <select
                        className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none appearance-none transition-all font-bold text-slate-900"
                        value={tailorJobId}
                        onChange={(e) => setTailorJobId(e.target.value)}
                      >
                        <option value="">-- Choose a saved job --</option>
                        {jobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.company_name} — {job.job_title}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>
                    {jobs.length === 0 && (
                      <p className="text-xs text-amber-600 font-medium">
                        No saved jobs found. Go to the "Jobs" page to add some, or choose "Paste New Job".
                      </p>
                    )}
                  </div>
                  {tailorJobId && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-400 uppercase mb-2">
                        Job Description Preview
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-6 italic leading-relaxed">
                        {jobs.find((j) => j.id.toString() === tailorJobId)?.job_description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border">
                    This will create a new saved job and immediately generate a tailored resume for it.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                        Company *
                      </label>
                      <Input
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        placeholder="e.g. Google"
                        className="font-bold h-12 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                        Job Title *
                      </label>
                      <Input
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Eng."
                        className="font-bold h-12 border-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                      Paste Job Description *
                    </label>
                    <textarea
                      className="w-full min-h-[180px] p-4 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                      value={newJobDescription}
                      onChange={(e) => setNewJobDescription(e.target.value)}
                      placeholder="Paste the full job post details here..."
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTailorModal(false);
                  resetTailorModal();
                }}
                className="font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTailorResume}
                disabled={
                  loading ||
                  (!isNewJob && !tailorJobId) ||
                  (isNewJob && (!newJobDescription.trim() || !newJobTitle.trim() || !newCompany.trim()))
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-6 h-auto shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Sparkles size={18} className="mr-2" />
                )}
                {loading ? "Tailoring..." : "Start AI Tailoring"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
