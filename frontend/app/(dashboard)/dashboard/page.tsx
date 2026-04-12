"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, Wrench, FolderKanban, FileText, Clock, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const [recentResumes, setRecentResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentResumes = async () => {
      try {
        const response = await api.get("/api/v1/resume/recent?limit=5");
        setRecentResumes(response.data.data);
      } catch (err) {
        console.error("Failed to fetch recent resumes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentResumes();
  }, []);

  const stats = [
    { label: "Profile Status", value: "Complete", icon: User, color: "text-blue-500" },
    { label: "Experiences", value: "5", icon: Briefcase, color: "text-green-500" },
    { label: "Skills", value: "12", icon: Wrench, color: "text-purple-500" },
    { label: "Projects", value: "8", icon: FolderKanban, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Here is an overview of your profile and resumes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Recent Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : recentResumes.length > 0 ? (
              <div className="space-y-4">
                {recentResumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{resume.resume_data.headline}</h4>
                        <p className="text-xs text-muted-foreground">
                          Version {resume.version} • {format(new Date(resume.created_at), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <Link href={`/resume-builder?resume_id=${resume.id}`}>
                      <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        View <ExternalLink className="h-3 w-3" />
                      </button>
                    </Link>
                  </div>
                ))}
                <Link href="/resume-builder" className="block text-center text-sm text-indigo-600 hover:underline mt-4">
                  Go to Resume Builder
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm italic mb-4">No recent resumes found.</p>
                <Link href="/resume-builder">
                  <button className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    Generate Your First Resume
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/profile" className="block p-3 text-sm bg-muted/30 rounded-lg hover:bg-muted/50">Update Profile</Link>
            <Link href="/experiences" className="block p-3 text-sm bg-muted/30 rounded-lg hover:bg-muted/50">Manage Experiences</Link>
            <Link href="/projects" className="block p-3 text-sm bg-muted/30 rounded-lg hover:bg-muted/50">Manage Projects</Link>
            <Link href="/skills" className="block p-3 text-sm bg-muted/30 rounded-lg hover:bg-muted/50">Manage Skills</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
