import AsyncStorage from '@react-native-async-storage/async-storage';
import { Crop, WorkLog, PesticideLog, LaborPayment } from './types';
import { db, ensureAuthenticated } from './firebase';
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
  LABOR_PAYMENTS: 'crop_monitor_labor_payments_v3',
  SYNC_CODE: 'crop_monitor_sync_code_v1',
  SYNC_QUEUE: 'crop_monitor_sync_queue_v1',
};

interface SyncOperation {
  id: string;
  action: 'add' | 'update' | 'delete';
  type: 'crop' | 'workLog' | 'pesticideLog' | 'laborPayment';
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

    // Clear local active cache when switching sync codes so we don't pollute the new space
    await AsyncStorage.removeItem(STORAGE_KEYS.CROPS);
    await AsyncStorage.removeItem(STORAGE_KEYS.WORK_LOGS);
    await AsyncStorage.removeItem(STORAGE_KEYS.PESTICIDE_LOGS);
    await AsyncStorage.removeItem(STORAGE_KEYS.LABOR_PAYMENTS);

    // Fetch cloud records for the new sync code or initialize database
    await fetchAndSyncAllData();
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

// Helper to prevent Firestore operations from hanging indefinitely on poor network
const withTimeout = <T>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Background task to process operations queued while offline
export const syncPendingQueue = async (): Promise<void> => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  console.log(`Syncing pending queue: ${queue.length} operations`);
  const failedOps: SyncOperation[] = [];

  await Promise.all(
    queue.map(async (op) => {
      try {
        const collectionName = 
          op.type === 'crop' ? 'crops' : 
          op.type === 'workLog' ? 'work_logs' : 
          op.type === 'pesticideLog' ? 'pesticide_logs' :
          'labor_payments';

        const docRef = doc(db, collectionName, op.payload.id);

        if (op.action === 'add' || op.action === 'update') {
          await withTimeout(setDoc(docRef, op.payload), 4000);
        } else if (op.action === 'delete') {
          await withTimeout(deleteDoc(docRef), 4000);
        }
      } catch (e) {
        console.warn(`Pending sync failed for op ${op.id}, will retry later:`, e);
failedOps.push(op);
      }
    })
  );

  await saveSyncQueue(failedOps);
};

// Background cloud write with offline fallback
const syncDocToCloud = async (action: 'add' | 'update' | 'delete', type: 'crop' | 'workLog' | 'pesticideLog' | 'laborPayment', payload: any): Promise<void> => {
  await ensureAuthenticated();
  const collectionName = 
    type === 'crop' ? 'crops' : 
    type === 'workLog' ? 'work_logs' : 
    type === 'pesticideLog' ? 'pesticide_logs' : 
    'labor_payments';
  try {
    if (action === 'delete') {
      await withTimeout(deleteDoc(doc(db, collectionName, payload.id)), 4000);
      console.log(`Successfully deleted ${type} ${payload.id} in Firestore`);
    } else {
      await withTimeout(setDoc(doc(db, collectionName, payload.id), payload), 4000);
      console.log(`Successfully set ${type} ${payload.id} in Firestore`);
    }
  } catch (err) {
    console.warn(`Cloud sync failed for ${type} ${payload.id}, queuing offline:`, err);
    await queueOperation({ action, type, payload });
  }
};

