"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, MapPin, Briefcase, Info, Save, Pencil, X, Calendar } from "lucide-react";
import api from "@/lib/api";
import { useToastStore } from "@/lib/store";

export default function ProfilePage() {
  const addToast = useToastStore((state) => state.addToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    headline: "",
    bio: "",
    location: "",
    yearsOfExperience: 0,
  });
  const [editedProfile, setEditedProfile] = useState({ ...profile });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/api/v1/profile/me");
      if (response.data) {
        setProfile(response.data);
        setEditedProfile(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/api/v1/profile/", editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
      addToast("Profile updated successfully", "success");
    } catch (err) {
      addToast("Failed to update profile", "error");
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and professional headline.</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} variant="outline" className="flex gap-2">
            <Pencil size={16} /> Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 shadow-md">
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User size={48} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.fullName || "Set your name"}</h2>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
                  {profile.headline || "Add a headline"}
                </p>
              </div>
              <div className="w-full pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} className="text-primary" />
                  <span>{profile.location || "Location not set"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase size={16} className="text-primary" />
                  <span>{profile.yearsOfExperience} Years Experience</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-primary/5 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Info size={18} className="text-primary" />
                  <CardTitle className="text-lg">About Me</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {profile.bio || "Tell your story here. Use the edit button to add a professional summary."}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="bg-primary/5 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  <CardTitle className="text-lg">Professional Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Current Role/Headline</p>
                    <p className="font-medium mt-1">{profile.headline || "Not specified"}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Experience Level</p>
                    <p className="font-medium mt-1">{profile.yearsOfExperience} Years</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-lg">
                    <User className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Update your personal and professional identity</CardDescription>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" /> Full Name
                  </label>
                  <Input 
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin size={14} className="text-muted-foreground" /> Location
                  </label>
                  <Input 
                    value={editedProfile.location}
                    onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                    placeholder="e.g. San Francisco, CA" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase size={14} className="text-muted-foreground" /> Professional Headline
                </label>
                <Input 
                  value={editedProfile.headline}
                  onChange={(e) => setEditedProfile({...editedProfile, headline: e.target.value})}
                  placeholder="e.g. Senior Software Engineer specializing in AI/ML" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Years of Experience</label>
                <Input 
                  type="number"
                  value={editedProfile.yearsOfExperience}
                  onChange={(e) => setEditedProfile({...editedProfile, yearsOfExperience: parseInt(e.target.value) || 0})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-primary/20">
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
                  className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  placeholder="Tell your professional story..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" size="lg" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={saving} className="px-8 font-bold">
              {saving ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
