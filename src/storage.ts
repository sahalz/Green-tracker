import AsyncStorage from '@react-native-async-storage/async-storage';
import { Crop, WorkLog, PesticideLog } from './types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  CROPS: 'crop_monitor_crops_v3',
  WORK_LOGS: 'crop_monitor_work_logs_v3',
  PESTICIDE_LOGS: 'crop_monitor_pesticide_logs_v3',
  SYNC_CODE: 'crop_monitor_sync_code_v1',
  SYNC_QUEUE: 'crop_monitor_sync_queue_v1',
};

interface SyncOperation {
  id: string;
  action: 'add' | 'update' | 'delete';
  type: 'crop' | 'workLog' | 'pesticideLog';
  payload: any;
}

// Default perennial crop mock data
const MOCK_CROPS = (syncCode: string): Crop[] => [
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
    syncCode,
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
    syncCode,
  },
];

const MOCK_WORK_LOGS = (syncCode: string): WorkLog[] => [
  {
    id: 'work-101',
    cropId: 'crop-1',
    activityType: 'Planting',
    date: '2021-05-15',
    durationMinutes: 360,
    laborCost: 8000.0,
    materialCost: 5000.0,
    equipmentCost: 1500.0,
    totalCost: 14500.0,
    notes: 'Planted 150 Panniyur-1 pepper cuttings near support standard trees.',
    noOfWorkers: 16,
    laborCostPerWorker: 500.0,
    syncCode,
  },
  {
    id: 'work-102',
    cropId: 'crop-1',
    activityType: 'Vine Tying',
    date: '2025-06-10',
    durationMinutes: 180,
    laborCost: 3000.0,
    materialCost: 500.0,
    equipmentCost: 0.0,
    totalCost: 3500.0,
    notes: 'Tied growing pepper vines to support trees using eco-friendly jute twines.',
    noOfWorkers: 6,
    laborCostPerWorker: 500.0,
    syncCode,
  },
  {
    id: 'work-103',
    cropId: 'crop-1',
    activityType: 'Harvesting',
    date: '2026-02-10',
    durationMinutes: 480,
    laborCost: 4000.0,
    materialCost: 0.0,
    equipmentCost: 1000.0,
    totalCost: 5000.0,
    notes: 'Harvested black pepper berries. Dried under sun on mats.',
    yieldKg: 120,
    income: 72000.0,
    noOfWorkers: 8,
    laborCostPerWorker: 500.0,
    syncCode,
  },
  {
    id: 'work-104',
    cropId: 'crop-1',
    activityType: 'Spraying',
    date: '2026-07-02',
    durationMinutes: 120,
    laborCost: 1200.0,
    materialCost: 800.0,
    equipmentCost: 500.0,
    totalCost: 2500.0,
    notes: 'Applied copper oxychloride to prevent quick wilt (foot rot) after monsoon onset.',
    noOfWorkers: 2,
    laborCostPerWorker: 600.0,
    syncCode,
  },
  {
    id: 'work-105',
    cropId: 'crop-1',
    activityType: 'Revenue',
    date: '2026-02-15',
    durationMinutes: 0,
    laborCost: 0,
    materialCost: 0,
    equipmentCost: 0,
    totalCost: 0,
    notes: 'Sold premium dried black pepper spikes. Deducted processing/threshing charge.',
    manureName: 'Black Pepper',
    yieldKg: 100,
    income: 60000.0,
    pricePerKg: 600.0,
    processingCharge: 1500.0,
    syncCode,
  },
  {
    id: 'work-201',
    cropId: 'crop-2',
    activityType: 'Planting',
    date: '2023-09-20',
    durationMinutes: 400,
    laborCost: 10000.0,
    materialCost: 12000.0,
    equipmentCost: 2000.0,
    totalCost: 24000.0,
    notes: 'Completed cardomom sucker planting in rows across Shade Valley Plot A.',
    noOfWorkers: 20,
    laborCostPerWorker: 500.0,
    syncCode,
  },
  {
    id: 'work-202',
    cropId: 'crop-2',
    activityType: 'Shade Regulation',
    date: '2026-05-20',
    durationMinutes: 240,
    laborCost: 5000.0,
    materialCost: 0.0,
    equipmentCost: 2000.0,
    totalCost: 7000.0,
    notes: 'Pruned branches of shade trees to allow 40-50% light penetration during monsoon.',
    noOfWorkers: 5,
    laborCostPerWorker: 1000.0,
    syncCode,
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
    syncCode,
  },
  {
    id: 'work-204',
    cropId: 'crop-2',
    activityType: 'Harvesting',
    date: '2026-07-15',
    durationMinutes: 480,
    laborCost: 6000.0,
    materialCost: 0.0,
    equipmentCost: 1500.0,
    totalCost: 7500.0,
    notes: 'First picking round of cardamom capsules. Cured in local smoke house.',
    yieldKg: 35,
    rawYieldKg: 175,
    income: 52500.0,
    noOfWorkers: 10,
    laborCostPerWorker: 600.0,
    syncCode,
  },
];

