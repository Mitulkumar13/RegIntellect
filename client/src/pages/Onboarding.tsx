import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Building2, MonitorSpeaker, FileText, CheckCircle, Plus, X } from 'lucide-react';

const clinicSchema = z.object({
  name: z.string().min(1, 'Clinic name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().default('CA'),
  zipCode: z.string().min(5, 'Valid zip code required'),
  contactEmails: z.array(z.string().email()).min(1, 'At least one contact email is required'),
  timezone: z.string().default('America/Los_Angeles'),
  payerList: z.array(z.string()).optional(),
});

const deviceSchema = z.object({
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  serial: z.string().optional(),
  catalogCode: z.string().optional(),
  modalityType: z.string().min(1, 'Modality type is required'),
  dateInstalled: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});

const cptSchema = z.object({
  cptCode: z.string().min(5, 'Valid CPT code required'),
  description: z.string().optional(),
  yearlyVolume: z.number().min(1, 'Yearly volume must be greater than 0'),
  avgReimbursement: z.number().min(0, 'Average reimbursement cannot be negative'),
  payerMix: z.record(z.number()).optional(),
});

type ClinicFormData = z.infer<typeof clinicSchema>;
type DeviceFormData = z.infer<typeof deviceSchema>;
type CptFormData = z.infer<typeof cptSchema>;

const modalityTypes = [
  'CT', 'MRI', 'X-Ray', 'Mammography', 'Ultrasound', 
  'Fluoroscopy', 'Nuclear Medicine', 'Angiography', 'DEXA'
];

const commonPayers = [
  'Medicare', 'Medicaid', 'Blue Cross Blue Shield', 'Aetna', 'Cigna', 
  'UnitedHealthcare', 'Anthem', 'Kaiser Permanente', 'Commercial', 'Cash Pay'
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [emailInputs, setEmailInputs] = useState(['']);
  const [devices, setDevices] = useState<DeviceFormData[]>([]);
  const [cptProfiles, setCptProfiles] = useState<CptFormData[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clinicForm = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      state: 'CA',
      timezone: 'America/Los_Angeles',
      contactEmails: [''],
      payerList: []
    }
  });

  const deviceForm = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
  });

  const cptForm = useForm<CptFormData>({
    resolver: zodResolver(cptSchema),
  });

  const createClinicMutation = useMutation({
    mutationFn: async (data: ClinicFormData) => {
      const response = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create clinic');
      return response.json();
    },
    onSuccess: (clinic) => {
      setClinicId(clinic.id);
      setCurrentStep(2);
      toast({
        title: "Clinic Created",
        description: "Your clinic profile has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create clinic. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (device: DeviceFormData) => {
      const response = await fetch(`/api/clinics/${clinicId}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device)
      });
      if (!response.ok) throw new Error('Failed to add device');
      return response.json();
    },
    onSuccess: () => {
      deviceForm.reset();
      toast({
        title: "Device Added",
        description: "Equipment has been successfully added to your inventory.",
      });
    }
  });

  const addCptMutation = useMutation({
    mutationFn: async (cpt: CptFormData) => {
      const response = await fetch(`/api/clinics/${clinicId}/cpt-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpt)
      });
      if (!response.ok) throw new Error('Failed to add CPT profile');
      return response.json();
    },
    onSuccess: () => {
      cptForm.reset();
      toast({
        title: "CPT Profile Added",
        description: "Procedure code profile has been successfully added.",
      });
    }
  });

  const completeStepMutation = useMutation({
    mutationFn: async (step: string) => {
      const response = await fetch(`/api/clinics/${clinicId}/complete-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step })
      });
      if (!response.ok) throw new Error('Failed to complete step');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinics'] });
    }
  });

  const onSubmitClinic = (data: ClinicFormData) => {
    const processedData = {
      ...data,
      contactEmails: emailInputs.filter(email => email.length > 0)
    };
    createClinicMutation.mutate(processedData);
  };

  const onSubmitDevice = (data: DeviceFormData) => {
    setDevices([...devices, data]);
    addDeviceMutation.mutate(data);
  };

  const onSubmitCpt = (data: CptFormData) => {
    setCptProfiles([...cptProfiles, data]);
    addCptMutation.mutate(data);
  };

  const addEmailInput = () => {
    setEmailInputs([...emailInputs, '']);
  };

  const removeEmailInput = (index: number) => {
    setEmailInputs(emailInputs.filter((_, i) => i !== index));
  };

  const updateEmailInput = (index: number, value: string) => {
    const newEmails = [...emailInputs];
    newEmails[index] = value;
    setEmailInputs(newEmails);
  };

  const nextStep = () => {
    if (currentStep === 2 && devices.length === 0) {
      toast({
        title: "Add Equipment",
        description: "Please add at least one imaging device to continue.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 3 && cptProfiles.length === 0) {
      toast({
        title: "Add CPT Profiles",
        description: "Please add at least one CPT procedure profile to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < 4) {
      const stepMapping = { 2: 'devices', 3: 'cpt', 4: 'complete' };
      if (stepMapping[currentStep as keyof typeof stepMapping]) {
        completeStepMutation.mutate(stepMapping[currentStep as keyof typeof stepMapping]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const getProgress = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to RadIntel CA</h1>
        <p className="text-muted-foreground">
          Let's set up your radiology clinic for comprehensive compliance monitoring
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Progress value={getProgress()} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round(getProgress())}% Complete</span>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Clinic Information</span>
            </CardTitle>
            <CardDescription>
              Tell us about your radiology clinic and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...clinicForm}>
              <form onSubmit={clinicForm.handleSubmit(onSubmitClinic)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={clinicForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="clinic-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={clinicForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="clinic-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={clinicForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="clinic-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={clinicForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted" />
                        </FormControl>
                        <FormDescription>Currently focused on California</FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={clinicForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="clinic-zipcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Emails</Label>
                  {emailInputs.map((email, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmailInput(index, e.target.value)}
                        placeholder="contact@clinic.com"
                        data-testid={`email-input-${index}`}
                      />
                      {emailInputs.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeEmailInput(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmailInput}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Email
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createClinicMutation.isPending}
                  data-testid="submit-clinic"
                >
                  {createClinicMutation.isPending ? "Creating..." : "Continue"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MonitorSpeaker className="h-5 w-5" />
                <span>Equipment Inventory</span>
              </CardTitle>
              <CardDescription>
                Add your radiology equipment for targeted compliance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...deviceForm}>
                <form onSubmit={deviceForm.handleSubmit(onSubmitDevice)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={deviceForm.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="GE Healthcare" data-testid="device-manufacturer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={deviceForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Revolution CT" data-testid="device-model" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={deviceForm.control}
                      name="modalityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modality Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="device-modality">
                                <SelectValue placeholder="Select modality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {modalityTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={deviceForm.control}
                      name="serial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SN123456789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={addDeviceMutation.isPending}
                    data-testid="add-device"
                  >
                    {addDeviceMutation.isPending ? "Adding..." : "Add Device"}
                  </Button>
                </form>
              </Form>

              {devices.length > 0 && (
                <div className="mt-6 space-y-2">
                  <Label>Added Devices ({devices.length})</Label>
                  <div className="grid gap-2">
                    {devices.map((device, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{device.manufacturer} {device.model}</p>
                          <p className="text-sm text-muted-foreground">{device.modalityType}</p>
                        </div>
                        <Badge variant="outline">Added</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={nextStep} data-testid="continue-to-cpt">
              Continue
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>CPT Code Profiles</span>
              </CardTitle>
              <CardDescription>
                Configure your procedure codes for financial impact monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...cptForm}>
                <form onSubmit={cptForm.handleSubmit(onSubmitCpt)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={cptForm.control}
                      name="cptCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPT Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="70450" data-testid="cpt-code" />
                          </FormControl>
                          <FormDescription>5-digit procedure code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={cptForm.control}
                      name="yearlyVolume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yearly Volume</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="250"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="cpt-volume"
                            />
                          </FormControl>
                          <FormDescription>Annual procedure count</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={cptForm.control}
                    name="avgReimbursement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Reimbursement ($)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="296.65"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="cpt-reimbursement"
                          />
                        </FormControl>
                        <FormDescription>Average payment per procedure</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={addCptMutation.isPending}
                    data-testid="add-cpt"
                  >
                    {addCptMutation.isPending ? "Adding..." : "Add CPT Profile"}
                  </Button>
                </form>
              </Form>

              {cptProfiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <Label>Added CPT Profiles ({cptProfiles.length})</Label>
                  <div className="grid gap-2">
                    {cptProfiles.map((cpt, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">CPT {cpt.cptCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {cpt.yearlyVolume} procedures/year • ${cpt.avgReimbursement} avg
                          </p>
                        </div>
                        <Badge variant="outline">Added</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button onClick={nextStep} data-testid="complete-onboarding">
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <Card>
          <CardContent className="text-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Setup Complete!</h2>
              <p className="text-muted-foreground">
                Your RadIntel CA profile is now configured and monitoring has begun.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-left space-y-2">
              <h3 className="font-semibold">What's Next:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• We'll monitor FDA, CMS, and CA regulatory sources for you</li>
                <li>• Alerts will be sent to your registered email addresses</li>
                <li>• Your dashboard will show compliance deadlines and equipment advisories</li>
                <li>• Financial impact analysis will track CPT code changes</li>
              </ul>
            </div>
            <Button size="lg" data-testid="go-to-dashboard">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}