"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Wrench,
  FolderKanban,
  FileText,
  Trophy,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";

const groups = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ]
  },
  {
    title: "Knowledge Base",
    items: [
      { label: "Profile", icon: User, href: "/profile" },
      { label: "Education", icon: GraduationCap, href: "/education" },
      { label: "Experiences", icon: Briefcase, href: "/experiences" },
      { label: "Skills", icon: Wrench, href: "/skills" },
      { label: "Projects", icon: FolderKanban, href: "/projects" },
      { label: "Titles", icon: Trophy, href: "/titles" },
    ]
  },
  {
    title: "Job Hunt",
    items: [
      { label: "Jobs", icon: Briefcase, href: "/jobs" },
      { label: "Resume Builder", icon: FileText, href: "/resume-builder" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r bg-card transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Resume
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground shadow-sm font-medium"
                      : "text-muted-foreground",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon size={20} className={cn(pathname === item.href ? "text-white" : "text-primary/70")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center space-x-3 text-destructive hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center"
          )}
          onClick={logout}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
