"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Sparkles, Trophy, Lightbulb, TrendingUp, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface EvaluationData {
  id: number;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  ats_score: number;
  ats_feedback: string[];
  profile_gaps?: string[];
  created_at: string;
}

interface ResumeEvaluationReportProps {
  data: EvaluationData;
  onApplySuggestions?: (feedback: string) => void;
  isApplying?: boolean;
}

export function ResumeEvaluationReport({ data, onApplySuggestions, isApplying }: ResumeEvaluationReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Score */}
        <Card className="border-indigo-100 shadow-lg overflow-hidden">
          <div className={`h-2 ${getProgressColor(data.score)}`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <Trophy className="text-amber-500" size={24} /> Match Score
              </CardTitle>
              <CardDescription>Job description analysis</CardDescription>
            </div>
            <div className={`text-5xl font-black ${getScoreColor(data.score)}`}>
              {data.score}%
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Progress value={data.score} className="h-3" indicatorClassName={getProgressColor(data.score)} />
          </CardContent>
        </Card>

        {/* ATS Score */}
        <Card className="border-blue-100 shadow-lg overflow-hidden">
          <div className={`h-2 ${getProgressColor(data.ats_score)}`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <Sparkles className="text-blue-500" size={24} /> ATS Score
              </CardTitle>
              <CardDescription>Parsing & optimization</CardDescription>
            </div>
            <div className={`text-5xl font-black ${getScoreColor(data.ats_score)}`}>
              {data.ats_score}%
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Progress value={data.ats_score} className="h-3" indicatorClassName={getProgressColor(data.ats_score)} />
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="border-slate-100 shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic text-slate-700 dark:text-slate-300">
            "{data.summary}"
          </div>
          
          {onApplySuggestions && (
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl shadow-indigo-100 shadow-lg group"
              onClick={() => {
                const combinedFeedback = [
                  ...(data.suggestions || []),
                  ...(data.gaps || []),
                  ...(data.ats_feedback || [])
                ].join(". ");
                onApplySuggestions(`Please refine my resume based on these specific points: ${combinedFeedback}`);
              }}
              disabled={isApplying}
            >
              {isApplying ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              )}
              {isApplying ? "Applying AI Improvements..." : "Apply All Suggestions & Generate New Version"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-emerald-100 shadow-md">
          <CardHeader className="bg-emerald-50/50 pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={18} /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {data.strengths?.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="mt-1 shrink-0 text-emerald-500">
                    <TrendingUp size={14} />
                  </div>
                  {item}
                </li>
              ))}
              {(!data.strengths || data.strengths.length === 0) && (
                <li className="text-sm text-slate-400 italic text-center py-4">No specific strengths identified.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Gaps */}
        <Card className="border-amber-100 shadow-md">
          <CardHeader className="bg-amber-50/50 pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-700">
              <AlertCircle size={18} /> Gaps & Missing Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {data.gaps?.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="mt-1 shrink-0 text-amber-500">
                    <AlertCircle size={14} />
                  </div>
                  {item}
                </li>
              ))}
              {(!data.gaps || data.gaps.length === 0) && (
                <li className="text-sm text-slate-400 italic text-center py-4">No major gaps identified! You're a great match.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Deep Profile Gaps */}
      {data.profile_gaps && data.profile_gaps.length > 0 && (
        <Card className="border-red-100 bg-red-50/10 shadow-md animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-red-50/50 pb-3 border-b border-red-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-700">
              <AlertCircle size={18} className="text-red-600" /> Critical Profile Gaps (Not in your History)
            </CardTitle>
            <CardDescription className="text-red-600/80">
              These are required by the JD but were not found anywhere in your profile or projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {data.profile_gaps.map((gap, i) => (
                <div key={i} className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold border border-red-200">
                  {gap}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500 italic">
              * Consider adding relevant projects or skills to your profile if you have experience with these.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50/50 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-700">
            <Lightbulb size={18} /> Actionable Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.suggestions?.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border rounded-xl border-indigo-50 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Sparkles size={16} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
          {(!data.suggestions || data.suggestions.length === 0) && (
            <p className="text-sm text-slate-400 italic text-center py-6">No specific suggestions available at this time.</p>
          )}
        </CardContent>
      </Card>

      {/* ATS Feedback */}
      <Card className="border-blue-100 shadow-md">
        <CardHeader className="bg-blue-50/50 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-700">
            <Sparkles size={18} /> ATS Optimization Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3">
            {data.ats_feedback?.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="mt-1 shrink-0 text-blue-500">
                  <CheckCircle2 size={14} />
                </div>
                {item}
              </li>
            ))}
            {(!data.ats_feedback || data.ats_feedback.length === 0) && (
              <li className="text-sm text-slate-400 italic text-center py-4">No specific ATS feedback available.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
