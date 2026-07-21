import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform, StatusBar as RNStatusBar, Alert, BackHandler, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Crop, WorkLog, PesticideLog } from './src/types';
import { Language, TRANSLATIONS } from './src/translations';
import {
  initializeDatabase,
  getCrops,
  saveCrops,
  getWorkLogs,
  saveWorkLogs,
  getPesticideLogs,
  addCrop,
  updateCrop,
  deleteCrop,
  addWorkLog,
  deleteWorkLog,
  addPesticideLog,
  deletePesticideLog,
  getSyncCode,
  saveSyncCode,
  syncPendingQueue,
  fetchAndSyncAllData
} from './src/storage';

import Dashboard from './src/components/Dashboard';
import CropsTab from './src/components/CropsTab';
import GoatTab from './src/components/GoatTab';
import FishTab from './src/components/FishTab';
import { syncCardamomNotifications } from './src/notifications';

const LANGUAGE_STORAGE_KEY = 'crop_monitor_language_v1';

export default function App() {
  // Application Data States
  const [crops, setCrops] = useState<Crop[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [pesticideLogs, setPesticideLogs] = useState<PesticideLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Language State
  const [language, setLanguage] = useState<Language>('en');

  // Selection state for drilling down into a crop's details
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  // Bottom tab state
  const [currentTab, setCurrentTab] = useState<'Crops' | 'Goat' | 'Fish'>('Crops');

  // Cloud Sync States
  const [syncCode, setSyncCodeState] = useState('demofarm');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [tempSyncCode, setTempSyncCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle Android hardware back button
  useEffect(() => {
    const handleBackPress = () => {
      // 1. If a crop is selected, go back to dashboard list
      if (selectedCrop) {
        setSelectedCrop(null);
        return true; // prevent default behavior (exiting app)
      }
      
      // 2. If we are on Goat or Fish tab, switch back to Crops tab
      if (currentTab !== 'Crops') {
        setCurrentTab('Crops');
        return true; // prevent default behavior
      }
      
      return false; // let default behavior happen (exits app)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      subscription.remove();
    };
  }, [selectedCrop, currentTab]);

  // Load data & language on start
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const savedCode = await getSyncCode();
        setSyncCodeState(savedCode);

        await initializeDatabase(); // Will fill mock data if first load
        
        // Load language preference
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang === 'ml' || savedLang === 'en') {
          setLanguage(savedLang);
        }

        await refreshAllData();
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAppData();
  }, []);

  // Periodic background synchronization check
  useEffect(() => {
    if (isLoading) return;

    // Run initial background sync
    syncPendingQueue()
      .then(() => fetchAndSyncAllData())
      .then(() => refreshAllData())
      .catch(err => console.warn('Initial sync failed:', err));

    const syncInterval = setInterval(async () => {
      try {
        await syncPendingQueue();
      } catch (e) {
        console.warn('Background sync failed:', e);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(syncInterval);
  }, [isLoading, syncCode]);

  const handleSaveSyncCode = async () => {
    const trimmed = tempSyncCode.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert(language === 'ml' ? 'പിശക്' : 'Error', language === 'ml' ? 'ദയവായി സാധുവായ ഒരു കോഡ് നൽകുക' : 'Please enter a valid code');
      return;
    }
    
    setIsSyncing(true);
    try {
      await saveSyncCode(trimmed);
      setSyncCodeState(trimmed);
      
      // Initialize database with new sync code records
      await initializeDatabase();
      await refreshAllData();
      
      setShowSyncModal(false);
      Alert.alert(
        language === 'ml' ? 'വിജയം' : 'Success', 
        language === 'ml' ? `സിങ്ക് കോഡ് ${trimmed} ലേക്ക് മാറ്റി` : `Sync Code updated to "${trimmed}" successfully!`
      );
    } catch (e) {
      console.error(e);
      Alert.alert(language === 'ml' ? 'പിശക്' : 'Error', language === 'ml' ? 'സിങ്ക് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു' : 'Failed to sync with the cloud database');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingQueue();
      await fetchAndSyncAllData();
      await refreshAllData();
      Alert.alert(
        language === 'ml' ? 'സിൻക്രൊണൈസേഷൻ' : 'Sync Complete',
        language === 'ml' ? 'ക്ലൗഡുമായി സിങ്ക് ചെയ്യുന്നത് വിജയകരമായി പൂർത്തിയായി' : 'Successfully synchronized offline updates and downloaded cloud changes.'
      );
    } catch (e) {
      Alert.alert(language === 'ml' ? 'പിശക്' : 'Error', language === 'ml' ? 'സിങ്ക് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു' : 'Failed to sync. Operating offline.');
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshAllData = async () => {
    let [c, w, p] = await Promise.all([
      getCrops(),
      getWorkLogs(),
      getPesticideLogs()
    ]);

    // Check for kids older than 3 months to automatically transition them to males & females
    let didUpdate = false;
    const today = new Date();
    const updatedCrops = [...c];
    
    const updatedWorkLogs = w.map(log => {
      if (log.activityType === 'New Babies' && !log.kidsConverted) {
        const birthDate = new Date(log.date);
        if (!isNaN(birthDate.getTime())) {
          const targetDate = new Date(birthDate);
          targetDate.setMonth(targetDate.getMonth() + 3);
          if (today >= targetDate) {
            // Find the corresponding goat crop cycle
            const cropIndex = updatedCrops.findIndex(crop => crop.id === log.cropId);
            if (cropIndex !== -1) {
              const crop = updatedCrops[cropIndex];
              const maleKids = log.malesCount || 0;
              const femaleKids = log.femalesCount || 0;
              const totalKids = maleKids + femaleKids;

              updatedCrops[cropIndex] = {
                ...crop,
                malesCount: (crop.malesCount || 0) + maleKids,
                femalesCount: (crop.femalesCount || 0) + femaleKids,
                kidsCount: Math.max(0, (crop.kidsCount || 0) - totalKids),
                stageCountKid: Math.max(0, (crop.stageCountKid || 0) - totalKids),
                stageCountGrower: (crop.stageCountGrower || 0) + totalKids,
              };
              didUpdate = true;
            }
            return { ...log, kidsConverted: true };
          }
        }
      }
      return log;
    });

    if (didUpdate) {
      await Promise.all([
        saveCrops(updatedCrops),
        saveWorkLogs(updatedWorkLogs)
      ]);
      c = updatedCrops;
      w = updatedWorkLogs;
    }

    setCrops(c);
    setWorkLogs(w);
    setPesticideLogs(p);
  };

  useEffect(() => {
    if (!isLoading) {
      syncCardamomNotifications(crops, pesticideLogs);
    }
  }, [crops, pesticideLogs, isLoading]);

  const handleLanguageToggle = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  // Wrapper functions for data changes to sync UI state
  const handleAddCrop = async (cropData: Omit<Crop, 'id'>) => {
    await addCrop(cropData);
    await refreshAllData();
  };

  const handleUpdateCrop = async (crop: Crop) => {
    await updateCrop(crop);
    await refreshAllData();
    // Update the selected crop reference if it is being viewed
    if (selectedCrop && selectedCrop.id === crop.id) {
      setSelectedCrop(crop);
    }
  };

  const handleDeleteCrop = async (id: string) => {
    await deleteCrop(id);
    await refreshAllData();
  };

  const handleAddWorkLog = async (logData: Omit<WorkLog, 'id' | 'totalCost'>) => {
    await addWorkLog(logData);
    await refreshAllData();
  };

  const handleDeleteWorkLog = async (id: string) => {
    const logToDelete = workLogs.find(w => w.id === id);
    if (logToDelete) {
      const crop = crops.find(c => c.id === logToDelete.cropId);
      if (crop) {
        let updatedCrop = { ...crop };
        let isGoat = crop.type.toLowerCase().includes('goat') || crop.type.includes('ആട്');
        let isFish = crop.type.toLowerCase().includes('fish') || crop.type.includes('മത്സ്യം');

        if (isGoat) {
          const malesVal = logToDelete.malesCount || 0;
          const femalesVal = logToDelete.femalesCount || 0;
          const kidsVal = logToDelete.kidsCount || logToDelete.yieldKg || 0;

          if (logToDelete.activityType === 'Buying') {
            updatedCrop.malesCount = Math.max(0, (crop.malesCount || 0) - malesVal);
            updatedCrop.femalesCount = Math.max(0, (crop.femalesCount || 0) - femalesVal);
          } else if (logToDelete.activityType === 'New Babies') {
            updatedCrop.kidsCount = Math.max(0, (crop.kidsCount || 0) - kidsVal);
          } else if (logToDelete.activityType === 'Revenue') {
            updatedCrop.malesCount = (crop.malesCount || 0) + malesVal;
            updatedCrop.femalesCount = (crop.femalesCount || 0) + femalesVal;
            updatedCrop.kidsCount = (crop.kidsCount || 0) + (logToDelete.kidsCount || 0);
          }
          await updateCrop(updatedCrop);
        } else if (isFish) {
          const logQty = logToDelete.fishCount || 0;
          if (logToDelete.activityType === 'Buying') {
            updatedCrop.fishCount = Math.max(0, (crop.fishCount || 0) - logQty);
          } else if (logToDelete.activityType === 'Revenue' || logToDelete.activityType === 'Mortality') {
            updatedCrop.fishCount = (crop.fishCount || 0) + logQty;
          }
          await updateCrop(updatedCrop);
        }
      }
    }

    await deleteWorkLog(id);
    await refreshAllData();
  };

  const handleAddPesticideLog = async (logData: Omit<PesticideLog, 'id'>) => {
    await addPesticideLog(logData);
    await refreshAllData();
  };

  const handleDeletePesticideLog = async (id: string) => {
    await deletePesticideLog(id);
    await refreshAllData();
  };

  const handleExportPDF = async () => {
    try {
      const isGoatCrop = (c: Crop) => c.type.toLowerCase().includes('goat') || c.type.includes('ആട്');
      const isFishCrop = (c: Crop) => c.type.toLowerCase().includes('fish') || c.type.includes('മത്സ്യം');
      const isCropCrop = (c: Crop) => !isGoatCrop(c) && !isFishCrop(c);

      const cropList = crops.filter(isCropCrop);
      const goatList = crops.filter(isGoatCrop);
      const fishList = crops.filter(isFishCrop);

      // Filter work logs by matching crop type
      const filteredLogs = workLogs.filter(l => {
        const c = crops.find(crop => crop.id === l.cropId);
        if (!c) return false;
        if (currentTab === 'Crops') return isCropCrop(c);
        if (currentTab === 'Goat') return isGoatCrop(c);
        if (currentTab === 'Fish') return isFishCrop(c);
        return false;
      });

      const totalExp = filteredLogs.reduce((sum, l) => sum + (l.laborCost || 0) + (l.materialCost || 0) + (l.equipmentCost || 0) + (l.processingCharge || 0), 0);
      const totalRev = filteredLogs.reduce((sum, l) => sum + (l.income || 0), 0);
      const netProfit = totalRev - totalExp;

      let reportTitle = '';
      let reportSubtitle = '';
      let inventorySection = '';

      if (currentTab === 'Crops') {
        reportTitle = language === 'ml' ? 'വിളകളുടെ റിപ്പോർട്ട്' : 'Crops Management Report';
        reportSubtitle = language === 'ml' ? 'കൃഷിവിളകളുടെ ആകെ വിവരം' : 'Crop Cycles & Spending Ledger';
        inventorySection = `
          <!-- Crops Section -->
          <div class="section-title">${language === 'ml' ? 'വിളകളുടെ വിവരം' : 'Crops Inventory'}</div>
          <table>
            <thead>
              <tr>
                <th>${language === 'ml' ? 'പേര്' : 'Name'}</th>
                <th>${language === 'ml' ? 'ഇനം' : 'Type'}</th>
                <th>${language === 'ml' ? 'വെറൈറ്റി' : 'Variety'}</th>
                <th>${language === 'ml' ? 'തീയതി' : 'Planted Date'}</th>
                <th>${language === 'ml' ? 'ഘട്ടം' : 'Stage'}</th>
                <th>${language === 'ml' ? 'സ്ഥലം' : 'Location'}</th>
              </tr>
            </thead>
            <tbody>
              ${cropList.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.type}</td>
                  <td>${c.variety}</td>
                  <td>${c.plantingDate}</td>
                  <td><span class="badge warning">${c.stage}</span></td>
                  <td>${c.field}</td>
                </tr>
              `).join('')}
              ${cropList.length === 0 ? `<tr><td colspan="6" style="text-align:center; color:#999;">${language === 'ml' ? 'വിളകൾ ലഭ്യമല്ല' : 'No crops registered'}</td></tr>` : ''}
            </tbody>
          </table>
        `;
      } else if (currentTab === 'Goat') {
        reportTitle = language === 'ml' ? 'ആട് വളർത്തൽ റിപ്പോർട്ട്' : 'Goat Farm Report';
        reportSubtitle = language === 'ml' ? 'ആടുകളുടെ എണ്ണവും വിവരങ്ങളും' : 'Goat Herd Stock & Expenses';
        inventorySection = `
          <!-- Goat Section -->
          <div class="section-title">${language === 'ml' ? 'ആട് വളർത്തൽ' : 'Goat Inventory'}</div>
          <table>
            <thead>
              <tr>
                <th>${language === 'ml' ? 'ഫാം പേര്' : 'Farm Name'}</th>
                <th>${language === 'ml' ? 'ആൺ ആടുകൾ' : 'Males'}</th>
                <th>${language === 'ml' ? 'പെൺ ആടുകൾ' : 'Females'}</th>
                <th>${language === 'ml' ? 'കുട്ടികൾ' : 'Kids'}</th>
                <th>${language === 'ml' ? 'ആകെ എണ്ണം' : 'Total Stock'}</th>
                <th>${language === 'ml' ? 'സ്ഥലം' : 'Location'}</th>
              </tr>
            </thead>
            <tbody>
              ${goatList.map(s => {
                const total = (s.malesCount || 0) + (s.femalesCount || 0) + (s.kidsCount || 0);
                return `
                  <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.malesCount || 0}</td>
                    <td>${s.femalesCount || 0}</td>
                    <td>${s.kidsCount || 0}</td>
                    <td><span class="badge success">${total} nos</span></td>
                    <td>${s.field}</td>
                  </tr>
                `;
              }).join('')}
              ${goatList.length === 0 ? `<tr><td colspan="6" style="text-align:center; color:#999;">${language === 'ml' ? 'വിവരങ്ങൾ ലഭ്യമല്ല' : 'No goat farms registered'}</td></tr>` : ''}
            </tbody>
          </table>
        `;
      } else if (currentTab === 'Fish') {
        reportTitle = language === 'ml' ? 'മത്സ്യ വളർത്തൽ റിപ്പോർട്ട്' : 'Fish Pond Report';
        reportSubtitle = language === 'ml' ? 'മത്സ്യക്കുളവും ജല ഗുണനിലവാരവും' : 'Pond Stock & Water Quality Log';
        
        const phLogs = filteredLogs.filter(l => l.activityType === 'Water pH');

        inventorySection = `
          <!-- Fish Farm Section -->
          <div class="section-title">${language === 'ml' ? 'മത്സ്യ വളർത്തൽ' : 'Fish Pond Stock'}</div>
          <table>
            <thead>
              <tr>
                <th>${language === 'ml' ? 'കുളത്തിന്റെ പേര്' : 'Pond Name'}</th>
                <th>${language === 'ml' ? 'മത്സ്യ ഇനം' : 'Species'}</th>
                <th>${language === 'ml' ? 'അളവ് (എണ്ണം)' : 'Fish Count'}</th>
                <th>${language === 'ml' ? 'ഇറക്കിയ തീയതി' : 'Release Date'}</th>
                <th>${language === 'ml' ? 'കുളം / സ്ഥലം' : 'Pond Location'}</th>
              </tr>
            </thead>
            <tbody>
              ${fishList.map(f => `
                <tr>
                  <td><strong>${f.name}</strong></td>
                  <td>${f.variety}</td>
                  <td><span class="badge success">${f.fishCount || 0} nos</span></td>
                  <td>${f.plantingDate}</td>
                  <td>${f.field}</td>
                </tr>
              `).join('')}
              ${fishList.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:#999;">${language === 'ml' ? 'വിവരങ്ങൾ ലഭ്യമല്ല' : 'No fish ponds registered'}</td></tr>` : ''}
            </tbody>
          </table>

          <!-- Water pH Log Section -->
          <div class="section-title">${language === 'ml' ? 'ജല ഗുണനിലവാരം (pH History)' : 'Water pH Logs'}</div>
          <table>
            <thead>
              <tr>
                <th>${language === 'ml' ? 'തീയതി' : 'Date'}</th>
                <th>pH Level</th>
                <th>${language === 'ml' ? 'നില' : 'Status'}</th>
                <th>${language === 'ml' ? 'കുറിപ്പുകൾ' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody>
              ${phLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(log => {
                const val = log.phValue || 7.0;
                let statusLabel = language === 'ml' ? 'ആരോഗ്യകരം' : 'Healthy';
                let statusColor = '#065f46';
                let statusBg = '#d1fae5';
                if (val < 6.5) {
                  statusLabel = language === 'ml' ? 'അമ്ലതയുള്ളത് (കുമ്മായം ചേർക്കുക)' : 'Acidic (Add lime)';
                  statusColor = '#991b1b';
                  statusBg = '#fee2e2';
                } else if (val > 8.5) {
                  statusLabel = language === 'ml' ? 'ക്ഷാരഗുണമുള്ളത്' : 'Alkaline';
                  statusColor = '#92400e';
                  statusBg = '#fef3c7';
                }
                return `
                  <tr>
                    <td>${log.date}</td>
                    <td><strong>${val.toFixed(1)}</strong></td>
                    <td><span class="badge" style="background-color: ${statusBg}; color: ${statusColor};">${statusLabel}</span></td>
                    <td><small>${log.notes || '-'}</small></td>
                  </tr>
                `;
              }).join('')}
              ${phLogs.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:#999;">${language === 'ml' ? 'pH വിവരങ്ങൾ ലഭ്യമല്ല' : 'No pH logs recorded'}</td></tr>` : ''}
            </tbody>
          </table>
        `;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${reportTitle}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #2c3e50; line-height: 1.4; }
            h1 { color: #1b3a1e; font-size: 24px; text-align: center; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #7f8c8d; font-size: 14px; margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #1b3a1e; padding-left: 8px; color: #1b3a1e; margin-top: 30px; margin-bottom: 12px; }
            .stats-container { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 15px; }
            .stat-card { flex: 1; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fafafa; text-align: center; }
            .stat-card.profit { background: #e8f5e9; border-color: #c8e6c9; }
            .stat-card.cost { background: #ffebee; border-color: #ffcdd2; }
            .stat-card-title { font-size: 11px; text-transform: uppercase; color: #7f8c8d; margin-bottom: 6px; font-weight: bold; }
            .stat-card-val { font-size: 20px; font-weight: bold; }
            .stat-card.profit .stat-card-val { color: #2e7d32; }
            .stat-card.cost .stat-card-val { color: #c62828; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
            tr:hover { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background-color: #e2e8f0; }
            .badge.success { background-color: #d1fae5; color: #065f46; }
            .badge.danger { background-color: #fee2e2; color: #991b1b; }
            .badge.warning { background-color: #fef3c7; color: #92400e; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <div class="subtitle">${reportSubtitle} | ${language === 'ml' ? 'തയ്യാറാക്കിയ തീയതി' : 'Generated on'}: ${new Date().toLocaleDateString()}</div>

          <!-- Summary Stats -->
          <div class="stats-container">
            <div class="stat-card cost">
              <div class="stat-card-title">${language === 'ml' ? 'ആകെ ചിലവ്' : 'Total Expenses'}</div>
              <div class="stat-card-val">₹${totalExp.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">${language === 'ml' ? 'ആകെ വരുമാനം' : 'Total Revenue'}</div>
              <div class="stat-card-val">₹${totalRev.toFixed(2)}</div>
            </div>
            <div class="stat-card profit">
              <div class="stat-card-title">${language === 'ml' ? 'ആകെ ലാഭം' : 'Net Profit'}</div>
              <div class="stat-card-val">₹${netProfit.toFixed(2)}</div>
            </div>
          </div>

          ${inventorySection}

          <!-- Transaction Logs Section -->
          <div class="section-title">${language === 'ml' ? 'വിശദമായ പണമിടപാട് വിവരങ്ങൾ' : 'Detailed Transaction Ledger'}</div>
          <table>
            <thead>
              <tr>
                <th>${language === 'ml' ? 'തീയതി' : 'Date'}</th>
                <th>${language === 'ml' ? 'ഫാം ഐറ്റം' : 'Farm/Crop'}</th>
                <th>${language === 'ml' ? 'പ്രവർത്തി ഇനം' : 'Activity'}</th>
                <th>${language === 'ml' ? 'ചിലവ് (₹)' : 'Expense (₹)'}</th>
                <th>${language === 'ml' ? 'വരുമാനം (₹)' : 'Revenue (₹)'}</th>
                <th>${language === 'ml' ? 'കുറിപ്പുകൾ' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                const associatedCrop = crops.find(c => c.id === log.cropId);
                const cropName = associatedCrop ? associatedCrop.name : 'Unknown';
                const costVal = (log.laborCost || 0) + (log.materialCost || 0) + (log.equipmentCost || 0) + (log.processingCharge || 0);

                return `
                  <tr>
                    <td>${log.date}</td>
                    <td>${cropName}</td>
                    <td>${log.activityType}</td>
                    <td class="text-right" style="color: #c62828;">${costVal > 0 ? `₹${costVal.toFixed(2)}` : '-'}</td>
                    <td class="text-right" style="color: #2e7d32;">${log.income ? `₹${log.income.toFixed(2)}` : '-'}</td>
                    <td><small>${log.notes || '-'}</small></td>
                  </tr>
                `;
              }).join('')}
              ${filteredLogs.length === 0 ? `<tr><td colspan="6" style="text-align:center; color:#999;">${language === 'ml' ? 'ഇടപാടുകൾ ലഭ്യമല്ല' : 'No transaction logs found'}</td></tr>` : ''}
            </tbody>
          </table>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const choice = window.confirm(
          language === 'ml'
            ? "റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യാൻ 'OK' ക്ലിക്ക് ചെയ്യുക. പ്രിന്റ് ചെയ്യാനോ പി.ഡി.എഫ് ആയി സേവ് ചെയ്യാനോ 'Cancel' ക്ലിക്ക് ചെയ്യുക."
            : "Click 'OK' to download the report directly as an HTML file. Click 'Cancel' to open the Print / Save PDF preview window."
        );
        
        if (choice) {
          // Download HTML Report
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportTitle.replace(/\s+/g, '_')}_Report.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          // Open Print Dialog
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          } else {
            alert(
              language === 'ml'
                ? 'പി.ഡി.എഫ് റിപ്പോർട്ട് കാണുന്നതിനായി ദയവായി പോപ്പ്-അപ്പ് വിൻഡോകൾ അനുവദിക്കുക.'
                : 'Please allow popups to view and export the PDF report.'
            );
          }
        }
      } else {
        Alert.alert(
          language === 'ml' ? 'റിപ്പോർട്ട് എക്സ്പോർട്ട്' : 'Export Report',
          language === 'ml' ? 'എന്ത് ചെയ്യണം എന്ന് തിരഞ്ഞെടുക്കുക:' : 'Select an option:',
          [
            {
              text: language === 'ml' ? 'പ്രിന്റ് / സേവ് പി.ഡി.എഫ്' : 'Print / Save PDF',
              onPress: async () => {
                try {
                  const { uri } = await Print.printToFileAsync({ html: htmlContent });
                  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
                } catch (err) {
                  console.error('Failed to print/share PDF:', err);
                }
              }
            },
            {
              text: language === 'ml' ? 'ഡൗൺലോഡ് ചെയ്യുക (PDF)' : 'Download (PDF)',
              onPress: async () => {
                try {
                  const { uri } = await Print.printToFileAsync({ html: htmlContent });
                  await Sharing.shareAsync(uri, { 
                    UTI: '.pdf', 
                    mimeType: 'application/pdf',
                    dialogTitle: language === 'ml' ? 'റിപ്പോർട്ട് സേവ് ചെയ്യുക' : 'Save PDF Report'
                  });
                } catch (err) {
                  console.error('Failed to download/save PDF:', err);
                }
              }
            },
            {
              text: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to export PDF report:', error);
      Alert.alert(
        language === 'ml' ? 'പിശക്' : 'Error',
        language === 'ml' ? 'പി.ഡി.എഫ് റിപ്പോർട്ട് നിർമ്മിക്കുന്നതിൽ തകരാർ നേരിട്ടു.' : 'Failed to generate PDF report.'
      );
    }
  };

  const t = TRANSLATIONS[language];

  // Helper to find the singleton Goat crop
  const goatCrop = crops.find(c => c.type.toLowerCase().includes('goat') || c.type.includes('ആട്'));

  // Helper to find the singleton Fish crop
  const fishCrop = crops.find(c => c.type.toLowerCase().includes('fish') || c.type.includes('മത്സ്യം'));

  // Automatically create a singleton goat crop if it doesn't exist
  useEffect(() => {
    if (!isLoading && currentTab === 'Goat') {
      const existingGoat = crops.find(c => c.type.toLowerCase().includes('goat') || c.type.includes('ആട്'));
      if (!existingGoat) {
        const createDefaultGoat = async () => {
          await handleAddCrop({
            name: language === 'ml' ? 'എൻ്റെ ആട് വളർത്തൽ' : 'My Goat Farm',
            type: language === 'ml' ? 'ആട്' : 'Goat',
            variety: language === 'ml' ? 'നാടൻ' : 'Local',
            field: language === 'ml' ? 'പ്രധാന കൂട്' : 'Main Shed',
            plantingDate: new Date().toISOString().split('T')[0],
            expectedHarvestDate: '',
            stage: 'Seedling', // Lamb stage
            notes: 'Default Goat Farm Singleton',
            malesCount: 0,
            femalesCount: 0,
            kidsCount: 0,
            stageCountKid: 0,
            stageCountGrower: 0,
            stageCountBreeder: 0,
            stageCountPregnant: 0,
            stageCountLactating: 0,
            stageCountArchived: 0
          });
        };
        createDefaultGoat();
      } else {
        if (!selectedCrop || selectedCrop.id !== existingGoat.id) {
          setSelectedCrop(existingGoat);
        }
      }
    }
  }, [currentTab, crops, isLoading, language, selectedCrop]);

  // Automatically create a singleton fish crop if it doesn't exist
  useEffect(() => {
    if (!isLoading && currentTab === 'Fish') {
      const existingFish = crops.find(c => c.type.toLowerCase().includes('fish') || c.type.includes('മത്സ്യം'));
      if (!existingFish) {
        const createDefaultFish = async () => {
          await handleAddCrop({
            name: language === 'ml' ? 'എൻ്റെ മത്സ്യ വളർത്തൽ' : 'My Fish Pond',
            type: language === 'ml' ? 'മത്സ്യം' : 'Fish',
            variety: language === 'ml' ? 'തിലാപ്പിയ' : 'Tilapia',
            field: language === 'ml' ? 'പ്രധാന കുളം' : 'Main Pond',
            plantingDate: new Date().toISOString().split('T')[0],
            expectedHarvestDate: '',
            stage: 'Seedling', // Fingerling stage
            notes: 'Default Fish Farm Singleton',
            fishCount: 0,
          });
        };
        createDefaultFish();
      } else {
        if (!selectedCrop || selectedCrop.id !== existingFish.id) {
          setSelectedCrop(existingFish);
        }
      }
    }
  }, [currentTab, crops, isLoading, language, selectedCrop]);

  // Render content in single page flow (Dashboard/Crops list -> Crop Details)
  const renderContent = () => {
    // If we are on the Goat tab, render the singleton goat farm details directly
    if (currentTab === 'Goat') {
      if (goatCrop) {
        return (
          <GoatTab
            workLogs={workLogs}
            onUpdateCrop={handleUpdateCrop}
            selectedCrop={goatCrop}
            onAddWorkLog={handleAddWorkLog}
            onDeleteWorkLog={handleDeleteWorkLog}
            language={language}
          />
        );
      } else {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1b3a1e" />
            <Text style={styles.loadingText}>Initializing goat farm...</Text>
          </View>
        );
      }
    }

    // If we are on the Fish tab, render the singleton fish farm details directly
    if (currentTab === 'Fish') {
      if (fishCrop) {
        return (
          <FishTab
            workLogs={workLogs}
            onUpdateCrop={handleUpdateCrop}
            selectedCrop={fishCrop}
            onAddWorkLog={handleAddWorkLog}
            onDeleteWorkLog={handleDeleteWorkLog}
            language={language}
          />
        );
      } else {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#006064" />
            <Text style={styles.loadingText}>Initializing fish pond...</Text>
          </View>
        );
      }
    }

    // Otherwise, we are on the Crops tab
    if (selectedCrop) {
      return (
        <CropsTab
          crops={crops}
          workLogs={workLogs}
          pesticideLogs={pesticideLogs}
          onAddCrop={handleAddCrop}
          onUpdateCrop={handleUpdateCrop}
          onDeleteCrop={handleDeleteCrop}
          selectedCrop={selectedCrop}
          onSelectCrop={setSelectedCrop}
          onAddWorkLog={handleAddWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          onAddPesticideLog={handleAddPesticideLog}
          onDeletePesticideLog={handleDeletePesticideLog}
          language={language}
        />
      );
    }

    const cropCrops = crops.filter(c => !(c.type.toLowerCase().includes('goat') || c.type.includes('ആട്') || c.type.toLowerCase().includes('fish') || c.type.includes('മത്സ്യം')));
    const cropCropIds = new Set(cropCrops.map(c => c.id));
    const cropWorkLogs = workLogs.filter(l => cropCropIds.has(l.cropId));

    return (
      <Dashboard
        crops={cropCrops}
        workLogs={cropWorkLogs}
        pesticideLogs={pesticideLogs}
        onSelectCrop={setSelectedCrop}
        onAddCrop={handleAddCrop}
        language={language}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1b3a1e" />
        <Text style={styles.loadingText}>Loading farm database...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Language Header Switcher */}
      <View style={styles.langHeader}>
        <Text style={styles.langHeaderTitle}>{t.appName}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.pdfExportBtn, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe', marginRight: 5 }]}
            onPress={() => {
              setTempSyncCode(syncCode);
              setShowSyncModal(true);
            }}
          >
            <Text style={[styles.pdfExportBtnText, { color: '#4f46e5' }]}>🔄 Sync</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pdfExportBtn}
            onPress={handleExportPDF}
          >
            <Text style={styles.pdfExportBtnText}>📄 {t.exportPDF}</Text>
          </TouchableOpacity>
          
          <View style={styles.langToggleContainer}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => handleLanguageToggle('en')}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'ml' && styles.langBtnActive]}
              onPress={() => handleLanguageToggle('ml')}
            >
              <Text style={[styles.langBtnText, language === 'ml' && styles.langBtnTextActive]}>മലയാളം</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Cloud Sync Settings Modal */}
      <Modal
        visible={showSyncModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSyncModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.syncModalOverlay}
        >
          <View style={styles.syncModalContent}>
            <Text style={styles.syncModalTitle}>
              {language === 'ml' ? 'ക്ലൗഡ് സിൻക്രൊണൈസേഷൻ' : 'Cloud Sync Settings'}
            </Text>
            <Text style={styles.syncModalDescription}>
              {language === 'ml' ? 'മറ്റ് ഫോണുകളുമായി വിവരങ്ങൾ പങ്കിടാൻ ഒരേ സിങ്ക് കോഡ് ഉപയോഗിക്കുക.' : 'Use the same Sync Code on other devices to share the exact same farm data.'}
            </Text>
            
            <Text style={styles.syncInputLabel}>
              {language === 'ml' ? 'സിങ്ക് കോഡ് *' : 'Sync Code *'}
            </Text>
            <TextInput
              style={styles.syncInput}
              placeholder="e.g. demofarm"
              value={tempSyncCode}
              onChangeText={setTempSyncCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {isSyncing ? (
              <ActivityIndicator size="small" color="#1b3a1e" style={{ marginVertical: 15 }} />
            ) : (
              <View style={styles.syncActionContainer}>
                <TouchableOpacity
                  style={[styles.syncModalBtn, styles.syncManualBtn]}
                  onPress={handleManualSync}
                >
                  <Text style={styles.syncManualBtnText}>🔄 {language === 'ml' ? 'ഇപ്പോൾ സിങ്ക് ചെയ്യുക' : 'Sync Now'}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.syncModalActions}>
              <TouchableOpacity
                style={[styles.syncModalBtn, styles.syncCancelBtn]}
                onPress={() => setShowSyncModal(false)}
                disabled={isSyncing}
              >
                <Text style={styles.syncCancelBtnText}>{language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.syncModalBtn, styles.syncSaveBtn]}
                onPress={handleSaveSyncCode}
                disabled={isSyncing}
              >
                <Text style={styles.syncSaveBtnText}>{language === 'ml' ? 'സൂക്ഷിക്കുക' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* App Content */}
      <View style={styles.mainContainer}>
        {renderContent()}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'Crops' && styles.tabItemActive]}
          onPress={() => { setCurrentTab('Crops'); setSelectedCrop(null); }}
        >
          <Text style={styles.tabIcon}>🌱</Text>
          <Text style={[styles.tabLabel, currentTab === 'Crops' && styles.tabLabelActive]}>
            {language === 'ml' ? 'വിളകൾ' : 'Crops'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'Goat' && styles.tabItemActive]}
          onPress={() => { setCurrentTab('Goat'); setSelectedCrop(goatCrop || null); }}
        >
          <Text style={styles.tabIcon}>🐐</Text>
          <Text style={[styles.tabLabel, currentTab === 'Goat' && styles.tabLabelActive]}>
            {language === 'ml' ? 'ആടുകൾ' : 'Goats'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'Fish' && styles.tabItemActive]}
          onPress={() => { setCurrentTab('Fish'); setSelectedCrop(fishCrop || null); }}
        >
          <Text style={styles.tabIcon}>🐟</Text>
          <Text style={[styles.tabLabel, currentTab === 'Fish' && styles.tabLabelActive]}>
            {language === 'ml' ? 'മത്സ്യം' : 'Fish'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  langHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8e2',
  },
  langHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b3a1e',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfExportBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 10,
  },
  pdfExportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  langToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f1',
    borderRadius: 15,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 13,
  },
  langBtnActive: {
    backgroundColor: '#1b3a1e',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6e8070',
  },
  langBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#6e8070',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: '#ffffff',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8e2',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#1b3a1e',
    marginTop: -2, // Offset top border width
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#6e8070',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#1b3a1e',
    fontWeight: '700',
  },
  syncModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  syncModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  syncModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b3a1e',
    marginBottom: 8,
  },
  syncModalDescription: {
    fontSize: 13,
    color: '#6e8070',
    lineHeight: 18,
    marginBottom: 20,
  },
  syncInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b3a1e',
    marginBottom: 6,
  },
  syncInput: {
    backgroundColor: '#f1f5f1',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1b3a1e',
    marginBottom: 16,
  },
  syncActionContainer: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  syncModalBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncManualBtn: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    paddingHorizontal: 16,
    width: '100%',
  },
  syncManualBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  syncModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  syncCancelBtn: {
    backgroundColor: '#f1f5f1',
    paddingHorizontal: 16,
  },
  syncCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6e8070',
  },
  syncSaveBtn: {
    backgroundColor: '#1b3a1e',
    paddingHorizontal: 20,
  },
  syncSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
