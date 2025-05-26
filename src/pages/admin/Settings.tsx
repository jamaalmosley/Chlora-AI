
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Shield, BellRing, Mail } from "lucide-react";

const AdminSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [timeZone, setTimeZone] = useState("America/New_York");

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-600">
          Configure system-wide settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64">
            <TabsList className="flex flex-col items-start w-full bg-transparent space-y-1">
              <TabsTrigger value="general" className="w-full justify-start">
                <SettingsIcon className="h-5 w-5 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="users" className="w-full justify-start">
                <User className="h-5 w-5 mr-2" />
                Users & Permissions
              </TabsTrigger>
              <TabsTrigger value="security" className="w-full justify-start">
                <Shield className="h-5 w-5 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start">
                <BellRing className="h-5 w-5 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="email" className="w-full justify-start">
                <Mail className="h-5 w-5 mr-2" />
                Email Templates
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="general" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure general system settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Hospital Information</h3>
                    <Separator className="my-3" />
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="hospitalName">Hospital Name</Label>
                        <Input id="hospitalName" defaultValue="Chlora Medical Center" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hospitalAddress">Hospital Address</Label>
                        <Input id="hospitalAddress" defaultValue="123 Health Avenue, Medical District" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hospitalPhone">Hospital Phone</Label>
                        <Input id="hospitalPhone" defaultValue="+1 (555) 987-6543" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Application Settings</h3>
                    <Separator className="my-3" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Time Zone</Label>
                          <p className="text-sm text-gray-500">Set the system's default time zone</p>
                        </div>
                        <Select defaultValue={timeZone} onValueChange={setTimeZone}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Date Format</Label>
                          <p className="text-sm text-gray-500">Set the system's default date format</p>
                        </div>
                        <Select defaultValue="MM/DD/YYYY">
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Language</Label>
                          <p className="text-sm text-gray-500">Set the system's default language</p>
                        </div>
                        <Select defaultValue="en">
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="bg-medical-primary" type="submit">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="users" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Users & Permissions</CardTitle>
                  <CardDescription>
                    Manage user roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 py-10 text-center">
                    User and permission management module is under development. Check back soon for detailed controls.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 py-10 text-center">
                    Security management module is under development. Check back soon for detailed controls.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure system-wide notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 py-10 text-center">
                    Notification management module is under development. Check back soon for detailed controls.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="email" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Manage system email templates and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 py-10 text-center">
                    Email template management module is under development. Check back soon for detailed controls.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
