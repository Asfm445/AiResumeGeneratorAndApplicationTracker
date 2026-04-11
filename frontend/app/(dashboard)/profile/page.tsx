"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, MapPin, Briefcase, Info, Save } from "lucide-react";
import api from "@/lib/api";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    headline: "",
    about_text: "",
    location: "",
    years_of_experience: 0,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/v1/profile/me");
        if (response.data) {
          setProfile(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/api/v1/profile/", profile);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and professional headline.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <User className="text-white h-5 w-5" />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and professional identity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" /> Full Name
                </label>
                <Input 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" /> Location
                </label>
                <Input 
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                  placeholder="e.g. San Francisco, CA" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Briefcase size={14} className="text-muted-foreground" /> Professional Headline
              </label>
              <Input 
                value={profile.headline}
                onChange={(e) => setProfile({...profile, headline: e.target.value})}
                placeholder="e.g. Senior Software Engineer specializing in AI/ML" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Years of Experience</label>
              <Input 
                type="number"
                value={profile.years_of_experience}
                onChange={(e) => setProfile({...profile, years_of_experience: parseInt(e.target.value) || 0})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Info className="text-white h-5 w-5" />
              </div>
              <div>
                <CardTitle>About Me</CardTitle>
                <CardDescription>Professional summary and bio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <textarea 
                className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={profile.about_text}
                onChange={(e) => setProfile({...profile, about_text: e.target.value})}
                placeholder="Tell your professional story..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={saving} className="px-8 font-bold">
            {saving ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
