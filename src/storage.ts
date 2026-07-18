import AsyncStorage from '@react-native-async-storage/async-storage';
import { Crop, WorkLog, PesticideLog } from './types';

const STORAGE_KEYS = {
  CROPS: 'crop_monitor_crops_v1',
  WORK_LOGS: 'crop_monitor_work_logs_v1',
  PESTICIDE_LOGS: 'crop_monitor_pesticide_logs_v1',
};

// Realistic mock data
const MOCK_CROPS: Crop[] = [
  {
    id: 'crop-1',
    name: 'East Field Roma Tomatoes',
    type: 'Tomatoes',
    variety: 'Roma Red',
    field: 'East Plot A',
    plantingDate: '2026-05-10',
    expectedHarvestDate: '2026-08-15',
    stage: 'Fruiting',
    notes: 'Good growth, showing flower clusters. Drip irrigation is fully functional.',
  },
  {
    id: 'crop-2',
    name: 'North Orchard Honeycrisp',
    type: 'Apples',
    variety: 'Honeycrisp',
    field: 'Orchard Section B',
    plantingDate: '2020-03-12', // Perennial
    expectedHarvestDate: '2026-10-01',
    stage: 'Vegetative',
    notes: 'Trees in their 6th year. Fruit set looks moderate. Pruning completed in spring.',
  },
  {
    id: 'crop-3',
    name: 'South Valley Wheat',
    type: 'Wheat',
    variety: 'Hard Red Winter',
    field: 'South Valley Flat',
    plantingDate: '2025-10-05',
    expectedHarvestDate: '2026-07-25',
    stage: 'Harvested',
    notes: 'Harvested with average yield of 65 bushels/acre. Soil preparation for rotation underway.',
  },
  {
    id: 'crop-4',
    name: 'Hillside Chardonnay Grapes',
    type: 'Grapes',
    variety: 'Chardonnay',
    field: 'Hillside Vineyards',
    plantingDate: '2018-04-20', // Perennial
    expectedHarvestDate: '2026-09-10',
    stage: 'Flowering',
    notes: 'Vineyard canopy management active. Showing uniform flowering across rows.',
  },
];

const MOCK_WORK_LOGS: WorkLog[] = [
  // Roma Tomatoes (crop-1)
  {
    id: 'work-101',
    cropId: 'crop-1',
    activityType: 'Planting',
    date: '2026-05-10',
    durationMinutes: 180,
    laborCost: 150.0,
    materialCost: 280.0, // Seedlings and stakes
    equipmentCost: 45.0, // Rototiller fuel
    totalCost: 475.0,
    notes: 'Planted 400 Roma seedlings. Setup wooden stakes and tied first rows.',
  },
  {
    id: 'work-102',
    cropId: 'crop-1',
    activityType: 'Irrigation',
    date: '2026-05-20',
    durationMinutes: 60,
    laborCost: 30.0,
    materialCost: 120.0, // Drip tape replacement
    equipmentCost: 10.0, // Pump running cost
    totalCost: 160.0,
    notes: 'Replaced torn drip tape sections and ran irrigation for 4 hours.',
  },
  {
    id: 'work-103',
    cropId: 'crop-1',
    activityType: 'Weeding',
    date: '2026-06-15',
    durationMinutes: 240,
    laborCost: 200.0,
    materialCost: 0.0,
    equipmentCost: 15.0, // Hand tools & brush cutter fuel
    totalCost: 215.0,
    notes: 'Cleared weeds in rows 1 to 10. Hand weeded around tomato bases.',
  },
  {
    id: 'work-104',
    cropId: 'crop-1',
    activityType: 'Spraying',
    date: '2026-07-02',
    durationMinutes: 90,
    laborCost: 75.0,
    materialCost: 65.0, // Organic copper fungicide
    equipmentCost: 20.0, // Backpack sprayer battery/charge & wear
    totalCost: 160.0,
    notes: 'Applied copper spray to prevent early blight after recent heavy rains.',
  },

  // Chardonnay Grapes (crop-4)
  {
    id: 'work-401',
    cropId: 'crop-4',
    activityType: 'Pruning',
    date: '2026-05-02',
    durationMinutes: 300,
    laborCost: 350.0,
    materialCost: 0.0,
    equipmentCost: 30.0, // Pruner sharpening & safety gear
    totalCost: 380.0,
    notes: 'Completed spring canopy thinning and shoot positioning on all vines.',
  },
  {
    id: 'work-402',
    cropId: 'crop-4',
    activityType: 'Spraying',
    date: '2026-06-10',
    durationMinutes: 120,
    laborCost: 100.0,
    materialCost: 95.0, // Sulphur powder
    equipmentCost: 40.0, // Tractor-mounted sprayer fuel
    totalCost: 235.0,
    notes: 'Applied preventive sulfur spray for powdery mildew during pre-bloom stage.',
  },

  // South Valley Wheat (crop-3)
  {
    id: 'work-301',
    cropId: 'crop-3',
    activityType: 'Tillage',
    date: '2025-10-02',
    durationMinutes: 360,
    laborCost: 250.0,
    materialCost: 0.0,
    equipmentCost: 320.0, // Tractor diesel & maintenance
    totalCost: 570.0,
    notes: 'Deep plowing and disc harrowing of the south 10-acre flat.',
  },
  {
    id: 'work-302',
    cropId: 'crop-3',
    activityType: 'Planting',
    date: '2025-10-05',
    durationMinutes: 240,
    laborCost: 180.0,
    materialCost: 850.0, // Certified seed wheat
    equipmentCost: 210.0, // Seed drill fuel
    totalCost: 1240.0,
    notes: 'Drilled winter wheat seed at 120 lbs/acre under optimal moisture conditions.',
  },
  {
    id: 'work-303',
    cropId: 'crop-3',
    activityType: 'Harvesting',
    date: '2026-07-15',
    durationMinutes: 480,
    laborCost: 600.0,
    materialCost: 0.0,
    equipmentCost: 750.0, // Combine harvester rental & fuel
    totalCost: 1350.0,
    notes: 'Combined the wheat crop. Grain moisture was at 12.8%. Delivered to silo.',
  },
];

