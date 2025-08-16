import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, TrendingUp, TrendingDown, Minus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CPTVolume {
  code: string;
  description: string;
  modality: string;
  monthlyVolume: number;
  currentRate: number;
  newRate?: number;
}

const COMMON_CPT_CODES = {
  MRI: [
    { code: '70551', description: 'MRI Brain without contrast' },
    { code: '70553', description: 'MRI Brain with and without contrast' },
    { code: '72148', description: 'MRI Lumbar spine without contrast' },
    { code: '73721', description: 'MRI Joint lower extremity without contrast' },
  ],
  CT: [
    { code: '70450', description: 'CT Head without contrast' },
    { code: '71250', description: 'CT Chest without contrast' },
    { code: '74150', description: 'CT Abdomen without contrast' },
    { code: '72125', description: 'CT Cervical spine without contrast' },
  ],
  'X-Ray': [
    { code: '71045', description: 'Chest X-ray, single view' },
    { code: '71046', description: 'Chest X-ray, 2 views' },
    { code: '73610', description: 'Ankle X-ray, 3 views' },
    { code: '72100', description: 'Lumbar spine X-ray, 2-3 views' },
  ],
  Ultrasound: [
    { code: '76700', description: 'Abdominal ultrasound complete' },
    { code: '76856', description: 'Pelvic ultrasound complete' },
    { code: '93880', description: 'Carotid duplex scan' },
    { code: '76536', description: 'Head and neck ultrasound' },
  ],
  Mammography: [
    { code: '77067', description: 'Screening mammography, bilateral' },
    { code: '77066', description: 'Diagnostic mammography, bilateral' },
    { code: '77065', description: 'Diagnostic mammography, unilateral' },
  ],
};

export function CPTCalculator() {
  const [volumes, setVolumes] = useState<CPTVolume[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('MRI');
  const [selectedCPT, setSelectedCPT] = useState<string>('');
  const [monthlyVolume, setMonthlyVolume] = useState<string>('');
  const [currentRate, setCurrentRate] = useState<string>('');
  const [newRate, setNewRate] = useState<string>('');
  const { toast } = useToast();

  // Load saved volumes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cptVolumes');
    if (saved) {
      setVolumes(JSON.parse(saved));
    }
  }, []);

  // Save volumes to localStorage
  const saveVolumes = (newVolumes: CPTVolume[]) => {
    setVolumes(newVolumes);
    localStorage.setItem('cptVolumes', JSON.stringify(newVolumes));
  };

  const addCPT = () => {
    if (!selectedCPT || !monthlyVolume || !currentRate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const cptInfo = COMMON_CPT_CODES[selectedModality as keyof typeof COMMON_CPT_CODES]
      ?.find(c => c.code === selectedCPT);

    const newVolume: CPTVolume = {
      code: selectedCPT,
      description: cptInfo?.description || 'Custom CPT',
      modality: selectedModality,
      monthlyVolume: parseInt(monthlyVolume),
      currentRate: parseFloat(currentRate),
      newRate: newRate ? parseFloat(newRate) : undefined
    };

    const updated = [...volumes, newVolume];
    saveVolumes(updated);

    // Reset form
    setSelectedCPT('');
    setMonthlyVolume('');
    setCurrentRate('');
    setNewRate('');

    toast({
      title: 'CPT Added',
      description: `Added ${selectedCPT} to your volume tracker`
    });
  };

  const removeCPT = (code: string) => {
    const updated = volumes.filter(v => v.code !== code);
    saveVolumes(updated);
  };

  const calculateImpact = (volume: CPTVolume): number => {
    if (!volume.newRate) return 0;
    return (volume.newRate - volume.currentRate) * volume.monthlyVolume;
  };

  const calculatePercentChange = (volume: CPTVolume): number => {
    if (!volume.newRate) return 0;
    return ((volume.newRate - volume.currentRate) / volume.currentRate) * 100;
  };

  const totalMonthlyImpact = volumes.reduce((sum, v) => sum + calculateImpact(v), 0);
  const totalAnnualImpact = totalMonthlyImpact * 12;

  return (
    <div className="space-y-6">
      {/* Add CPT Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Add CPT Code Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Modality</Label>
              <Select value={selectedModality} onValueChange={setSelectedModality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COMMON_CPT_CODES).map(modality => (
                    <SelectItem key={modality} value={modality}>
                      {modality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>CPT Code</Label>
              <Select value={selectedCPT} onValueChange={setSelectedCPT}>
                <SelectTrigger>
                  <SelectValue placeholder="Select CPT" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CPT_CODES[selectedModality as keyof typeof COMMON_CPT_CODES]?.map(cpt => (
                    <SelectItem key={cpt.code} value={cpt.code}>
                      {cpt.code}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom CPT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Monthly Volume</Label>
              <Input 
                type="number" 
                placeholder="100"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(e.target.value)}
              />
            </div>

            <div>
              <Label>Current Rate ($)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="150.00"
                value={currentRate}
                onChange={(e) => setCurrentRate(e.target.value)}
              />
            </div>

            <div>
              <Label>New Rate ($)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="165.00"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={addCPT} className="mt-4">
            <Save className="h-4 w-4 mr-2" />
            Add CPT
          </Button>
        </CardContent>
      </Card>

      {/* Volume Table */}
      {volumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your CPT Volumes & Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPT Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead className="text-right">Monthly Vol</TableHead>
                  <TableHead className="text-right">Current Rate</TableHead>
                  <TableHead className="text-right">New Rate</TableHead>
                  <TableHead className="text-right">Change %</TableHead>
                  <TableHead className="text-right">Monthly Impact</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumes.map(volume => {
                  const impact = calculateImpact(volume);
                  const percentChange = calculatePercentChange(volume);
                  
                  return (
                    <TableRow key={volume.code}>
                      <TableCell className="font-medium">{volume.code}</TableCell>
                      <TableCell>{volume.description}</TableCell>
                      <TableCell>{volume.modality}</TableCell>
                      <TableCell className="text-right">{volume.monthlyVolume.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${volume.currentRate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {volume.newRate ? `$${volume.newRate.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {percentChange !== 0 && (
                          <div className={`flex items-center justify-end gap-1 ${
                            percentChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {percentChange > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : percentChange < 0 ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <Minus className="h-4 w-4" />
                            )}
                            {Math.abs(percentChange).toFixed(1)}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {impact !== 0 && (
                          <span className={impact > 0 ? 'text-green-600' : 'text-red-600'}>
                            {impact > 0 ? '+' : ''}{impact.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeCPT(volume.code)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total CPT Codes</p>
                  <p className="text-2xl font-bold">{volumes.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Impact</p>
                  <p className={`text-2xl font-bold ${totalMonthlyImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalMonthlyImpact >= 0 ? '+' : ''}{totalMonthlyImpact.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Impact</p>
                  <p className={`text-2xl font-bold ${totalAnnualImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalAnnualImpact >= 0 ? '+' : ''}{totalAnnualImpact.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {volumes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No CPT Volumes Added</h3>
            <p className="text-muted-foreground">
              Add your clinic's CPT code volumes to calculate financial impact of payment changes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}