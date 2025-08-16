import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { localStorage } from "@/lib/localStorage";
import { 
  Calculator, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Settings,
  FileText,
  Bell,
  Smartphone,
  Calendar,
  CheckSquare
} from "lucide-react";
import type { CPTVolume, UserPreferences } from "@/types";

export default function Tools() {
  const [cptVolumes, setCPTVolumes] = useState<CPTVolume[]>(() => localStorage.getCPTVolumes());
  const [preferences, setPreferences] = useState<UserPreferences>(() => localStorage.getPreferences());
  const [newCPT, setNewCPT] = useState({ code: '', volume: '', description: '' });
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = window.localStorage.getItem('radintel_checklist');
      return saved ? JSON.parse(saved) : [
        { id: 1, task: 'Review FDA device recalls', completed: false, dueDate: '2024-12-20' },
        { id: 2, task: 'Update contrast agent inventory', completed: false, dueDate: '2024-12-18' },
        { id: 3, task: 'Verify CPT code volumes', completed: true, dueDate: '2024-12-15' },
      ];
    } catch {
      return [];
    }
  });
  const { toast } = useToast();

  const addCPTVolume = () => {
    if (!newCPT.code || !newCPT.volume) {
      toast({
        title: "Missing information",
        description: "Please enter both CPT code and volume.",
        variant: "destructive",
      });
      return;
    }

    const volume: CPTVolume = {
      code: newCPT.code.toUpperCase(),
      volume: parseInt(newCPT.volume),
      description: newCPT.description || getCPTDescription(newCPT.code)
    };

    const updated = [...cptVolumes.filter(v => v.code !== volume.code), volume];
    setCPTVolumes(updated);
    localStorage.setCPTVolumes(updated);
    setNewCPT({ code: '', volume: '', description: '' });

    toast({
      title: "CPT volume added",
      description: `Added ${volume.code} with ${volume.volume} procedures/month.`,
    });
  };

  const removeCPTVolume = (code: string) => {
    const updated = cptVolumes.filter(v => v.code !== code);
    setCPTVolumes(updated);
    localStorage.setCPTVolumes(updated);

    toast({
      title: "CPT volume removed",
      description: `Removed ${code} from calculations.`,
    });
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    localStorage.setPreferences(updated);

    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const exportData = () => {
    try {
      const data = localStorage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `radintel-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        localStorage.importData(data);
        setCPTVolumes(localStorage.getCPTVolumes());
        setPreferences(localStorage.getPreferences());

        toast({
          title: "Data imported",
          description: "Your data has been successfully imported.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid file format. Please select a valid RadIntel export file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clearAll();
      setCPTVolumes([]);
      setPreferences({
        notifications: { email: true, sms: false, push: false },
        digest: { frequency: 'daily', time: '09:00' },
        contacts: { email: [], phone: [] },
        thresholds: { urgent: 85, informational: 75 },
        sources: { fda: true, cms: true, fedreg: true }
      });
      
      toast({
        title: "Data cleared",
        description: "All local data has been removed.",
      });
    }
  };

  const updateChecklist = (id: number, updates: any) => {
    const updated = checklist.map((item: any) => 
      item.id === id ? { ...item, ...updates } : item
    );
    setChecklist(updated);
    window.localStorage.setItem('radintel_checklist', JSON.stringify(updated));
  };

  const addChecklistItem = () => {
    const newItem = {
      id: Date.now(),
      task: 'New task',
      completed: false,
      dueDate: new Date().toISOString().split('T')[0]
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    window.localStorage.setItem('radintel_checklist', JSON.stringify(updated));
  };

  const removeChecklistItem = (id: number) => {
    const updated = checklist.filter((item: any) => item.id !== id);
    setChecklist(updated);
    window.localStorage.setItem('radintel_checklist', JSON.stringify(updated));
  };

  const getCPTDescription = (code: string): string => {
    const descriptions: Record<string, string> = {
      '70553': 'Brain MRI with contrast',
      '70552': 'Brain MRI without contrast',
      '70551': 'Brain MRI without and with contrast',
      '70450': 'CT head without contrast',
      '70460': 'CT head with contrast',
      '70470': 'CT head without and with contrast',
      '72148': 'MRI lumbar spine without contrast',
      '72149': 'MRI lumbar spine with contrast',
      '72158': 'MRI lumbar spine without and with contrast',
      '73721': 'MRI knee without contrast',
      '73722': 'MRI knee with contrast',
    };
    return descriptions[code] || '';
  };

  // Calculate financial impact
  const recentRateChanges = {
    '70553': { old: 287.45, new: 296.65 },
    '70552': { old: 245.32, new: 245.32 },
    '70551': { old: 189.87, new: 195.23 },
    '70450': { old: 156.43, new: 158.91 },
    '70460': { old: 198.76, new: 201.45 },
    '70470': { old: 234.21, new: 238.12 },
    '72148': { old: 312.45, new: 318.67 },
    '72149': { old: 389.12, new: 394.23 },
    '72158': { old: 445.67, new: 451.89 },
    '73721': { old: 278.90, new: 282.45 },
    '73722': { old: 334.55, new: 339.12 },
  };

  const calculateImpacts = () => {
    return cptVolumes.map(volume => {
      const rateChange = recentRateChanges[volume.code as keyof typeof recentRateChanges];
      
      if (!rateChange) {
        return {
          cptCode: volume.code,
          volume: volume.volume,
          oldRate: 0,
          newRate: 0,
          monthlyImpact: 0,
          annualImpact: 0,
        };
      }

      const monthlyImpact = (rateChange.new - rateChange.old) * volume.volume;
      
      return {
        cptCode: volume.code,
        volume: volume.volume,
        oldRate: rateChange.old,
        newRate: rateChange.new,
        monthlyImpact,
        annualImpact: monthlyImpact * 12,
      };
    });
  };

  const impacts = calculateImpacts();
  const totalMonthlyImpact = impacts.reduce((sum, impact) => sum + impact.monthlyImpact, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impact Tools</h1>
        <p className="text-gray-600 mt-2">
          Client-side tools for volume tracking, impact calculation, and workflow management
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Impact Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4" />
            <span>Workflow Checklist</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Data Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Financial Impact Calculator</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">
                      Monthly CPT Volumes (stored locally)
                    </Label>
                    <div className="space-y-2">
                      {cptVolumes.map((volume) => (
                        <div key={volume.code} className="flex items-center space-x-3">
                          <Input
                            value={volume.code}
                            readOnly
                            className="flex-1 bg-gray-50"
                          />
                          <Input
                            value={volume.volume}
                            readOnly
                            className="w-24 bg-gray-50"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCPTVolume(volume.code)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center space-x-3">
                          <Input
                            placeholder="CPT Code (e.g. 70553)"
                            value={newCPT.code}
                            onChange={(e) => setNewCPT(prev => ({ ...prev, code: e.target.value }))}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Volume"
                            type="number"
                            value={newCPT.volume}
                            onChange={(e) => setNewCPT(prev => ({ ...prev, volume: e.target.value }))}
                            className="w-24"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={addCPTVolume}
                            className="text-primary hover:text-primary/80"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Description (optional)"
                          value={newCPT.description}
                          onChange={(e) => setNewCPT(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Impact Summary</h4>
                  <div className="space-y-2 text-sm">
                    {impacts.map((impact) => (
                      <div key={impact.cptCode} className="flex justify-between">
                        <span className="text-gray-600">
                          {impact.cptCode} ({impact.volume} procedures):
                        </span>
                        <span className={`font-medium ${
                          impact.monthlyImpact > 0 ? 'text-green-600' : 
                          impact.monthlyImpact < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {impact.monthlyImpact === 0 ? '$0.00' : 
                           impact.monthlyImpact > 0 ? `+$${impact.monthlyImpact.toFixed(2)}` :
                           `-$${Math.abs(impact.monthlyImpact).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                    
                    {impacts.length > 0 && (
                      <>
                        <hr className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-900">Total Monthly Impact:</span>
                          <span className={
                            totalMonthlyImpact > 0 ? 'text-green-600' : 
                            totalMonthlyImpact < 0 ? 'text-red-600' : 'text-gray-600'
                          }>
                            {totalMonthlyImpact === 0 ? '$0.00' : 
                             totalMonthlyImpact > 0 ? `+$${totalMonthlyImpact.toFixed(2)}` :
                             `-$${Math.abs(totalMonthlyImpact).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Annual projection:</span>
                          <span>
                            {totalMonthlyImpact === 0 ? '$0.00' : 
                             totalMonthlyImpact > 0 ? `+$${(totalMonthlyImpact * 12).toFixed(2)}` :
                             `-$${Math.abs(totalMonthlyImpact * 12).toFixed(2)}`}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {impacts.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        Add CPT codes and volumes to see impact calculations
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Workflow Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklist.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => updateChecklist(item.id, { completed: e.target.checked })}
                      className="h-4 w-4 text-primary"
                    />
                    <Input
                      value={item.task}
                      onChange={(e) => updateChecklist(item.id, { task: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => updateChecklist(item.id, { dueDate: e.target.value })}
                      className="w-40"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addChecklistItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium">Email Alerts</Label>
                    <p className="text-xs text-gray-500">Receive alerts via email</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) => updatePreferences({ 
                    notifications: { ...preferences.notifications, email: checked }
                  })}
                />
              </div>

              {preferences.notifications.email && (
                <div className="ml-8 space-y-2">
                  <Label className="text-sm">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your.email@clinic.com"
                    value={preferences.contacts.email[0] || ''}
                    onChange={(e) => updatePreferences({ 
                      contacts: { ...preferences.contacts, email: [e.target.value] }
                    })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium">SMS Alerts</Label>
                    <p className="text-xs text-gray-500">Receive urgent alerts via SMS</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notifications.sms}
                  onCheckedChange={(checked) => updatePreferences({ 
                    notifications: { ...preferences.notifications, sms: checked }
                  })}
                />
              </div>

              {preferences.notifications.sms && (
                <div className="ml-8 space-y-2">
                  <Label className="text-sm">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={preferences.contacts.phone[0] || ''}
                    onChange={(e) => updatePreferences({ 
                      contacts: { ...preferences.contacts, phone: [e.target.value] }
                    })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <Label className="text-sm font-medium">Digest Frequency</Label>
                </div>
                <Select
                  value={preferences.digest.frequency}
                  onValueChange={(value: 'daily' | 'weekly') => updatePreferences({ 
                    digest: { ...preferences.digest, frequency: value }
                  })}
                >
                  <SelectTrigger className="ml-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Export / Import</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Backup your CPT volumes, preferences, and checklist data locally.
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <label className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-2">Privacy & Storage</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• All data is stored locally in your browser</p>
                  <p>• No PHI or clinic-specific information is sent to servers</p>
                  <p>• CPT volumes and preferences remain on your device</p>
                  <p>• Export data for backup before clearing browser data</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-2 text-red-600">Danger Zone</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Clear all locally stored data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={clearAllData}>
                  Clear All Local Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
