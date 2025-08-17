// Radiology-specific utility functions for equipment classification and CPT code management

export function classifyRadiologyModality(deviceDescription: string): string {
  if (!deviceDescription) return 'Unknown';
  
  const desc = deviceDescription.toLowerCase();
  
  // CT Scanners
  if (desc.includes('ct') || desc.includes('computed tomography') || desc.includes('cat scan')) {
    return 'CT';
  }
  
  // MRI Scanners
  if (desc.includes('mri') || desc.includes('magnetic resonance') || desc.includes('nmr')) {
    return 'MRI';
  }
  
  // X-Ray Equipment
  if (desc.includes('x-ray') || desc.includes('radiograph') || desc.includes('chest unit') || desc.includes('portable x')) {
    return 'X-Ray';
  }
  
  // Mammography
  if (desc.includes('mammograph') || desc.includes('mammogram') || desc.includes('breast imaging')) {
    return 'Mammography';
  }
  
  // Ultrasound
  if (desc.includes('ultrasound') || desc.includes('sonograph') || desc.includes('doppler') || desc.includes('echo')) {
    return 'Ultrasound';
  }
  
  // Fluoroscopy
  if (desc.includes('fluoroscop') || desc.includes('c-arm') || desc.includes('image intensifier')) {
    return 'Fluoroscopy';
  }
  
  // Nuclear Medicine
  if (desc.includes('nuclear') || desc.includes('pet') || desc.includes('spect') || desc.includes('gamma camera')) {
    return 'Nuclear Medicine';
  }
  
  // Angiography
  if (desc.includes('angiograph') || desc.includes('catheter') || desc.includes('interventional')) {
    return 'Angiography';
  }
  
  // DEXA/Bone Densitometry
  if (desc.includes('dexa') || desc.includes('bone density') || desc.includes('densitometer')) {
    return 'DEXA';
  }
  
  // If it mentions imaging but doesn't match specific modalities
  if (desc.includes('imaging') || desc.includes('scanner') || desc.includes('detector')) {
    return 'Other Imaging';
  }
  
  return 'Unknown';
}

export function getCPTDescription(cptCode: string): string {
  const cptDescriptions: Record<string, string> = {
    // CT Codes
    '70450': 'CT head/brain without contrast',
    '70460': 'CT head/brain with contrast',
    '70470': 'CT head/brain without and with contrast',
    '70480': 'CT orbit/sella/fossa without contrast',
    '70481': 'CT orbit/sella/fossa with contrast',
    '70482': 'CT orbit/sella/fossa without and with contrast',
    '70486': 'CT maxillofacial area without contrast',
    '70487': 'CT maxillofacial area with contrast',
    '70488': 'CT maxillofacial area without and with contrast',
    '70490': 'CT soft tissue neck without contrast',
    '70491': 'CT soft tissue neck with contrast',
    '70492': 'CT soft tissue neck without and with contrast',
    '71250': 'CT thorax without contrast',
    '71260': 'CT thorax with contrast',
    '71270': 'CT thorax without and with contrast',
    '72125': 'CT cervical spine without contrast',
    '72126': 'CT cervical spine with contrast',
    '72127': 'CT cervical spine without and with contrast',
    '72128': 'CT thoracic spine without contrast',
    '72129': 'CT thoracic spine with contrast',
    '72130': 'CT thoracic spine without and with contrast',
    '72131': 'CT lumbar spine without contrast',
    '72132': 'CT lumbar spine with contrast',
    '72133': 'CT lumbar spine without and with contrast',
    '74150': 'CT abdomen without contrast',
    '74160': 'CT abdomen with contrast',
    '74170': 'CT abdomen without and with contrast',
    '74175': 'CT angiography abdomen',
    '74176': 'CT angiography abdomen and pelvis',
    '74177': 'CT angiography pelvis',
    '74178': 'CT angiography pelvis',
    '72192': 'CT pelvis without contrast',
    '72193': 'CT pelvis with contrast',
    '72194': 'CT pelvis without and with contrast',
    
    // MRI Codes
    '70551': 'MRI brain without contrast',
    '70552': 'MRI brain with contrast',
    '70553': 'MRI brain without and with contrast',
    '71550': 'MRI chest without contrast',
    '71551': 'MRI chest with contrast',
    '71552': 'MRI chest without and with contrast',
    '72141': 'MRI cervical spine without contrast',
    '72142': 'MRI cervical spine with contrast',
    '72148': 'MRI lumbar spine without contrast',
    '72149': 'MRI lumbar spine with contrast',
    '72156': 'MRI cervical spine without and with contrast',
    '72157': 'MRI thoracic spine without and with contrast',
    '72158': 'MRI lumbar spine without and with contrast',
    '74181': 'MRI abdomen without contrast',
    '74182': 'MRI abdomen with contrast',
    '74183': 'MRI abdomen without and with contrast',
    '72195': 'MRI pelvis without contrast',
    '72196': 'MRI pelvis with contrast',
    '72197': 'MRI pelvis without and with contrast',
    
    // X-Ray Codes
    '71045': 'Chest X-ray single view',
    '71046': 'Chest X-ray two views',
    '71047': 'Chest X-ray three views',
    '71048': 'Chest X-ray four or more views',
    '72020': 'Spine X-ray single view',
    '72040': 'Cervical spine X-ray 2-3 views',
    '72050': 'Cervical spine X-ray complete',
    '72070': 'Thoracic spine X-ray 2 views',
    '72072': 'Thoracic spine X-ray 3 views',
    '72074': 'Thoracic spine X-ray complete',
    '72100': 'Lumbar spine X-ray 2-3 views',
    '72110': 'Lumbar spine X-ray complete',
    '72114': 'Lumbar spine X-ray complete with bending',
    
    // Mammography Codes
    '77065': 'Diagnostic mammography unilateral',
    '77066': 'Diagnostic mammography bilateral',
    '77067': 'Screening mammography bilateral',
    
    // Ultrasound Codes
    '76700': 'Ultrasound abdomen complete',
    '76705': 'Ultrasound abdomen limited',
    '76770': 'Ultrasound retroperitoneal complete',
    '76775': 'Ultrasound retroperitoneal limited',
    '76801': 'Obstetrical ultrasound first trimester',
    '76805': 'Obstetrical ultrasound second/third trimester',
    '76811': 'Obstetrical ultrasound detailed fetal anatomy',
    '76815': 'Obstetrical ultrasound limited fetal anatomy',
    '76820': 'Doppler ultrasound umbilical vessels',
    '76825': 'Obstetrical ultrasound follow-up',
    '76830': 'Transvaginal ultrasound',
    
    // Nuclear Medicine Codes
    '78451': 'Myocardial perfusion imaging SPECT',
    '78452': 'Myocardial perfusion imaging SPECT with wall motion',
    '78453': 'Myocardial perfusion imaging planar',
    '78454': 'Myocardial perfusion imaging planar with wall motion',
    '78459': 'Myocardial perfusion imaging PET',
    '78608': 'Pulmonary perfusion imaging',
    '78803': 'Radiopharmaceutical localization tumor whole body',
    '78815': 'PET imaging tumor whole body',
    '78816': 'PET imaging tumor with CT whole body'
  };
  
  return cptDescriptions[cptCode] || `CPT Code ${cptCode}`;
}

