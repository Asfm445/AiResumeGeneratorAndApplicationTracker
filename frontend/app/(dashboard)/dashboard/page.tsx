import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, Wrench, FolderKanban } from "lucide-react";

const stats = [
  { label: "Profile Status", value: "Complete", icon: User, color: "text-blue-500" },
  { label: "Experiences", value: "5", icon: Briefcase, color: "text-green-500" },
  { label: "Skills", value: "12", icon: Wrench, color: "text-purple-500" },
  { label: "Projects", value: "8", icon: FolderKanban, color: "text-orange-500" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Here is an overview of your profile and applications.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm italic">No recent activity found. Start by updating your profile or generating a resume.</p>
        </CardContent>
      </Card>
    </div>
  );
}
