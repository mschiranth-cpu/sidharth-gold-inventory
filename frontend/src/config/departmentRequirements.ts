/**
 * ============================================
 * DEPARTMENT REQUIREMENTS CONFIGURATION
 * ============================================
 *
 * Defines requirements for each department including:
 * - Required form fields
 * - Required photos/images
 * - Required file uploads
 * - Validation rules
 * - Tips and common mistakes
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'textarea'
  | 'date'
  | 'checkbox'
  | 'file'
  | 'photo';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  min?: number; // For number fields
  max?: number; // For number fields
  minLength?: number; // For text fields
  maxLength?: number; // For text fields
  accept?: string; // For file fields
  helpText?: string;
  validation?: {
    pattern?: string;
    message?: string;
  };
}

export interface PhotoRequirement {
  name: string;
  label: string;
  description: string;
  required: boolean;
  examples?: string[]; // URLs to example images
  minCount?: number;
  maxCount?: number;
}

export interface FileRequirement {
  name: string;
  label: string;
  description: string;
  required: boolean;
  acceptedFormats: string[]; // e.g., ['.cad', '.dwg', '.pdf']
  maxSize?: number; // in MB
}

export interface DepartmentRequirement {
  departmentId: string;
  departmentName: string;
  description: string;
  formFields: FormField[];
  photoRequirements: PhotoRequirement[];
  fileRequirements: FileRequirement[];
  tips: string[];
  commonMistakes: string[];
  estimatedTime?: string; // e.g., "2-3 hours"
  requiredTools?: string[];
  isComingSoon?: boolean; // Feature flag for departments under development
  comingSoonMessage?: string; // Custom message to display when feature is disabled
}

// ============================================
// DEPARTMENT REQUIREMENTS
// ============================================

export const DEPARTMENT_REQUIREMENTS: Record<string, DepartmentRequirement> = {
  // ============================================
  // 1. CAD DESIGN STUDIO
  // ============================================
  CAD_DESIGN: {
    departmentId: 'CAD_DESIGN',
    departmentName: 'CAD Design Studio',
    description: 'Create 3D digital models and technical drawings for jewelry pieces',
    estimatedTime: '3-5 hours',
    requiredTools: ['CAD Software (Rhino/Matrix)', '3D Mouse', 'Reference Materials'],

    formFields: [
      {
        name: 'designSoftware',
        label: 'CAD Software Used',
        type: 'select',
        required: true,
        options: ['Rhino 3D', 'Matrix', 'JewelCAD', 'Blender', 'Other'],
        helpText: 'Select the primary software used for this design',
      },
      {
        name: 'modelWeight',
        label: 'Estimated Model Weight (grams)',
        type: 'number',
        required: true,
        min: 0.1,
        max: 1000,
        placeholder: 'e.g., 25.5',
        helpText: 'Estimated weight of the final piece in grams',
      },
      {
        name: 'dimensions',
        label: 'Dimensions (L x W x H in mm)',
        type: 'text',
        required: true,
        placeholder: 'e.g., 20 x 15 x 8',
        helpText: 'Overall dimensions of the piece',
      },
      {
        name: 'stoneSettings',
        label: 'Number of Stone Settings',
        type: 'number',
        required: false,
        min: 0,
        max: 500,
        placeholder: 'e.g., 12',
        helpText: 'Total number of stones to be set (if applicable)',
      },
      {
        name: 'designNotes',
        label: 'Design Notes',
        type: 'textarea',
        required: true,
        minLength: 20,
        maxLength: 1000,
        placeholder: 'Describe design choices, special features, customer requests...',
        helpText: 'Important details about the design for the next department',
      },
      {
        name: 'clientApproved',
        label: 'Client Design Approval Received',
        type: 'checkbox',
        required: true,
        helpText: 'Confirm that client has approved the final design',
      },
    ],

    photoRequirements: [
      {
        name: 'topView',
        label: 'Top View Render',
        description: '3D render showing top view of the design',
        required: true,
        minCount: 1,
        maxCount: 1,
      },
      {
        name: 'sideView',
        label: 'Side View Render',
        description: '3D render showing side profile',
        required: true,
        minCount: 1,
        maxCount: 1,
      },
      {
        name: 'perspectiveView',
        label: 'Perspective View Render',
        description: '3D render showing perspective/3D view',
        required: true,
        minCount: 1,
        maxCount: 1,
      },
      {
        name: 'detailViews',
        label: 'Detail Views (Optional)',
        description: 'Close-up renders of intricate details or stone settings',
        required: false,
        minCount: 0,
        maxCount: 5,
      },
    ],

    fileRequirements: [
      {
        name: 'cadFile',
        label: 'CAD Model File',
        description: 'Original CAD file (.3dm, .stl, .obj, or other CAD formats)',
        required: true,
        acceptedFormats: [
          '.3dm', // Rhino 3D
          '.stl', // Stereolithography
          '.obj', // Wavefront Object
          '.step', // STEP format
          '.stp', // STEP alternate
          '.iges', // IGES format
          '.igs', // IGES alternate
          '.dwg', // AutoCAD
          '.dwf', // Autodesk Design Web Format
          '.dxf', // Drawing Exchange Format
          '.fbx', // Autodesk Filmbox
          '.3ds', // 3D Studio Max
          '.blend', // Blender
          '.ply', // Polygon File Format
          '.dae', // COLLADA
          '.glb', // GL Transmission Format
          '.gltf', // GLTF
          '.x3d', // Extensible 3D
          '.wrl', // VRML
          '.amf', // Additive Manufacturing
          '.3mf', // 3D Manufacturing Format
          '.ipt', // Autodesk Inventor Part
          '.iam', // Autodesk Inventor Assembly
          '.prt', // CAD Part files
          '.asm', // CAD Assembly files
          '.sldprt', // SolidWorks Part
          '.sldasm', // SolidWorks Assembly
        ],
        maxSize: 50, // MB
      },
      {
        name: 'technicalDrawing',
        label: 'Technical Drawing (PDF)',
        description: 'Detailed technical drawing with dimensions',
        required: false,
        acceptedFormats: ['.pdf'],
        maxSize: 10,
      },
    ],

    tips: [
      'Ensure all dimensions match customer specifications exactly',
      'Check for printability - avoid thin walls below 0.6mm',
      'Verify stone setting sizes match actual stone dimensions',
      'Export STL files at high resolution (0.01mm tolerance)',
      'Include all design notes that affect manufacturing',
      'Double-check weight calculations for accurate pricing',
    ],

    commonMistakes: [
      'Not checking for overlapping surfaces',
      'Forgetting to boolean unite all parts',
      'Stone settings too small or too large',
      'Missing client approval before proceeding',
      'Not documenting design modifications',
      'Insufficient detail in renders for client review',
    ],
  },

  // ============================================
  // 2. 3D PRINTING LAB (OUTSOURCED)
  // ============================================
  '3D_PRINTING': {
    departmentId: '3D_PRINTING',
    departmentName: '3D Printing Lab',
    description: 'Outsource 3D printing to external printing company',
    estimatedTime: '1-2 days (outsourced)',
    requiredTools: [],
    isComingSoon: true, // Feature flag - when enabled, shows advanced in-house printing fields
    comingSoonMessage:
      'Advanced in-house 3D printing features (printer settings, materials, etc.) are coming soon. Currently using simplified outsourcing workflow.',

    formFields: [
      {
        name: 'outsourcedCompany',
        label: 'Printing Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter the name of the printing company',
        helpText: 'Name of the external company handling the 3D printing',
      },
      {
        name: 'receivedWeight',
        label: 'Received Model Weight (grams)',
        type: 'number',
        required: true,
        min: 0.1,
        max: 1000,
        placeholder: 'e.g., 25.5',
        helpText: 'Weight of the printed model after receiving from vendor',
      },
    ],

    photoRequirements: [
      {
        name: 'receivedModel',
        label: 'Received Printed Model',
        description: 'Photos of the printed model received from the vendor',
        required: true,
        minCount: 2,
        maxCount: 2,
      },
    ],

    fileRequirements: [],

    tips: [
      'Verify the printing company has good reviews and quality standards',
      'Check the received model for any defects or damage',
      'Weigh the model accurately upon receipt',
      'Take clear photos from multiple angles',
      'Communicate any quality issues to the vendor immediately',
    ],

    commonMistakes: [
      'Not inspecting the model thoroughly upon receipt',
      'Forgetting to document the vendor name',
      'Not taking required photos before proceeding',
      'Accepting damaged or defective prints',
    ],
  },

  // ============================================
  // 3. CASTING WORKSHOP
  // ============================================
  CASTING: {
    departmentId: 'CASTING',
    departmentName: 'Casting Workshop',
    description: 'Cast the design in precious metal using lost-wax casting process',
    estimatedTime: '6-10 hours (including burnout)',
    requiredTools: ['Casting Machine', 'Investment Plaster', 'Furnace', 'Crucible'],

    formFields: [
      {
        name: 'metalType',
        label: 'Metal Type',
        type: 'select',
        required: true,
        options: ['22K Gold', '18K Gold', '14K Gold', 'Silver 925', 'Platinum', 'Other'],
        helpText: 'Type of precious metal used for casting',
      },
      {
        name: 'metalWeight',
        label: 'Metal Weight Used (grams)',
        type: 'number',
        required: true,
        min: 0.1,
        max: 500,
        placeholder: 'e.g., 28.5',
      },
      {
        name: 'castingMethod',
        label: 'Casting Method',
        type: 'select',
        required: true,
        options: ['Centrifugal', 'Vacuum', 'Pressure', 'Gravity'],
        helpText: 'Casting technique used',
      },
      {
        name: 'flaskSize',
        label: 'Flask Size',
        type: 'text',
        required: true,
        placeholder: 'e.g., 3" or Medium',
        helpText: 'Enter the flask size used for casting',
      },
      {
        name: 'burnoutTemp',
        label: 'Burnout Temperature (°C)',
        type: 'number',
        required: false,
        min: 400,
        max: 800,
        placeholder: 'e.g., 650',
      },
      {
        name: 'burnoutTime',
        label: 'Burnout Time (hours)',
        type: 'number',
        required: false,
        min: 4,
        max: 24,
        placeholder: 'e.g., 8',
      },
      {
        name: 'castingTemp',
        label: 'Casting Temperature (°C)',
        type: 'number',
        required: false,
        min: 800,
        max: 1200,
        placeholder: 'e.g., 1050',
      },
      {
        name: 'castingNotes',
        label: 'Casting Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Any issues, observations, or special procedures...',
        maxLength: 500,
      },
      {
        name: 'castingSuccess',
        label: 'Casting Successful (No Porosity/Defects)',
        type: 'checkbox',
        required: true,
        helpText: 'Confirm casting completed without major defects',
      },
    ],

    photoRequirements: [
      {
        name: 'castedPiece',
        label: 'Casted Piece',
        description: 'Photos of the piece after casting and cleaning',
        required: true,
        minCount: 2,
        maxCount: 4,
      },
      {
        name: 'sprueAttachment',
        label: 'Sprue Attachment Point',
        description: 'Photo showing where sprue was attached (before cutting)',
        required: false,
        minCount: 0,
        maxCount: 2,
      },
    ],

    fileRequirements: [],

    tips: [
      'Weigh metal precisely to avoid waste',
      'Check flask temperature before casting',
      'Use proper investment ratio for clean casts',
      'Allow sufficient burnout time to avoid carbon residue',
      'Inspect for porosity immediately after quenching',
      'Document exact temperatures and times for quality control',
    ],

    commonMistakes: [
      'Insufficient burnout time causing carbon inclusion',
      'Incorrect metal temperature leading to incomplete fills',
      'Poor investment mixing causing rough surfaces',
      'Not preheating metal sufficiently',
      'Quenching too quickly causing cracks',
      'Using contaminated or old investment powder',
    ],
  },

  // ============================================
  // 4. FILLING & SHAPING
  // ============================================
  FILLING_SHAPING: {
    departmentId: 'FILLING_SHAPING',
    departmentName: 'Filling & Shaping',
    description: 'Remove casting imperfections and shape the piece to design specifications',
    estimatedTime: '3-6 hours',
    requiredTools: ['Files', 'Burrs', 'Sandpaper', 'Polishing Motor', 'Calipers'],

    formFields: [
      {
        name: 'sprueRemoval',
        label: 'Sprue Removal Method',
        type: 'select',
        required: true,
        options: ['Saw', 'File', 'Grinding Wheel', 'Laser Cut'],
      },
      {
        name: 'surfaceFinish',
        label: 'Surface Finish Achieved',
        type: 'select',
        required: true,
        options: ['Rough Filed', 'Medium Finish', 'Smooth Finish', 'Pre-polish'],
        helpText: 'Level of surface finishing completed',
      },
      {
        name: 'dimensionCheck',
        label: 'Dimensions Verified',
        type: 'checkbox',
        required: true,
        helpText: 'Confirmed dimensions match CAD specifications',
      },
      {
        name: 'weightAfterFiling',
        label: 'Weight After Filing (grams)',
        type: 'number',
        required: true,
        min: 0.1,
        max: 500,
        placeholder: 'e.g., 25.8',
      },
      {
        name: 'defectsFound',
        label: 'Defects Found',
        type: 'select',
        required: true,
        options: ['None', 'Minor Porosity', 'Surface Scratches', 'Shape Issues', 'Other'],
      },
      {
        name: 'defectsResolution',
        label: 'Defects Resolution',
        type: 'textarea',
        required: false,
        placeholder: 'How were defects addressed...',
        maxLength: 500,
      },
      {
        name: 'workNotes',
        label: 'Work Notes',
        type: 'textarea',
        required: true,
        placeholder: 'Describe filing work, areas that needed extra attention...',
        minLength: 20,
        maxLength: 500,
      },
    ],

    photoRequirements: [
      {
        name: 'afterFiling',
        label: 'After Filing Photos',
        description: 'Photos showing the piece after filing and shaping',
        required: true,
        minCount: 2,
        maxCount: 4,
      },
      {
        name: 'defectPhotos',
        label: 'Defect Photos (If Any)',
        description: 'Photos of any defects found during filing',
        required: false,
        minCount: 0,
        maxCount: 3,
      },
    ],

    fileRequirements: [],

    tips: [
      'Use coarse files first, then progress to finer grits',
      'File in one direction for consistent results',
      'Check dimensions frequently during filing',
      'Mark high spots with a marker before filing',
      'Use proper filing technique to avoid over-filing',
      'Keep work area clean to avoid contamination',
    ],

    commonMistakes: [
      'Filing too aggressively and removing too much material',
      'Not checking symmetry regularly',
      'Using worn-out files causing rough surfaces',
      'Damaging stone settings during filing',
      'Not removing all sprue marks completely',
      'Creating flat spots instead of smooth curves',
    ],
  },

  // ============================================
  // 5. MEENA ARTISTRY (ENAMELING)
  // ============================================
  MEENA_WORK: {
    departmentId: 'MEENA_WORK',
    departmentName: 'Meena Artistry',
    description: 'Apply traditional Meenakari (enamel) work on jewelry pieces',
    estimatedTime: '8-12 hours',
    requiredTools: ['Enamel Powder', 'Kiln', 'Fine Brushes', 'Spatula', 'Grinding Tools'],

    formFields: [
      {
        name: 'enamelColors',
        label: 'Enamel Colors Used',
        type: 'textarea',
        required: true,
        placeholder: 'List all colors used: e.g., Peacock Blue, Ruby Red, Emerald Green...',
        minLength: 10,
        maxLength: 300,
      },
      {
        name: 'designPattern',
        label: 'Design Pattern',
        type: 'select',
        required: true,
        options: ['Floral', 'Geometric', 'Traditional', 'Modern', 'Custom'],
      },
      {
        name: 'layersApplied',
        label: 'Number of Enamel Layers',
        type: 'number',
        required: true,
        min: 1,
        max: 10,
        placeholder: 'e.g., 3',
        helpText: 'Total number of enamel layers fired',
      },
      {
        name: 'firingTemp',
        label: 'Firing Temperature (°C)',
        type: 'number',
        required: true,
        min: 700,
        max: 900,
        placeholder: 'e.g., 800',
      },
      {
        name: 'firingTime',
        label: 'Firing Time per Layer (minutes)',
        type: 'number',
        required: true,
        min: 1,
        max: 30,
        placeholder: 'e.g., 5',
      },
      {
        name: 'meenaQuality',
        label: 'Meena Quality Check',
        type: 'select',
        required: true,
        options: ['Excellent', 'Good', 'Acceptable', 'Needs Rework'],
      },
      {
        name: 'artisanNotes',
        label: 'Artisan Notes',
        type: 'textarea',
        required: true,
        placeholder: 'Special techniques used, challenges faced, color combinations...',
        minLength: 30,
        maxLength: 600,
      },
    ],

    photoRequirements: [
      {
        name: 'meenaComplete',
        label: 'Completed Meena Work',
        description: 'Photos of the finished enamel work from multiple angles',
        required: true,
        minCount: 3,
        maxCount: 6,
      },
      {
        name: 'closeupDetails',
        label: 'Close-up Details',
        description: 'Macro photos showing enamel detail and quality',
        required: true,
        minCount: 2,
        maxCount: 4,
      },
      {
        name: 'progressPhotos',
        label: 'Progress Photos (Optional)',
        description: 'Photos showing stages of enamel application',
        required: false,
        minCount: 0,
        maxCount: 5,
      },
    ],

    fileRequirements: [],

    tips: [
      'Clean metal surface thoroughly before applying enamel',
      'Apply thin, even layers for best results',
      'Allow piece to cool completely between firings',
      'Use counter-enamel on reverse side for stability',
      'Grind enamel powder fresh for vivid colors',
      'Store enamel powders away from moisture',
    ],

    commonMistakes: [
      'Applying enamel too thickly causing bubbles',
      'Not cleaning surface properly before enameling',
      'Over-firing causing color changes',
      'Under-firing causing weak adhesion',
      'Mixing incompatible enamel types',
      'Not allowing sufficient cooling between layers',
    ],
  },

  // ============================================
  // 6. PRIMARY POLISH
  // ============================================
  PRIMARY_POLISH: {
    departmentId: 'PRIMARY_POLISH',
    departmentName: 'Primary Polish',
    description: 'Initial polishing to remove scratches and achieve base shine',
    estimatedTime: '2-4 hours',
    requiredTools: ['Polishing Motor', 'Compound Buffs', 'Tripoli', 'Rouge', 'Ultrasonic Cleaner'],

    formFields: [
      {
        name: 'polishingStages',
        label: 'Polishing Stages Completed',
        type: 'select',
        required: true,
        options: ['Tripoli Only', 'Tripoli + White Diamond', 'Tripoli + Rouge', 'Full 3-Stage'],
        helpText: 'Which polishing compounds were used',
      },
      {
        name: 'buffSpeed',
        label: 'Buff Speed (RPM)',
        type: 'select',
        required: true,
        options: ['Low (1500 RPM)', 'Medium (3000 RPM)', 'High (5000 RPM)'],
      },
      {
        name: 'timeSpent',
        label: 'Time Spent (minutes)',
        type: 'number',
        required: true,
        min: 10,
        max: 500,
        placeholder: 'e.g., 120',
      },
      {
        name: 'surfaceQuality',
        label: 'Surface Quality After Polish',
        type: 'select',
        required: true,
        options: ['Mirror Finish', 'High Shine', 'Medium Shine', 'Matte', 'Brushed'],
      },
      {
        name: 'scratches',
        label: 'Remaining Scratches',
        type: 'select',
        required: true,
        options: ['None', 'Minor', 'Moderate', 'Significant'],
      },
      {
        name: 'ultrasonicCleaning',
        label: 'Ultrasonic Cleaning Done',
        type: 'checkbox',
        required: true,
        helpText: 'Confirmed piece was cleaned in ultrasonic',
      },
      {
        name: 'polishNotes',
        label: 'Polish Notes',
        type: 'textarea',
        required: true,
        placeholder: 'Areas that needed extra attention, challenges...',
        minLength: 20,
        maxLength: 500,
      },
    ],

    photoRequirements: [
      {
        name: 'afterPolish',
        label: 'After Primary Polish',
        description: 'Photos showing the polished piece',
        required: true,
        minCount: 2,
        maxCount: 4,
      },
      {
        name: 'surfaceDetail',
        label: 'Surface Detail',
        description: 'Close-up showing polish quality and surface finish',
        required: true,
        minCount: 1,
        maxCount: 2,
      },
    ],

    fileRequirements: [],

    tips: [
      'Start with coarse compound and work to fine',
      'Use lighter pressure for delicate areas',
      'Keep buffs clean and free of contamination',
      'Polish in the direction of design details',
      "Don't over-polish thin areas",
      'Clean thoroughly between compound changes',
    ],

    commonMistakes: [
      'Using too much pressure causing heat damage',
      'Not cleaning between compound stages',
      'Over-polishing edges making them too rounded',
      'Contaminating fine compounds with coarse residue',
      'Not securing piece properly causing damage',
      'Polishing too fast in difficult areas',
    ],
  },

  // ============================================
  // 7. STONE SETTING
  // ============================================
  STONE_SETTING: {
    departmentId: 'STONE_SETTING',
    departmentName: 'Stone Setting',
    description: 'Set precious and semi-precious stones securely in the jewelry piece',
    estimatedTime: '3-8 hours (depending on stone count)',
    requiredTools: ['Setting Burrs', 'Prong Pushers', 'Stone Setter', 'Loupe', 'Tweezers'],

    formFields: [
      {
        name: 'stoneCount',
        label: 'Total Number of Stones Set',
        type: 'number',
        required: true,
        min: 0,
        max: 500,
        placeholder: 'e.g., 24',
      },
      {
        name: 'stoneTypes',
        label: 'Stone Types Used',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., 1 x 5mm Ruby (center), 20 x 1.5mm Diamonds (halo), 3 x 2mm Emeralds...',
        minLength: 10,
        maxLength: 500,
      },
      {
        name: 'settingStyle',
        label: 'Setting Style',
        type: 'select',
        required: true,
        options: ['Prong', 'Bezel', 'Channel', 'Pave', 'Flush', 'Mixed'],
      },
      {
        name: 'settingQuality',
        label: 'Setting Quality',
        type: 'select',
        required: true,
        options: ['Excellent', 'Good', 'Acceptable', 'Needs Review'],
      },
      {
        name: 'stoneAlignment',
        label: 'Stone Alignment Check',
        type: 'checkbox',
        required: true,
        helpText: 'All stones properly aligned and level',
      },
      {
        name: 'securityCheck',
        label: 'Security Check',
        type: 'checkbox',
        required: true,
        helpText: 'All stones securely set (wiggle test passed)',
      },
      {
        name: 'settingNotes',
        label: 'Setting Notes',
        type: 'textarea',
        required: true,
        placeholder: 'Any special techniques, challenges, stone replacements...',
        minLength: 20,
        maxLength: 600,
      },
    ],

    photoRequirements: [
      {
        name: 'overallSetting',
        label: 'Overall Stone Setting',
        description: 'Photos showing all stones from multiple angles',
        required: true,
        minCount: 3,
        maxCount: 6,
      },
      {
        name: 'closeupStones',
        label: 'Close-up of Key Stones',
        description: 'Macro photos of center stone and important settings',
        required: true,
        minCount: 2,
        maxCount: 4,
      },
    ],

    fileRequirements: [],

    tips: [
      'Verify stone sizes match settings before starting',
      'Use proper burr size for each stone',
      'Set center/important stones first',
      'Check stone security after each setting',
      'Inspect for chips or damage before setting',
      'Use gentle pressure to avoid cracking stones',
    ],

    commonMistakes: [
      'Using incorrect burr size creating loose settings',
      'Over-tightening prongs causing stone damage',
      'Not checking stone orientation',
      'Setting stones at uneven heights',
      'Damaging nearby stones during setting',
      'Not cleaning setting area before placing stone',
    ],
  },

  // ============================================
  // 8. FINAL POLISH
  // ============================================
  FINAL_POLISH: {
    departmentId: 'FINAL_POLISH',
    departmentName: 'Final Polish',
    description: 'Final polishing to achieve showroom-quality mirror finish',
    estimatedTime: '2-3 hours',
    requiredTools: [
      'Fine Polishing Buffs',
      'Rouge',
      'Green Rouge',
      'Steam Cleaner',
      'Microfiber Cloth',
    ],

    formFields: [
      {
        name: 'polishingCompounds',
        label: 'Final Polishing Compounds Used',
        type: 'select',
        required: true,
        options: ['Red Rouge', 'Green Rouge', 'White Diamond', 'Combination'],
      },
      {
        name: 'finishType',
        label: 'Final Finish Type',
        type: 'select',
        required: true,
        options: ['High Mirror', 'Satin', 'Brushed', 'Mixed (Mirror + Brushed)'],
      },
      {
        name: 'timeSpent',
        label: 'Time Spent (minutes)',
        type: 'number',
        required: true,
        min: 15,
        max: 300,
        placeholder: 'e.g., 90',
      },
      {
        name: 'stoneProtection',
        label: 'Stone Protection Used',
        type: 'checkbox',
        required: true,
        helpText: 'Confirmed stones were protected during polishing',
      },
      {
        name: 'steamCleaning',
        label: 'Steam Cleaning Completed',
        type: 'checkbox',
        required: true,
        helpText: 'Final steam cleaning done',
      },
      {
        name: 'finalQuality',
        label: 'Final Quality Assessment',
        type: 'select',
        required: true,
        options: ['Museum Quality', 'Excellent', 'Good', 'Acceptable', 'Needs Rework'],
      },
      {
        name: 'finalNotes',
        label: 'Final Polish Notes',
        type: 'textarea',
        required: true,
        placeholder: 'Final observations, special techniques used...',
        minLength: 20,
        maxLength: 500,
      },
    ],

    photoRequirements: [
      {
        name: 'finalPolished',
        label: 'Final Polished Piece',
        description: 'Professional photos of the completed piece',
        required: true,
        minCount: 4,
        maxCount: 8,
      },
      {
        name: 'detailShots',
        label: 'Detail Shots',
        description: 'Close-up showing polish quality and finish',
        required: true,
        minCount: 2,
        maxCount: 4,
      },
    ],

    fileRequirements: [],

    tips: [
      'Use very light pressure for final polish',
      'Protect stones with masking or wax',
      'Clean between each polishing stage',
      'Inspect under bright light for scratches',
      'Use separate buffs for each compound',
      'Handle with gloves after final polish',
    ],

    commonMistakes: [
      'Too much pressure creating heat spots',
      'Not protecting stones causing damage',
      'Cross-contaminating compounds',
      'Over-polishing delicate areas',
      'Not removing all compound residue',
      'Touching polished surface with bare hands',
    ],
  },

  // ============================================
  // 9. FINISHING TOUCH
  // ============================================
  FINISHING_TOUCH: {
    departmentId: 'FINISHING_TOUCH',
    departmentName: 'Finishing Touch',
    description: 'Final inspection, hallmarking, packaging, and quality assurance',
    estimatedTime: '1-2 hours',
    requiredTools: [
      'Loupe',
      'Scale',
      'Hallmarking Stamps',
      'Cleaning Solution',
      'Packaging Materials',
    ],

    formFields: [
      {
        name: 'finalWeight',
        label: 'Final Weight (grams)',
        type: 'number',
        required: true,
        min: 0.1,
        max: 500,
        placeholder: 'e.g., 24.8',
        helpText: 'Accurate weight after all work completed',
      },
      {
        name: 'hallmarkApplied',
        label: 'Hallmark Applied',
        type: 'checkbox',
        required: true,
        helpText: 'BIS hallmark stamped (if required)',
      },
      {
        name: 'qualityGrade',
        label: 'Overall Quality Grade',
        type: 'select',
        required: true,
        options: [
          'A+ (Exceptional)',
          'A (Excellent)',
          'B+ (Very Good)',
          'B (Good)',
          'C (Acceptable)',
        ],
      },
      {
        name: 'defectsFound',
        label: 'Final Inspection - Defects Found',
        type: 'select',
        required: true,
        options: ['None', 'Minor', 'Moderate', 'Major'],
      },
      {
        name: 'defectDetails',
        label: 'Defect Details (If Any)',
        type: 'textarea',
        required: false,
        placeholder: 'Describe any defects found...',
        maxLength: 500,
      },
      {
        name: 'customerSpecsMet',
        label: 'Customer Specifications Met',
        type: 'checkbox',
        required: true,
        helpText: 'Confirmed piece matches original customer order',
      },
      {
        name: 'packagingCompleted',
        label: 'Packaging Completed',
        type: 'checkbox',
        required: true,
        helpText: 'Piece properly packaged for delivery',
      },
      {
        name: 'certificateGenerated',
        label: 'Certificate/Invoice Generated',
        type: 'checkbox',
        required: false,
        helpText: 'Authenticity certificate created (if applicable)',
      },
      {
        name: 'finalNotes',
        label: 'Final Inspection Notes',
        type: 'textarea',
        required: true,
        placeholder: 'Overall assessment, delivery notes, special care instructions...',
        minLength: 30,
        maxLength: 800,
      },
    ],

    photoRequirements: [
      {
        name: 'finalProduct',
        label: 'Final Product Photos',
        description: 'Professional product photos from all angles',
        required: true,
        minCount: 5,
        maxCount: 10,
      },
      {
        name: 'hallmarkPhoto',
        label: 'Hallmark Photo',
        description: 'Close-up of BIS hallmark',
        required: true,
        minCount: 1,
        maxCount: 2,
      },
      {
        name: 'packagingPhoto',
        label: 'Packaging Photo',
        description: 'Photo of packaged piece ready for delivery',
        required: true,
        minCount: 1,
        maxCount: 2,
      },
    ],

    fileRequirements: [
      {
        name: 'certificate',
        label: 'Certificate of Authenticity (PDF)',
        description: 'Generated certificate document',
        required: false,
        acceptedFormats: ['.pdf'],
        maxSize: 5,
      },
    ],

    tips: [
      'Inspect under bright light and with loupe',
      'Verify weight matches expected range',
      'Check all stones are secure one final time',
      'Clean thoroughly before photographing',
      'Use proper packaging to prevent damage',
      'Document any variations from original specs',
    ],

    commonMistakes: [
      'Not performing thorough final inspection',
      'Missing hallmark or incorrect stamp',
      'Inaccurate weight recording',
      'Poor quality final photos',
      'Insufficient packaging protection',
      'Not documenting variations or modifications',
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get department requirements by department ID
 */
