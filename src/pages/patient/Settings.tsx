import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Shield, User, Heart } from "lucide-react";

export default function PatientSettings() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [patientData, setPatientData] = useState<any>(null);
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      appointments: true,
      testResults: true,
      surgeries: true
    },
    privacy: {
      shareData: false,
      allowMarketing: false
    },
    emergency: {
      contactName: "",
      contactPhone: "",
      relationship: ""
    }
  });

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setPatientData(data);
        setSettings(prev => ({
          ...prev,
          emergency: {
            contactName: data.emergency_contact_name || "",
            contactPhone: data.emergency_contact_phone || "",
            relationship: data.emergency_contact_relationship || ""
          }
        }));
      }
    };
    
    fetchPatientData();
  }, [user]);

  const handleSaveSettings = () => {
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
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue={profile?.first_name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue={profile?.last_name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue={profile?.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" defaultValue={patientData?.date_of_birth || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue={patientData?.address || ""} />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Contact Name</Label>
              <Input 
                id="emergencyName" 
                value={settings.emergency.contactName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emergency: { ...prev.emergency, contactName: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Phone Number</Label>
              <Input 
                id="emergencyPhone" 
                value={settings.emergency.contactPhone}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emergency: { ...prev.emergency, contactPhone: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Input 
                id="relationship" 
                value={settings.emergency.relationship}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emergency: { ...prev.emergency, relationship: e.target.value }
                }))}
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
                <Label htmlFor="test-results">Test Results</Label>
                <p className="text-sm text-gray-500">Get notified when test results are available</p>
              </div>
              <Switch 
                id="test-results" 
                checked={settings.notifications.testResults}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, testResults: checked }
                  }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="surgery-notifications">Surgery Notifications</Label>
                <p className="text-sm text-gray-500">Get notified about surgery updates</p>
              </div>
              <Switch 
                id="surgery-notifications" 
                checked={settings.notifications.surgeries}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, surgeries: checked }
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
                <Label htmlFor="share-data">Data Sharing</Label>
                <p className="text-sm text-gray-500">Share anonymized data for medical research</p>
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
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-marketing">Marketing Communications</Label>
                <p className="text-sm text-gray-500">Receive health tips and promotional content</p>
              </div>
              <Switch 
                id="allow-marketing" 
                checked={settings.privacy.allowMarketing}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, allowMarketing: checked }
                  }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="change-password">Security</Label>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Download My Data
              </Button>
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