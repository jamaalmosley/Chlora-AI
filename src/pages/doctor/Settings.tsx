import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Shield, User } from "lucide-react";

export default function DoctorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      appointments: true,
      billing: true
    },
    privacy: {
      profileVisible: true,
      shareData: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC-5'
    }
  });

  const handleSaveSettings = () => {
    // Here you would save to database
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="Dr. John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                placeholder="Tell patients about yourself..."
                defaultValue="Experienced family physician with over 10 years of practice."
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={settings.notifications.email}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <Switch 
                id="sms-notifications" 
                checked={settings.notifications.sms}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="appointment-notifications">Appointment Reminders</Label>
                <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
              </div>
              <Switch 
                id="appointment-notifications" 
                checked={settings.notifications.appointments}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, appointments: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="billing-notifications">Billing Alerts</Label>
                <p className="text-sm text-gray-500">Get notified about payment updates</p>
              </div>
              <Switch 
                id="billing-notifications" 
                checked={settings.notifications.billing}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, billing: checked }
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="profile-visible">Public Profile</Label>
                <p className="text-sm text-gray-500">Make your profile visible to patients</p>
              </div>
              <Switch 
                id="profile-visible" 
                checked={settings.privacy.profileVisible}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, profileVisible: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="share-data">Data Sharing</Label>
                <p className="text-sm text-gray-500">Share anonymized data for research</p>
              </div>
              <Switch 
                id="share-data" 
                checked={settings.privacy.shareData}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, shareData: checked }
                  }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="change-password">Change Password</Label>
              <Button variant="outline" className="w-full">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monday - Friday</Label>
              <div className="flex gap-2">
                <Input defaultValue="9:00 AM" className="flex-1" />
                <span className="self-center">to</span>
                <Input defaultValue="5:00 PM" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Saturday</Label>
              <div className="flex gap-2">
                <Input defaultValue="9:00 AM" className="flex-1" />
                <span className="self-center">to</span>
                <Input defaultValue="1:00 PM" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sunday</Label>
              <div className="flex gap-2">
                <Input defaultValue="Closed" className="flex-1" disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          className="bg-medical-primary hover:bg-medical-dark"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}