const MOCK_PESTICIDE_LOGS = (syncCode: string): PesticideLog[] => [
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
    syncCode,
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
    syncCode,
  },
];

// --- Sync Code Configuration API ---
export const getSyncCode = async (): Promise<string> => {
  try {
    const code = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_CODE);
    return code || 'demofarm';
  } catch {
    return 'demofarm';
  }
};

export const saveSyncCode = async (code: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_CODE, code);
  } catch (e) {
    console.error('Failed to save sync code:', e);
  }
};

// --- Offline Queue Management ---
const getSyncQueue = async (): Promise<SyncOperation[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSyncQueue = async (queue: SyncOperation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
};

const queueOperation = async (op: Omit<SyncOperation, 'id'>) => {
  const queue = await getSyncQueue();
  const newOp: SyncOperation = {
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  queue.push(newOp);
  await saveSyncQueue(queue);
};

// Background task to process operations queued while offline
export const syncPendingQueue = async (): Promise<void> => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  console.log(`Syncing pending queue: ${queue.length} operations`);
  const failedOps: SyncOperation[] = [];

  for (const op of queue) {
    try {
      const collectionName = 
        op.type === 'crop' ? 'crops' : 
        op.type === 'workLog' ? 'work_logs' : 
        'pesticide_logs';

      const docRef = doc(db, collectionName, op.payload.id);

      if (op.action === 'add' || op.action === 'update') {
        await setDoc(docRef, op.payload);
      } else if (op.action === 'delete') {
        await deleteDoc(docRef);
      }
    } catch (e) {
      console.warn(`Pending sync failed for op ${op.id}, will retry later:`, e);
      failedOps.push(op);
    }
  }

  await saveSyncQueue(failedOps);
};

// --- Remote Cloud Sync down to Local Cache ---
export const fetchAndSyncAllData = async (): Promise<void> => {
  try {
    const syncCode = await getSyncCode();
    
    // 1. Fetch crops
    const cropsQuery = query(collection(db, 'crops'), where('syncCode', '==', syncCode));
    const cropsSnap = await getDocs(cropsQuery);
    const cropsList: Crop[] = [];
    cropsSnap.forEach(d => {
      cropsList.push({ id: d.id, ...d.data() } as Crop);
    });
    await AsyncStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(cropsList));

    // 2. Fetch work logs
    const workQuery = query(collection(db, 'work_logs'), where('syncCode', '==', syncCode));
    const workSnap = await getDocs(workQuery);
    const workList: WorkLog[] = [];
    workSnap.forEach(d => {
      workList.push({ id: d.id, ...d.data() } as WorkLog);
    });
    await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(workList));

    // 3. Fetch pesticide logs
    const pestQuery = query(collection(db, 'pesticide_logs'), where('syncCode', '==', syncCode));
    const pestSnap = await getDocs(pestQuery);
    const pestList: PesticideLog[] = [];
    pestSnap.forEach(d => {
      pestList.push({ id: d.id, ...d.data() } as PesticideLog);
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PESTICIDE_LOGS, JSON.stringify(pestList));

    console.log('Successfully synced data with Firestore cloud');
  } catch (error) {
    console.warn('Failed to sync from Firestore. Operating in local offline mode:', error);
  }
};

