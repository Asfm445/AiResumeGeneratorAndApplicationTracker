"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Download, Copy, Check, FileDown, Loader2, Trophy } from "lucide-react";
import api from "@/lib/api";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { useAuthStore } from "@/lib/store";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ResumeBuilderPage() {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resume, setResume] = useState<any | null>(null);
  const [titles, setTitles] = useState<any[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const user = useAuthStore((state) => state.user);
  const resumeRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const response = await api.get("/api/v1/profile/titles");
        setTitles(response.data);
        if (response.data.length > 0) {
          // Default to the first one (highest priority if backend returns sorted)
          setSelectedTitleId(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch titles", err);
      }
    };
    fetchTitles();
  }, []);

  const generateResume = async () => {
    setLoading(true);
    setResume(null);
    try {
      const url = selectedTitleId 
        ? `/api/v1/resume/generate?title_id=${selectedTitleId}` 
        : "/api/v1/resume/generate";
      const response = await api.get(url);
      const resumeData = response.data.data;
      
      setResume({
        ...resumeData,
        name: user?.name || "Professional Candidate",
        email: user?.email,
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate resume.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (resume) {
      const text = `${resume.name}\n${resume.email}\n\nSUMMARY\n${resume.professional_summary}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadAsPdf = async () => {
    const element = captureRef.current;
    const container = element?.parentElement;
    if (!element || !container) {
      alert("Resume preview not found. Please regenerate.");
      return;
    }
    
    setDownloading(true);
    
    // Original styles to restore
    const originalPosition = container.style.position;
    const originalLeft = container.style.left;
    const originalVisibility = container.style.visibility;
    const originalDisplay = element.style.display;

    try {
      // Temporarily make it "visible" but off-screen or covered
      container.style.position = "absolute";
      container.style.left = "0px";
      container.style.top = "0px";
      container.style.visibility = "visible";
      container.style.zIndex = "-1000";
      element.style.display = "block";

      // Small delay for any remaining rendering
      await new Promise(r => setTimeout(r, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: true, // Enable logging for debugging if it still fails
        width: 816,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 816,
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      pdf.addImage(imgData, "JPEG", 0, 0, finalWidth, finalHeight);
      pdf.save(`${user?.name || 'Resume'}_AI_Generated.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to generate PDF. You can try taking a screenshot or use 'Print' (Ctrl+P) on this page.");
    } finally {
      // Restore original styles
      container.style.position = originalPosition;
      container.style.left = originalLeft;
      container.style.visibility = originalVisibility;
      element.style.display = originalDisplay;
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden element for PDF capture */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        <div ref={captureRef} id="resume-capture" className="bg-white">
          {resume && <ResumeDocument data={resume} preview={true} />}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Resume Builder</h1>
          <p className="text-muted-foreground">Expertly crafted documents based on your professional profile.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {titles.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 p-1.5 px-3 rounded-lg border">
              <Trophy size={16} className="text-primary" />
              <select 
                className="bg-transparent text-sm font-medium focus:outline-none min-w-[150px]"
                value={selectedTitleId}
                onChange={(e) => setSelectedTitleId(e.target.value)}
              >
                {titles.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {resume && (
            <>
              <Button variant="outline" onClick={copyToClipboard} disabled={downloading}>
                {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy Text
              </Button>
              <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={downloadAsPdf} disabled={downloading}>
                {downloading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...</>
                ) : (
                  <><FileDown className="mr-2 h-4 w-4" /> Download PDF</>
                )}
              </Button>
            </>
          )}
          <Button 
            size="lg" 
            onClick={generateResume} 
            disabled={loading || downloading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-5 w-5" /> Regenerate</>}
          </Button>
        </div>
      </div>

      {!resume && !loading && (
        <Card className="bg-muted/30 border-dashed py-24">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="bg-indigo-100 p-6 rounded-3xl">
              <Sparkles className="h-16 w-16 text-indigo-600" />
            </div>
            <div className="max-w-md">
              <h3 className="text-2xl font-bold">Your Professional Resume</h3>
              <p className="text-muted-foreground mt-2">Ready to generate a tailored document that highlights your best achievements?</p>
            </div>
            <Button size="lg" onClick={generateResume} className="px-10 h-14 text-lg">Build Resume Now</Button>
          </CardContent>
        </Card>
      )}

      {(loading && !resume) && (
        <div className="space-y-4 animate-pulse">
          <div className="h-[900px] bg-slate-100 dark:bg-slate-800 rounded-3xl border border-slate-200"></div>
        </div>
      )}

      {resume && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-slate-200 dark:bg-slate-950 p-6 md:p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-x-auto">
             <div className="mx-auto min-w-[816px] max-w-[816px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] bg-white ring-1 ring-black/5" ref={resumeRef}>
                <ResumeDocument data={resume} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
