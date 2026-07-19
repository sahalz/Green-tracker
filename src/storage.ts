import AsyncStorage from '@react-native-async-storage/async-storage';
import { Crop, WorkLog, PesticideLog } from './types';

const STORAGE_KEYS = {
  CROPS: 'crop_monitor_crops_v3',
  WORK_LOGS: 'crop_monitor_work_logs_v3',
  PESTICIDE_LOGS: 'crop_monitor_pesticide_logs_v3',
};

// Realistic perennial crop mock data (Pepper & Cardamom only)
const MOCK_CROPS: Crop[] = [
  {
    id: 'crop-1',
    name: 'Hillside Pepper Plot',
    type: 'Pepper',
    variety: 'Panniyur-1',
    field: 'North-East Slope',
    plantingDate: '2021-05-15',
    expectedHarvestDate: '2026-12-10',
    stage: 'Fruiting',
    notes: 'Black pepper vines are in their 5th year. Growing on Glyricidia standards. Canopy density is good.',
  },
  {
    id: 'crop-2',
    name: 'Valley View Cardamom',
    type: 'Cardamom',
    variety: 'NJallani',
    field: 'Shade Valley Plot A',
    plantingDate: '2023-09-20',
    expectedHarvestDate: '2026-11-30',
    stage: 'Flowering',
    notes: 'High-yield NJallani cardamom clones. Needs active shade regulation and weed trashing. Basin mulching completed.',
  },
];

const MOCK_WORK_LOGS: WorkLog[] = [
  // Hillside Pepper (crop-1)
  {
    id: 'work-101',
    cropId: 'crop-1',
    activityType: 'Planting',
    date: '2021-05-15',
    durationMinutes: 360,
    laborCost: 8000.0,
    materialCost: 5000.0, // Cuttings & compost
    equipmentCost: 1500.0, // Pit digger rental
    totalCost: 14500.0,
    notes: 'Planted 150 Panniyur-1 pepper cuttings near support standard trees.',
    noOfWorkers: 16,
    laborCostPerWorker: 500.0,
  },
  {
    id: 'work-102',
    cropId: 'crop-1',
    activityType: 'Vine Tying',
    date: '2025-06-10',
    durationMinutes: 180,
    laborCost: 3000.0,
    materialCost: 500.0, // Jute twines
    equipmentCost: 0.0,
    totalCost: 3500.0,
    notes: 'Tied growing pepper vines to support trees using eco-friendly jute twines.',
    noOfWorkers: 6,
    laborCostPerWorker: 500.0,
  },
  {
    id: 'work-103',
    cropId: 'crop-1',
    activityType: 'Harvesting',
    date: '2026-02-10',
    durationMinutes: 480,
    laborCost: 4000.0,
    materialCost: 0.0,
    equipmentCost: 1000.0, // Drying mats & thresher
    totalCost: 5000.0,
    notes: 'Harvested black pepper berries. Dried under sun on mats.',
    yieldKg: 120,
    income: 72000.0,
    noOfWorkers: 8,
    laborCostPerWorker: 500.0,
  },
  {
    id: 'work-104',
    cropId: 'crop-1',
    activityType: 'Spraying',
    date: '2026-07-02',
    durationMinutes: 120,
    laborCost: 1200.0,
    materialCost: 800.0, // Fungicide
    equipmentCost: 500.0, // Sprayer fuel
    totalCost: 2500.0,
    notes: 'Applied copper oxychloride to prevent quick wilt (foot rot) after monsoon onset.',
    noOfWorkers: 2,
    laborCostPerWorker: 600.0,
  },

  // Valley View Cardamom (crop-2)
  {
    id: 'work-201',
    cropId: 'crop-2',
    activityType: 'Planting',
    date: '2023-09-20',
    durationMinutes: 400,
    laborCost: 10000.0,
    materialCost: 12000.0, // NJallani suckers
    equipmentCost: 2000.0,
    totalCost: 24000.0,
    notes: 'Completed cardomom sucker planting in rows across Shade Valley Plot A.',
    noOfWorkers: 20,
    laborCostPerWorker: 500.0,
  },
  {
    id: 'work-202',
    cropId: 'crop-2',
    activityType: 'Shade Regulation',
    date: '2026-05-20',
    durationMinutes: 240,
    laborCost: 5000.0,
    materialCost: 0.0,
    equipmentCost: 2000.0, // Chainsaw fuel
    totalCost: 7000.0,
    notes: 'Pruned branches of shade trees to allow 40-50% light penetration during monsoon.',
    noOfWorkers: 5,
    laborCostPerWorker: 1000.0,
  },
  {
    id: 'work-203',
    cropId: 'crop-2',
    activityType: 'Trashing',
    date: '2026-06-15',
    durationMinutes: 300,
    laborCost: 4000.0,
    materialCost: 0.0,
    equipmentCost: 0.0,
    totalCost: 4000.0,
    notes: 'Cleared dry leaves and old tillers around cardamom clumps. Cleared basins.',
    noOfWorkers: 8,
    laborCostPerWorker: 500.0,
  },
  {
    id: 'work-204',
    cropId: 'crop-2',
    activityType: 'Harvesting',
    date: '2026-07-15',
    durationMinutes: 480,
    laborCost: 6000.0,
    materialCost: 0.0,
    equipmentCost: 1500.0, // Dryer facility fuel
    totalCost: 7500.0,
    notes: 'First picking round of cardamom capsules. Cured in local smoke house.',
    yieldKg: 35,
    income: 52500.0,
    noOfWorkers: 10,
    laborCostPerWorker: 600.0,
  },
];

