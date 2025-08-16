import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { localStorage } from "@/lib/localStorage";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import type { CPTVolume, ImpactCalculation } from "@/types";

export default function ImpactCalculator() {
  const [cptVolumes, setCPTVolumes] = useState<CPTVolume[]>(() => localStorage.getCPTVolumes());
  const [newCPT, setNewCPT] = useState({ code: '', volume: '' });
  const { toast } = useToast();

  // Sample rate changes for demonstration
  const recentRateChanges = useMemo(() => ({
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
  }), []);

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
      description: getCPTDescription(newCPT.code)
    };

    const updated = [...cptVolumes.filter(v => v.code !== volume.code), volume];
    setCPTVolumes(updated);
    localStorage.setCPTVolumes(updated);
    setNewCPT({ code: '', volume: '' });

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

  const calculateImpacts = (): ImpactCalculation[] => {
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
    return descriptions[code] || 'Unknown procedure';
  };

  const impacts = calculateImpacts();
  const totalMonthlyImpact = impacts.reduce((sum, impact) => sum + impact.monthlyImpact, 0);
  const totalAnnualImpact = totalMonthlyImpact * 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Impact Calculator</CardTitle>
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
                      className="flex-1"
                    />
                    <Input
                      value={volume.volume}
                      readOnly
                      className="w-24"
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
                
                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="CPT Code"
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
              </div>
              
              <div className="flex space-x-2 mt-4">
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
                      {totalAnnualImpact === 0 ? '$0.00' : 
                       totalAnnualImpact > 0 ? `+$${totalAnnualImpact.toFixed(2)}` :
                       `-$${Math.abs(totalAnnualImpact).toFixed(2)}`}
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
  );
}