const MOCK_PESTICIDE_LOGS: PesticideLog[] = [
  {
    id: 'pest-101',
    cropIds: ['crop-1'],
    pesticideName: 'BlightStop Copper Fungicide',
    dosage: '15ml per Litre of water',
    appliedQuantity: '20 Litres of mix',
    date: '2026-07-02',
  },
  {
    id: 'pest-401',
    cropIds: ['crop-4'],
    pesticideName: 'Microthiol Disperss',
    dosage: '4 kg / Hectare',
    appliedQuantity: '100 Litres spray volume',
    date: '2026-06-10',
  },
];

// Helper to check if database is empty and load default mock data
export const initializeDatabase = async (forceReset = false): Promise<void> => {
  try {
    if (forceReset) {
      await AsyncStorage.clear();
    }
    const crops = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
    if (!crops) {
      await AsyncStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(MOCK_CROPS));
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(MOCK_WORK_LOGS));
      await AsyncStorage.setItem(STORAGE_KEYS.PESTICIDE_LOGS, JSON.stringify(MOCK_PESTICIDE_LOGS));
      console.log('Database initialized with default mock data');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// Crop API
export const getCrops = async (): Promise<Crop[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error fetching crops:', e);
    return [];
  }
};

export const saveCrops = async (crops: Crop[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
  } catch (e) {
    console.error('Error saving crops:', e);
  }
};

export const addCrop = async (crop: Omit<Crop, 'id'>): Promise<Crop> => {
  const crops = await getCrops();
  const newCrop: Crop = {
    ...crop,
    id: `crop-${Date.now()}`,
  };
  crops.push(newCrop);
  await saveCrops(crops);
  return newCrop;
};

export const updateCrop = async (updatedCrop: Crop): Promise<void> => {
  const crops = await getCrops();
  const index = crops.findIndex((c) => c.id === updatedCrop.id);
  if (index !== -1) {
    crops[index] = updatedCrop;
    await saveCrops(crops);
  }
};

export const deleteCrop = async (cropId: string): Promise<void> => {
  const crops = await getCrops();
  const filtered = crops.filter((c) => c.id !== cropId);
  await saveCrops(filtered);

  // Clean up related logs
  const logs = await getWorkLogs();
  await saveWorkLogs(logs.filter((l) => l.cropId !== cropId));

  const pestLogs = await getPesticideLogs();
  const updatedPestLogs = pestLogs
    .map((p) => ({ ...p, cropIds: p.cropIds.filter((id) => id !== cropId) }))
    .filter((p) => p.cropIds.length > 0);
  await savePesticideLogs(updatedPestLogs);
};

// Work Log API
export const getWorkLogs = async (): Promise<WorkLog[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORK_LOGS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error fetching work logs:', e);
    return [];
  }
};

export const saveWorkLogs = async (logs: WorkLog[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving work logs:', e);
  }
};

export const addWorkLog = async (log: Omit<WorkLog, 'id' | 'totalCost'>): Promise<WorkLog> => {
  const logs = await getWorkLogs();
  const totalCost = Number(log.laborCost) + Number(log.materialCost) + Number(log.equipmentCost);
  const newLog: WorkLog = {
    ...log,
    id: `work-${Date.now()}`,
    totalCost,
  };
  logs.push(newLog);
  await saveWorkLogs(logs);
  return newLog;
};

export const deleteWorkLog = async (logId: string): Promise<void> => {
  const logs = await getWorkLogs();
  const filtered = logs.filter((l) => l.id !== logId);
  await saveWorkLogs(filtered);
};

// Pesticide Log API
export const getPesticideLogs = async (): Promise<PesticideLog[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PESTICIDE_LOGS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => {
      // Data normalization for legacy schemas
      if (item.cropId && !item.cropIds) {
        return {
          id: item.id,
          pesticideName: item.pesticideName,
          dosage: item.dosage,
          appliedQuantity: item.appliedQuantity || '',
          date: item.date,
          cropIds: [item.cropId],
        };
      }
      return item;
    });
  } catch (e) {
    console.error('Error fetching pesticide logs:', e);
    return [];
  }
};

export const savePesticideLogs = async (logs: PesticideLog[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PESTICIDE_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving pesticide logs:', e);
  }
};

export const addPesticideLog = async (log: Omit<PesticideLog, 'id'>): Promise<PesticideLog> => {
  const logs = await getPesticideLogs();
  const newLog: PesticideLog = {
    ...log,
    id: `pest-${Date.now()}`,
  };
  logs.push(newLog);
  await savePesticideLogs(logs);
  return newLog;
};

export const deletePesticideLog = async (logId: string): Promise<void> => {
  const logs = await getPesticideLogs();
  const filtered = logs.filter((l) => l.id !== logId);
  await savePesticideLogs(filtered);
};