// --- Remote Cloud Sync down to Local Cache ---
export const fetchAndSyncAllData = async (): Promise<void> => {
  try {
    await ensureAuthenticated();
    const syncCode = await getSyncCode();

    // 1. Flush any pending offline operations FIRST before fetching
    await syncPendingQueue().catch(() => {});

    // 2. Fetch all collections in PARALLEL for ultra-fast performance (< 500ms)
    const cropsQuery = query(collection(db, 'crops'), where('syncCode', '==', syncCode));
    const workQuery = query(collection(db, 'work_logs'), where('syncCode', '==', syncCode));
    const pestQuery = query(collection(db, 'pesticide_logs'), where('syncCode', '==', syncCode));
    const laborPayQuery = query(collection(db, 'labor_payments'), where('syncCode', '==', syncCode));

    const [cropsSnap, workSnap, pestSnap, laborPaySnap] = await withTimeout(
      Promise.all([getDocs(cropsQuery), getDocs(workQuery), getDocs(pestQuery), getDocs(laborPayQuery)]),
      6000
    );

    const remainingQueue = await getSyncQueue();
    const pendingCropIds = new Set(remainingQueue.filter(op => op.type === 'crop').map(op => op.payload.id));

    // Process crops
    const remoteCrops: Crop[] = [];
    cropsSnap.forEach(d => remoteCrops.push({ id: d.id, ...d.data() } as Crop));
    if (remoteCrops.length > 0) {
      const localCropsData = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
      const localCrops: Crop[] = localCropsData ? JSON.parse(localCropsData) : [];
      
      const mergedCrops = remoteCrops.map(remote => {
        if (pendingCropIds.has(remote.id)) {
          const local = localCrops.find(l => l.id === remote.id);
          return local || remote;
        }
        return remote;
      });

      localCrops.forEach(l => {
        if (pendingCropIds.has(l.id) && !mergedCrops.some(m => m.id === l.id)) {
          mergedCrops.push(l);
        }
      });

      await AsyncStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(mergedCrops));
    } else {
      const localCropsData = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
      const localCrops: Crop[] = localCropsData ? JSON.parse(localCropsData) : [];
      if (localCrops.length > 0) {
        Promise.all(localCrops.map(c => setDoc(doc(db, 'crops', c.id), { ...c, syncCode }).catch(() => {})));
      }
    }

    // Process work logs
    const remoteWork: WorkLog[] = [];
    workSnap.forEach(d => remoteWork.push({ id: d.id, ...d.data() } as WorkLog));
    if (remoteWork.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(remoteWork));
    } else {
      const localWorkData = await AsyncStorage.getItem(STORAGE_KEYS.WORK_LOGS);
      const localWork: WorkLog[] = localWorkData ? JSON.parse(localWorkData) : [];
      if (localWork.length > 0) {
        Promise.all(localWork.map(w => setDoc(doc(db, 'work_logs', w.id), { ...w, syncCode }).catch(() => {})));
      }
    }

    // Process pesticide logs
    const remotePest: PesticideLog[] = [];
    pestSnap.forEach(d => remotePest.push({ id: d.id, ...d.data() } as PesticideLog));
    if (remotePest.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.PESTICIDE_LOGS, JSON.stringify(remotePest));
    } else {
      const localPestData = await AsyncStorage.getItem(STORAGE_KEYS.PESTICIDE_LOGS);
      const localPest: PesticideLog[] = localPestData ? JSON.parse(localPestData) : [];
      if (localPest.length > 0) {
        Promise.all(localPest.map(p => setDoc(doc(db, 'pesticide_logs', p.id), { ...p, syncCode }).catch(() => {})));
      }
    }

    // Process labor payments
    const remoteLaborPay: LaborPayment[] = [];
    laborPaySnap.forEach(d => remoteLaborPay.push({ id: d.id, ...d.data() } as LaborPayment));
    if (remoteLaborPay.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.LABOR_PAYMENTS, JSON.stringify(remoteLaborPay));
    } else {
      const localLaborPayData = await AsyncStorage.getItem(STORAGE_KEYS.LABOR_PAYMENTS);
      const localLaborPay: LaborPayment[] = localLaborPayData ? JSON.parse(localLaborPayData) : [];
      if (localLaborPay.length > 0) {
        Promise.all(localLaborPay.map(lp => setDoc(doc(db, 'labor_payments', lp.id), { ...lp, syncCode }).catch(() => {})));
      }
    }

    console.log('Successfully synced data with Firestore cloud (Fast Parallel)');
  } catch (error) {
    console.warn('Failed to sync from Firestore. Operating in local offline mode:', error);
  }
};

// Initialize DB: Ensure local cache is ready fast. Seed mock data if empty.
export const initializeDatabase = async (forceReset = false): Promise<void> => {
  try {
    if (forceReset) {
      await AsyncStorage.clear();
    }

    const syncCode = await getSyncCode();

    // Check if we have local crops (offline-first check)
    const localCropsData = await AsyncStorage.getItem(STORAGE_KEYS.CROPS);
    const localCrops: Crop[] = localCropsData ? JSON.parse(localCropsData) : [];

    // If completely empty, seed standard mock data locally immediately
    if (localCrops.length === 0) {
      console.log('Seeding mock data for sync code:', syncCode);
      const seedCrops = MOCK_CROPS(syncCode);
      const seedWorkLogs = MOCK_WORK_LOGS(syncCode);
      const seedPesticideLogs = MOCK_PESTICIDE_LOGS(syncCode);

      // Write mock data locally
      await AsyncStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(seedCrops));
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(seedWorkLogs));
      await AsyncStorage.setItem(STORAGE_KEYS.PESTICIDE_LOGS, JSON.stringify(seedPesticideLogs));

      // Attempt to seed Firestore in the background without blocking local init
      (async () => {
        try {
          for (const crop of seedCrops) {
            await withTimeout(setDoc(doc(db, 'crops', crop.id), crop), 3000);
          }
          for (const log of seedWorkLogs) {
            await withTimeout(setDoc(doc(db, 'work_logs', log.id), log), 3000);
          }
          for (const pest of seedPesticideLogs) {
            await withTimeout(setDoc(doc(db, 'pesticide_logs', pest.id), pest), 3000);
          }
          console.log('Cloud seeding completed successfully.');
        } catch (e) {
          console.warn('Failed to upload seed data to cloud. Queued locally.', e);
          for (const crop of seedCrops) await queueOperation({ action: 'add', type: 'crop', payload: crop });
          for (const log of seedWorkLogs) await queueOperation({ action: 'add', type: 'workLog', payload: log });
          for (const pest of seedPesticideLogs) await queueOperation({ action: 'add', type: 'pesticideLog', payload: pest });
        }
      })();
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

  // 1. Update local cache immediately (< 5ms)
  const crops = await getCrops();
  crops.push(newCrop);
  await saveCrops(crops);

  // 2. Cloud sync
  await syncDocToCloud('add', 'crop', newCrop);

  return newCrop;
};