const MOCK_PESTICIDE_LOGS: PesticideLog[] = [
  {
    id: 'pest-101',
    cropIds: ['crop-1'],
    pesticideName: 'Copper Oxychloride',
    dosage: '3g per Litre',
    appliedQuantity: '50 Litres',
    date: '2026-07-02',
    targetPest: 'Quick Wilt (Foot Rot)',
    activeIngredient: 'Copper',
    reentryHours: 24,
    withholdingDays: 14,
    cost: 800.0,
    noOfWorkers: 2,
    laborCostPerWorker: 600.0,
  },
  {
    id: 'pest-201',
    cropIds: ['crop-2'],
    pesticideName: 'Thiodan',
    dosage: '2ml per Litre',
    appliedQuantity: '80 Litres',
    date: '2026-07-16',
    targetPest: 'Cardamom Thrips & Borers',
    activeIngredient: 'Endosulfan Alternative',
    reentryHours: 48,
    withholdingDays: 12,
    cost: 1500.0,
    noOfWorkers: 3,
    laborCostPerWorker: 600.0,
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
    .map((p) => ({ ...p, cropIds: (p.cropIds || []).filter((id) => id !== cropId) }))
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

  // Auto-log corresponding "Spraying" work activity for each crop
  const totalLaborCost = (log.noOfWorkers || 0) * (log.laborCostPerWorker || 0);
  const materialCost = log.cost || 0;
  const totalCost = totalLaborCost + materialCost;

  if (totalCost > 0 && log.cropIds && log.cropIds.length > 0) {
    const laborPerCrop = totalLaborCost / log.cropIds.length;
    const materialPerCrop = materialCost / log.cropIds.length;
    const workersPerCrop = (log.noOfWorkers || 0) / log.cropIds.length;

    for (const cropId of log.cropIds) {
      await addWorkLog({
        cropId,
        activityType: 'Spraying',
        date: log.date,
        durationMinutes: 0,
        laborCost: Number(laborPerCrop.toFixed(2)),
        materialCost: Number(materialPerCrop.toFixed(2)),
        equipmentCost: 0,
        noOfWorkers: Number(workersPerCrop.toFixed(1)),
        laborCostPerWorker: log.laborCostPerWorker || 0,
        notes: `Auto-logged spray: ${log.pesticideName}.${log.targetPest ? ' Target: ' + log.targetPest : ''}${log.withholdingDays ? ' Withholding: ' + log.withholdingDays + ' days.' : ''}`,
      });
    }
  }

  return newLog;
};

export const deletePesticideLog = async (logId: string): Promise<void> => {
  const logs = await getPesticideLogs();
  const filtered = logs.filter((l) => l.id !== logId);
  await savePesticideLogs(filtered);
};