export const getDepartmentRequirements = (
  departmentId: string
): DepartmentRequirement | undefined => {
  return DEPARTMENT_REQUIREMENTS[departmentId];
};

/**
 * Get list of all department IDs
 */
export const getAllDepartmentIds = (): string[] => {
  return Object.keys(DEPARTMENT_REQUIREMENTS);
};

/**
 * Get department requirements by department name
 */
export const getDepartmentRequirementsByName = (
  departmentName: string
): DepartmentRequirement | undefined => {
  return Object.values(DEPARTMENT_REQUIREMENTS).find(
    (dept) => dept.departmentName.toLowerCase() === departmentName.toLowerCase()
  );
};

/**
 * Validate if all required fields are filled
 */
export const validateRequiredFields = (
  departmentId: string,
  formData: Record<string, any>
): { isValid: boolean; missingFields: string[] } => {
  const requirements = getDepartmentRequirements(departmentId);
  if (!requirements) {
    return { isValid: false, missingFields: ['Invalid department'] };
  }

  const missingFields: string[] = [];

  requirements.formFields.forEach((field) => {
    if (field.required && !formData[field.name]) {
      missingFields.push(field.label);
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Get total required photo count for a department
 */
export const getRequiredPhotoCount = (departmentId: string): number => {
  const requirements = getDepartmentRequirements(departmentId);
  if (!requirements) return 0;

  return requirements.photoRequirements
    .filter((photo) => photo.required)
    .reduce((sum, photo) => sum + (photo.minCount || 1), 0);
};

/**
 * Get total required file count for a department
 */
export const getRequiredFileCount = (departmentId: string): number => {
  const requirements = getDepartmentRequirements(departmentId);
  if (!requirements) return 0;

  return requirements.fileRequirements.filter((file) => file.required).length;
};