export const updateCrop = async (updatedCrop: Crop): Promise<void> => {
  const syncCode = await getSyncCode();
  const payload = { ...updatedCrop, syncCode };

  // 1. Update local cache immediately (< 5ms)
  const crops = await getCrops();
  const index = crops.findIndex((c) => c.id === payload.id);
  if (index !== -1) {
    crops[index] = payload;
    await saveCrops(crops);
  }

  // 2. Cloud sync
  await syncDocToCloud('update', 'crop', payload);
};

export const deleteCrop = async (cropId: string): Promise<void> => {
  // 1. Update local cache immediately
  const crops = await getCrops();
  await saveCrops(crops.filter((c) => c.id !== cropId));

  // 2. Background cloud delete
  await syncDocToCloud('delete', 'crop', { id: cropId });

  // Clean up related logs locally
  const logs = await getWorkLogs();
  const logsToDelete = logs.filter((l) => l.cropId === cropId);
  await saveWorkLogs(logs.filter((l) => l.cropId !== cropId));

  logsToDelete.forEach((log) => {
    syncDocToCloud('delete', 'workLog', { id: log.id });
  });

  const pestLogs = await getPesticideLogs();
  const updatedPestLogs = pestLogs
    .map((p) => ({ ...p, cropIds: (p.cropIds || []).filter((id) => id !== cropId) }))
    .filter((p) => p.cropIds.length > 0);
  await savePesticideLogs(updatedPestLogs);

  pestLogs.forEach((p) => {
    const updated = updatedPestLogs.find((up) => up.id === p.id);
    if (!updated) {
      syncDocToCloud('delete', 'pesticideLog', { id: p.id });
    } else {
      syncDocToCloud('update', 'pesticideLog', updated);
    }
  });
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

  // 1. Update local cache immediately (< 5ms)
  const logs = await getWorkLogs();
  logs.push(newLog);
  await saveWorkLogs(logs);

  // 2. Fire-and-forget background cloud sync
  syncDocToCloud('add', 'workLog', newLog);

  return newLog;
};

export const deleteWorkLog = async (logId: string): Promise<void> => {
  // 1. Update local cache immediately
  const logs = await getWorkLogs();
  await saveWorkLogs(logs.filter((l) => l.id !== logId));

  // 2. Fire-and-forget background cloud delete
  syncDocToCloud('delete', 'workLog', { id: logId });
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

  // 1. Update local cache immediately (< 5ms)
  const logs = await getPesticideLogs();
  logs.push(newLog);
  await savePesticideLogs(logs);

  // 2. Fire-and-forget background cloud sync
  syncDocToCloud('add', 'pesticideLog', newLog);

  // Auto-log corresponding "Spraying" work activity for each crop in parallel
  const totalLaborCost = (log.noOfWorkers || 0) * (log.laborCostPerWorker || 0);
  const materialCost = log.cost || 0;
  const totalCost = totalLaborCost + materialCost;

  if (totalCost > 0 && log.cropIds && log.cropIds.length > 0) {
    const laborPerCrop = totalLaborCost / log.cropIds.length;
    const materialPerCrop = materialCost / log.cropIds.length;
    const workersPerCrop = (log.noOfWorkers || 0) / log.cropIds.length;

    await Promise.all(
      log.cropIds.map(cropId =>
        addWorkLog({
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
        })
      )
    );
  }

  return newLog;
};

export const deletePesticideLog = async (logId: string): Promise<void> => {
  // 1. Update local cache immediately
  const logs = await getPesticideLogs();
  await savePesticideLogs(logs.filter((l) => l.id !== logId));

  // 2. Fire-and-forget background cloud delete
  syncDocToCloud('delete', 'pesticideLog', { id: logId });
};

// --- Labor Payment API ---
export const getLaborPayments = async (): Promise<LaborPayment[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LABOR_PAYMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLaborPayments = async (payments: LaborPayment[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LABOR_PAYMENTS, JSON.stringify(payments));
  } catch (e) {
    console.error('Error saving labor payments:', e);
  }
};

export const addLaborPayment = async (payment: Omit<LaborPayment, 'id'>): Promise<LaborPayment> => {
  const syncCode = await getSyncCode();
  const newPayment: LaborPayment = {
    ...payment,
    id: `labor-pay-${Date.now()}`,
    syncCode,
  };

  // 1. Update local cache immediately
  const payments = await getLaborPayments();
  payments.push(newPayment);
  await saveLaborPayments(payments);

  // 2. Fire-and-forget background cloud sync
  syncDocToCloud('add', 'laborPayment', newPayment);

  return newPayment;
};

export const deleteLaborPayment = async (paymentId: string): Promise<void> => {
  // 1. Update local cache immediately
  const payments = await getLaborPayments();
  await saveLaborPayments(payments.filter((p) => p.id !== paymentId));

  // 2. Background cloud delete
  syncDocToCloud('delete', 'laborPayment', { id: paymentId });
};

