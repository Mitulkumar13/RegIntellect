import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bell, Smartphone, Mail, Shield, Plus, X, Save } from 'lucide-react';

interface DeviceConfig {
  id: string;
  manufacturer: string;
  model: string;
  modality: string;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  urgentEmail: boolean;
  urgentSMS: boolean;
  informationalEmail: boolean;
  informationalSMS: boolean;
  digestEmail: boolean;
  vendorAdvisoriesEmail: boolean;
  californiaOnly: boolean;
  emailAddress: string;
  phoneNumber: string;
}

const COMMON_DEVICES = {
  MRI: [
    { manufacturer: 'GE', models: ['SIGNA Premier', 'SIGNA Artist', 'SIGNA Explorer'] },
    { manufacturer: 'Siemens', models: ['MAGNETOM Vida', 'MAGNETOM Sola', 'MAGNETOM Lumina'] },
    { manufacturer: 'Philips', models: ['Ingenia Ambition', 'Ingenia Elition', 'Prodiva'] },
  ],
  CT: [
    { manufacturer: 'GE', models: ['Revolution Apex', 'Revolution CT', 'Optima CT660'] },
    { manufacturer: 'Siemens', models: ['SOMATOM Force', 'SOMATOM Drive', 'SOMATOM go.'] },
    { manufacturer: 'Canon', models: ['Aquilion ONE', 'Aquilion Prime SP', 'Aquilion Lightning'] },
  ],
  Mammography: [
    { manufacturer: 'Hologic', models: ['3Dimensions', 'Selenia Dimensions', 'Affirm'] },
    { manufacturer: 'GE', models: ['Senographe Pristina', 'Senographe Essential'] },
    { manufacturer: 'Fujifilm', models: ['ASPIRE Cristalle', 'ASPIRE HD Plus'] },
  ],
};

export default function Settings() {
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: false,
    urgentEmail: true,
    urgentSMS: false,
    informationalEmail: true,
    informationalSMS: false,
    digestEmail: true,
    vendorAdvisoriesEmail: false,
    californiaOnly: true,
    emailAddress: '',
    phoneNumber: '',
  });
  const [selectedModality, setSelectedModality] = useState('MRI');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const { toast } = useToast();

  // Load saved settings from localStorage
  useEffect(() => {
    const savedDevices = localStorage.getItem('userDevices');
    const savedPreferences = localStorage.getItem('notificationPreferences');
    
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices));
    }
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const saveDevices = (newDevices: DeviceConfig[]) => {
    setDevices(newDevices);
    localStorage.setItem('userDevices', JSON.stringify(newDevices));
  };

  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
  };

  const addDevice = () => {
    if (!selectedManufacturer || (!selectedModel && !customModel)) {
      toast({
        title: 'Missing Information',
        description: 'Please select manufacturer and model',
        variant: 'destructive',
      });
      return;
    }

    const newDevice: DeviceConfig = {
      id: `${Date.now()}`,
      manufacturer: selectedManufacturer,
      model: customModel || selectedModel,
      modality: selectedModality,
    };

    const updated = [...devices, newDevice];
    saveDevices(updated);

    // Reset form
    setSelectedModel('');
    setCustomModel('');

    toast({
      title: 'Device Added',
      description: `Added ${newDevice.manufacturer} ${newDevice.model} to your inventory`,
    });
  };

  const removeDevice = (id: string) => {
    const updated = devices.filter(d => d.id !== id);
    saveDevices(updated);
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    savePreferences(updated);
  };

  const handleSaveAll = () => {
    // This would normally save to backend
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your devices, notification preferences, and alert settings
        </p>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices & Modalities</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Device to Your Inventory</CardTitle>
              <CardDescription>
                Track specific devices to receive targeted alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Modality</Label>
                  <Select value={selectedModality} onValueChange={setSelectedModality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MRI">MRI</SelectItem>
                      <SelectItem value="CT">CT</SelectItem>
                      <SelectItem value="Mammography">Mammography</SelectItem>
                      <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="PET">PET</SelectItem>
                      <SelectItem value="Nuclear">Nuclear Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Manufacturer</Label>
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_DEVICES[selectedModality as keyof typeof COMMON_DEVICES]?.map(mfr => (
                        <SelectItem key={mfr.manufacturer} value={mfr.manufacturer}>
                          {mfr.manufacturer}
                        </SelectItem>
                      )) || (
                        <>
                          <SelectItem value="GE">GE</SelectItem>
                          <SelectItem value="Siemens">Siemens</SelectItem>
                          <SelectItem value="Philips">Philips</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Model</Label>
                  {selectedManufacturer === 'Other' ? (
                    <Input
                      placeholder="Enter model name"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                    />
                  ) : (
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_DEVICES[selectedModality as keyof typeof COMMON_DEVICES]
                          ?.find(m => m.manufacturer === selectedManufacturer)
                          ?.models.map(model => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        <SelectItem value="other">Other (custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-end">
                  <Button onClick={addDevice} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              </div>

              {selectedModel === 'other' && (
                <div className="mt-4">
                  <Label>Custom Model Name</Label>
                  <Input
                    placeholder="Enter custom model name"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {devices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Device Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {devices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{device.manufacturer} {device.model}</span>
                        <span className="text-sm text-muted-foreground ml-2">({device.modality})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDevice(device.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure how you receive email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Address</Label>
                  <p className="text-sm text-muted-foreground">Primary email for alerts</p>
                </div>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={preferences.emailAddress}
                  onChange={(e) => updatePreference('emailAddress', e.target.value)}
                  className="w-64"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Urgent Alerts</Label>
                    <p className="text-sm text-muted-foreground">Immediate notification for critical items</p>
                  </div>
                  <Switch
                    checked={preferences.urgentEmail}
                    onCheckedChange={(checked) => updatePreference('urgentEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Informational Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important but non-critical updates</p>
                  </div>
                  <Switch
                    checked={preferences.informationalEmail}
                    onCheckedChange={(checked) => updatePreference('informationalEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">Summary of all daily updates</p>
                  </div>
                  <Switch
                    checked={preferences.digestEmail}
                    onCheckedChange={(checked) => updatePreference('digestEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vendor Advisories</Label>
                    <p className="text-sm text-muted-foreground">Security and firmware updates</p>
                  </div>
                  <Switch
                    checked={preferences.vendorAdvisoriesEmail}
                    onCheckedChange={(checked) => updatePreference('vendorAdvisoriesEmail', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications (Coming Soon)</CardTitle>
              <CardDescription>Configure SMS alerts for urgent items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Phone Number</Label>
                  <p className="text-sm text-muted-foreground">For SMS alerts</p>
                </div>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  disabled
                  className="w-64"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>Customize how alerts are filtered and displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>California Only</Label>
                  <p className="text-sm text-muted-foreground">Show only California-specific regulations</p>
                </div>
                <Switch
                  checked={preferences.californiaOnly}
                  onCheckedChange={(checked) => updatePreference('californiaOnly', checked)}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">CPT Code Thresholds</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Urgent Alert Threshold</Label>
                      <p className="text-sm text-muted-foreground">≥10% change (default)</p>
                    </div>
                    <div>
                      <Label>Informational Threshold</Label>
                      <p className="text-sm text-muted-foreground">5-9.9% change (default)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Deadline Reminders</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Get reminded about compliance deadlines at T-7 and T-1 days
                </p>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveAll} size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}