export function getCaliforniaRegion(city: string, state: string): string {
  if (state !== 'CA' && state !== 'California') {
    return 'Statewide';
  }
  
  const cityLower = city.toLowerCase();
  
  // Northern California
  const northernCities = [
    'san francisco', 'oakland', 'san jose', 'sacramento', 'stockton', 'modesto',
    'santa rosa', 'vallejo', 'concord', 'berkeley', 'richmond', 'antioch',
    'daly city', 'san mateo', 'livermore', 'redwood city', 'mountain view',
    'alameda', 'union city', 'san leandro', 'milpitas', 'santa clara',
    'cupertino', 'palo alto', 'sunnyvale', 'fremont', 'pleasanton',
    'walnut creek', 'san rafael', 'petaluma', 'napa', 'fairfield'
  ];
  
  // Southern California
  const southernCities = [
    'los angeles', 'san diego', 'anaheim', 'santa ana', 'riverside', 'irvine',
    'chula vista', 'fremont', 'san bernardino', 'modesto', 'fontana', 'moreno valley',
    'huntington beach', 'glendale', 'santa clarita', 'garden grove', 'oceanside',
    'rancho cucamonga', 'ontario', 'corona', 'lancaster', 'elk grove', 'palmdale',
    'salinas', 'pomona', 'torrance', 'hayward', 'escondido', 'sunnyvale',
    'orange', 'fullerton', 'pasadena', 'thousand oaks', 'visalia', 'simi valley',
    'concord', 'roseville', 'santa rosa', 'compton', 'santa monica', 'el monte',
    'redding', 'mission viejo', 'westminster', 'newport beach', 'inglewood',
    'downey', 'costa mesa', 'carlsbad', 'temecula', 'antioch', 'daly city'
  ];
  
  // Central Valley
  const centralValleyCities = [
    'fresno', 'bakersfield', 'stockton', 'modesto', 'salinas', 'visalia',
    'clovis', 'tulare', 'hanford', 'delano', 'lodi', 'turlock', 'porterville',
    'merced', 'manteca', 'madera', 'atwater', 'tracy'
  ];
  
  if (northernCities.includes(cityLower)) {
    return 'Northern California';
  }
  
  if (southernCities.includes(cityLower)) {
    return 'Southern California';
  }
  
  if (centralValleyCities.includes(cityLower)) {
    return 'Central Valley';
  }
  
  return 'Statewide';
}

