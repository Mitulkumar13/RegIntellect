import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertClinicSchema, insertDeviceSchema, insertCptProfileSchema, type InsertClinic } from '@shared/schema';
import { classifyRadiologyModality, getCPTDescription } from '../lib/radiology-utils';

const router = Router();

// Get all clinics
router.get('/clinics', async (req, res) => {
  try {
    const clinics = await storage.getClinics();
    res.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// Get specific clinic
router.get('/clinics/:id', async (req, res) => {
  try {
    const clinic = await storage.getClinicById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
});

// Create new clinic
router.post('/clinics', async (req, res) => {
  try {
    const clinicData = insertClinicSchema.parse(req.body);
    const clinic = await storage.createClinic(clinicData);
    res.status(201).json(clinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid clinic data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// Update clinic onboarding status
router.patch('/clinics/:id', async (req, res) => {
  try {
    const updates = req.body;
    const clinic = await storage.updateClinic(req.params.id, updates);
    res.json(clinic);
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ error: 'Failed to update clinic' });
  }
});

// Get clinic devices
router.get('/clinics/:id/devices', async (req, res) => {
  try {
    const devices = await storage.getDevicesByClinic(req.params.id);
    res.json(devices);
  } catch (error) {
    console.error('Error fetching clinic devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Add device to clinic
router.post('/clinics/:id/devices', async (req, res) => {
  try {
    const deviceData = insertDeviceSchema.parse({
      ...req.body,
      clinicId: req.params.id,
      modalityType: req.body.modalityType || classifyRadiologyModality(req.body.model || req.body.manufacturer)
    });
    
    const device = await storage.createDevice(deviceData);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid device data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Bulk add devices
router.post('/clinics/:id/devices/bulk', async (req, res) => {
  try {
    const devicesData = req.body.devices.map((device: any) => 
      insertDeviceSchema.parse({
        ...device,
        clinicId: req.params.id,
        modalityType: device.modalityType || classifyRadiologyModality(device.model || device.manufacturer)
      })
    );
    
    const devices = await storage.bulkCreateDevices(devicesData);
    res.status(201).json(devices);
  } catch (error) {
    console.error('Error creating devices:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid devices data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create devices' });
  }
});

// Get clinic CPT profiles
router.get('/clinics/:id/cpt-profiles', async (req, res) => {
  try {
    const profiles = await storage.getCptProfilesByClinic(req.params.id);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching CPT profiles:', error);
    res.status(500).json({ error: 'Failed to fetch CPT profiles' });
  }
});

// Add CPT profile to clinic
router.post('/clinics/:id/cpt-profiles', async (req, res) => {
  try {
    const profileData = insertCptProfileSchema.parse({
      ...req.body,
      clinicId: req.params.id,
      description: req.body.description || getCPTDescription(req.body.cptCode)
    });
    
    const profile = await storage.createCptProfile(profileData);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating CPT profile:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid CPT profile data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create CPT profile' });
  }
});

// Bulk add CPT profiles
router.post('/clinics/:id/cpt-profiles/bulk', async (req, res) => {
  try {
    const profilesData = req.body.profiles.map((profile: any) => 
      insertCptProfileSchema.parse({
        ...profile,
        clinicId: req.params.id,
        description: profile.description || getCPTDescription(profile.cptCode)
      })
    );
    
    const profiles = await storage.bulkCreateCptProfiles(profilesData);
    res.status(201).json(profiles);
  } catch (error) {
    console.error('Error creating CPT profiles:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid CPT profiles data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create CPT profiles' });
  }
});

// Get clinic dashboard data
router.get('/clinics/:id/dashboard', async (req, res) => {
  try {
    const dashboardData = await storage.getClinicDashboardData(req.params.id);
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Complete onboarding step
router.post('/clinics/:id/complete-step', async (req, res) => {
  try {
    const { step } = req.body;
    const clinic = await storage.getClinicById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    let newStatus = clinic.onboardingStatus;
    
    switch (step) {
      case 'devices':
        newStatus = 'devices_added';
        break;
      case 'cpt':
        newStatus = 'cpt_added';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
    }
    
    const updatedClinic = await storage.updateClinic(req.params.id, { onboardingStatus: newStatus });
    res.json(updatedClinic);
  } catch (error) {
    console.error('Error completing onboarding step:', error);
    res.status(500).json({ error: 'Failed to complete onboarding step' });
  }
});

// Load sample clinic data (for demo purposes)
router.post('/clinics/load-sample', async (req, res) => {
  try {
    const sampleData = require('../../seed/sample-clinic.json');
    
    // Create clinic
    const clinic = await storage.createClinic(sampleData.clinic);
    
    // Add devices with clinic ID
    const devices = await storage.bulkCreateDevices(
      sampleData.devices.map((device: any) => ({ ...device, clinicId: clinic.id }))
    );
    
    // Add CPT profiles with clinic ID
    const cptProfiles = await storage.bulkCreateCptProfiles(
      sampleData.cptProfiles.map((profile: any) => ({ ...profile, clinicId: clinic.id }))
    );
    
    res.status(201).json({
      clinic,
      devicesCreated: devices.length,
      cptProfilesCreated: cptProfiles.length
    });
  } catch (error) {
    console.error('Error loading sample data:', error);
    res.status(500).json({ error: 'Failed to load sample data' });
  }
});

export default router;