// Initialize DB: Sync pending queue, download cloud updates. Populate mock data if database is empty.
export const initializeDatabase = async (forceReset = false): Promise<void> => {
  try {
    if (forceReset) {
      await AsyncStorage.clear();
    }

    const syncCode = await getSyncCode();
    
    // Attempt to sync pending queue first
    await syncPendingQueue();

    // Pull latest updates from cloud
    await fetchAndSyncAllData();

    // Check if we have local crops
    const localCropsData = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
    const localCrops: Crop[] = localCropsData ? JSON.parse(localCropsData) : [];

    // If completely empty, seed standard mock data
    if (localCrops.length === 0) {
      console.log('Seeding mock data for sync code:', syncCode);
      const seedCrops = MOCK_CROPS(syncCode);
      const seedWorkLogs = MOCK_WORK_LOGS(syncCode);
      const seedPesticideLogs = MOCK_PESTICIDE_LOGS(syncCode);

      // Write mock data locally
      await AsyncStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(seedCrops));
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(seedWorkLogs));
      await AsyncStorage.setItem(STORAGE_KEYS.PESTICIDE_LOGS, JSON.stringify(seedPesticideLogs));

      // Attempt to seed Firestore
      try {
        for (const crop of seedCrops) {
          await setDoc(doc(db, 'crops', crop.id), crop);
        }
        for (const log of seedWorkLogs) {
          await setDoc(doc(db, 'work_logs', log.id), log);
        }
        for (const pest of seedPesticideLogs) {
          await setDoc(doc(db, 'pesticide_logs', pest.id), pest);
        }
        console.log('Cloud seeding completed successfully.');
      } catch (e) {
        console.warn('Failed to upload seed data to cloud. Queued locally.', e);
        // Queue seed operations
        for (const crop of seedCrops) await queueOperation({ action: 'add', type: 'crop', payload: crop });
        for (const log of seedWorkLogs) await queueOperation({ action: 'add', type: 'workLog', payload: log });
        for (const pest of seedPesticideLogs) await queueOperation({ action: 'add', type: 'pesticideLog', payload: pest });
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// --- Crop API ---
export const getCrops = async (): Promise<Crop[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
    return data ? JSON.parse(data) : [];
  } catch {
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
  const syncCode = await getSyncCode();
  const newCrop: Crop = {
    ...crop,
    id: `crop-${Date.now()}`,
    syncCode,
  };

  // 1. Update local cache
  const crops = await getCrops();
  crops.push(newCrop);
  await saveCrops(crops);

  // 2. Write to Firestore / Queue
  try {
    await setDoc(doc(db, 'crops', newCrop.id), newCrop);
  } catch {
    await queueOperation({ action: 'add', type: 'crop', payload: newCrop });
  }

  return newCrop;
};

export const updateCrop = async (updatedCrop: Crop): Promise<void> => {
  const syncCode = await getSyncCode();
  const payload = { ...updatedCrop, syncCode };

  // 1. Update local cache
  const crops = await getCrops();
  const index = crops.findIndex((c) => c.id === payload.id);
  if (index !== -1) {
    crops[index] = payload;
    await saveCrops(crops);
  }

  // 2. Write to Firestore / Queue
  try {
    await setDoc(doc(db, 'crops', payload.id), payload);
  } catch {
    await queueOperation({ action: 'update', type: 'crop', payload });
  }
};

export const deleteCrop = async (cropId: string): Promise<void> => {
  // 1. Update local cache
  const crops = await getCrops();
  await saveCrops(crops.filter((c) => c.id !== cropId));

  // 2. Write to Firestore / Queue
  try {
    await deleteDoc(doc(db, 'crops', cropId));
  } catch {
    await queueOperation({ action: 'delete', type: 'crop', payload: { id: cropId } });
  }

  // Clean up related logs locally and queue deletion
  const logs = await getWorkLogs();
  const logsToDelete = logs.filter((l) => l.cropId === cropId);
  await saveWorkLogs(logs.filter((l) => l.cropId !== cropId));

  for (const log of logsToDelete) {
    try {
      await deleteDoc(doc(db, 'work_logs', log.id));
    } catch {
      await queueOperation({ action: 'delete', type: 'workLog', payload: { id: log.id } });
    }
  }

  const pestLogs = await getPesticideLogs();
  const updatedPestLogs = pestLogs
    .map((p) => ({ ...p, cropIds: (p.cropIds || []).filter((id) => id !== cropId) }))
    .filter((p) => p.cropIds.length > 0);
  await savePesticideLogs(updatedPestLogs);

  // Sync pesticide logs updates
  for (const p of pestLogs) {
    const updated = updatedPestLogs.find(up => up.id === p.id);
    if (!updated) {
      // deleted
      try {
        await deleteDoc(doc(db, 'pesticide_logs', p.id));
      } catch {
        await queueOperation({ action: 'delete', type: 'pesticideLog', payload: { id: p.id } });
      }
    } else {
      // updated
      try {
        await setDoc(doc(db, 'pesticide_logs', p.id), updated);
      } catch {
        await queueOperation({ action: 'update', type: 'pesticideLog', payload: updated });
      }
    }
  }
};

// --- Work Log API ---
export const getWorkLogs = async (): Promise<WorkLog[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORK_LOGS);
    return data ? JSON.parse(data) : [];
  } catch {
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
  const syncCode = await getSyncCode();
  const totalCost = Number(log.laborCost) + Number(log.materialCost) + Number(log.equipmentCost);
  const newLog: WorkLog = {
    ...log,
    id: `work-${Date.now()}`,
    totalCost,
    syncCode,
  };

  // 1. Update local cache
  const logs = await getWorkLogs();
  logs.push(newLog);
  await saveWorkLogs(logs);

  // 2. Write to Firestore / Queue
  try {
    await setDoc(doc(db, 'work_logs', newLog.id), newLog);
  } catch {
    await queueOperation({ action: 'add', type: 'workLog', payload: newLog });
  }

  return newLog;
};

export const deleteWorkLog = async (logId: string): Promise<void> => {
  // 1. Update local cache
  const logs = await getWorkLogs();
  await saveWorkLogs(logs.filter((l) => l.id !== logId));

  // 2. Write to Firestore / Queue
  try {
    await deleteDoc(doc(db, 'work_logs', logId));
  } catch {
    await queueOperation({ action: 'delete', type: 'workLog', payload: { id: logId } });
  }
};

// --- Pesticide Log API ---
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
          syncCode: item.syncCode,
        };
      }
      return item;
    });
  } catch {
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
  const syncCode = await getSyncCode();
  const newLog: PesticideLog = {
    ...log,
    id: `pest-${Date.now()}`,
    syncCode,
  };

  // 1. Update local cache
  const logs = await getPesticideLogs();
  logs.push(newLog);
  await savePesticideLogs(logs);

  // 2. Write to Firestore / Queue
  try {
    await setDoc(doc(db, 'pesticide_logs', newLog.id), newLog);
  } catch {
    await queueOperation({ action: 'add', type: 'pesticideLog', payload: newLog });
  }

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
  // 1. Update local cache
  const logs = await getPesticideLogs();
  await savePesticideLogs(logs.filter((l) => l.id !== logId));

  // 2. Write to Firestore / Queue
  try {
    await deleteDoc(doc(db, 'pesticide_logs', logId));
  } catch {
    await queueOperation({ action: 'delete', type: 'pesticideLog', payload: { id: logId } });
  }
};