export function calculateRadiologyImpact(event: any): 'High' | 'Medium' | 'Low' {
  let impactScore = 0;
  
  // Device type impact
  const modalityType = event.modality_type || event.modalityType;
  if (modalityType) {
    switch (modalityType.toUpperCase()) {
      case 'CT':
      case 'MRI':
        impactScore += 3; // High-revenue, critical equipment
        break;
      case 'MAMMOGRAPHY':
      case 'NUCLEAR MEDICINE':
        impactScore += 2; // Specialized, compliance-critical
        break;
      case 'X-RAY':
      case 'FLUOROSCOPY':
        impactScore += 2; // High volume, essential
        break;
      case 'ULTRASOUND':
        impactScore += 1; // Lower impact but still important
        break;
    }
  }
  
  // Classification impact
  const classification = event.classification;
  if (classification) {
    if (classification.includes('Class I')) {
      impactScore += 3; // Most serious recalls
    } else if (classification.includes('Class II')) {
      impactScore += 2; // Serious but not immediately life-threatening
    } else if (classification.includes('Class III')) {
      impactScore += 1; // Minor issues
    }
  }
  
  // CPT code impact
  if (event.cpt_codes && event.cpt_codes.length > 0) {
    impactScore += 2; // Financial impact on procedures
  }
  
  // Financial delta impact
  if (event.delta && event.delta.old && event.delta.new) {
    const changePercent = Math.abs(((event.delta.new - event.delta.old) / event.delta.old) * 100);
    if (changePercent >= 10) {
      impactScore += 3;
    } else if (changePercent >= 5) {
      impactScore += 2;
    } else {
      impactScore += 1;
    }
  }
  
  // California relevance
  if (event.state === 'CA' || event.californiaRegion) {
    impactScore += 1;
  }
  
  // Determine impact level
  if (impactScore >= 8) return 'High';
  if (impactScore >= 4) return 'Medium';
  return 'Low';
}

export function getRadiologyCPTCodes(): string[] {
  return [
    // Diagnostic Radiology
    '70010', '70015', '70030', '70100', '70110', '70120', '70130', '70134', '70140', '70150',
    '70160', '70170', '70190', '70200', '70210', '70220', '70240', '70250', '70260', '70300',
    '70310', '70320', '70330', '70332', '70336', '70350', '70355', '70360', '70370', '70371',
    '70373', '70380', '70390', '70450', '70460', '70470', '70480', '70481', '70482', '70486',
    '70487', '70488', '70490', '70491', '70492', '70496', '70498', '70540', '70542', '70543',
    '70544', '70545', '70546', '70547', '70548', '70549', '70551', '70552', '70553', '70554',
    '70555', '71010', '71015', '71020', '71021', '71022', '71023', '71030', '71034', '71035',
    '71040', '71045', '71046', '71047', '71048', '71100', '71101', '71110', '71111', '71120',
    '71130', '71250', '71260', '71270', '71275', '71550', '71551', '71552', '71555', '72010',
    '72020', '72040', '72050', '72052', '72070', '72072', '72074', '72080', '72090', '72100',
    '72110', '72114', '72120', '72125', '72126', '72127', '72128', '72129', '72130', '72131',
    '72132', '72133', '72141', '72142', '72146', '72147', '72148', '72149', '72156', '72157',
    '72158', '72159', '72170', '72190', '72192', '72193', '72194', '72195', '72196', '72197',
    '72198', '72200', '72202', '72220', '72240', '72255', '72265', '72270', '72275', '72285',
    '72295', '73000', '73010', '73020', '73030', '73040', '73050', '73060', '73070', '73080',
    '73085', '73090', '73092', '73100', '73110', '73115', '73120', '73130', '73140', '73200',
    '73201', '73202', '73206', '73218', '73219', '73220', '73221', '73222', '73223', '73225',
    '74150', '74160', '74170', '74175', '74176', '74177', '74178', '74181', '74182', '74183',
    
    // Mammography
    '77065', '77066', '77067',
    
    // Nuclear Medicine
    '78012', '78013', '78014', '78015', '78016', '78018', '78020', '78070', '78071', '78072',
    '78075', '78099', '78102', '78103', '78104', '78110', '78111', '78120', '78121', '78122',
    '78130', '78135', '78140', '78185', '78190', '78191', '78195', '78199', '78201', '78202',
    '78205', '78206', '78215', '78216', '78226', '78227', '78230', '78231', '78232', '78258',
    '78261', '78262', '78264', '78267', '78268', '78270', '78271', '78272', '78278', '78282',
    '78290', '78291', '78299', '78300', '78305', '78306', '78315', '78320', '78350', '78351',
    '78399', '78414', '78428', '78445', '78451', '78452', '78453', '78454', '78456', '78457',
    '78458', '78459', '78466', '78468', '78469', '78472', '78473', '78481', '78483', '78491',
    '78492', '78494', '78496', '78499', '78579', '78580', '78582', '78597', '78598', '78599',
    '78600', '78601', '78605', '78606', '78607', '78608', '78609', '78610', '78630', '78635',
    '78645', '78647', '78650', '78660', '78699', '78700', '78701', '78707', '78708', '78709',
    '78710', '78725', '78730', '78740', '78761', '78799', '78800', '78801', '78802', '78803',
    '78804', '78805', '78806', '78807', '78808', '78811', '78812', '78813', '78814', '78815',
    '78816', '78890', '78891', '78999'
  ];
}

export function isRadiologyCPT(cptCode: string): boolean {
  const radiologyCodes = getRadiologyCPTCodes();
  return radiologyCodes.includes(cptCode);
}