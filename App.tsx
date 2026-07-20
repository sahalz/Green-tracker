import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Crop, WorkLog, PesticideLog } from './src/types';
import { Language, TRANSLATIONS } from './src/translations';
import {
  initializeDatabase,
  getCrops,
  getWorkLogs,
  getPesticideLogs,
  addCrop,
  updateCrop,
  deleteCrop,
  addWorkLog,
  deleteWorkLog,
  addPesticideLog,
  deletePesticideLog
} from './src/storage';

import Dashboard from './src/components/Dashboard';
import CropsTab from './src/components/CropsTab';
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

  // Load data & language on start
  useEffect(() => {
    const loadAppData = async () => {
      try {
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

  const refreshAllData = async () => {
    const [c, w, p] = await Promise.all([
      getCrops(),
      getWorkLogs(),
      getPesticideLogs()
    ]);
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

  const t = TRANSLATIONS[language];

  // Render content in single page flow (Dashboard/Crops list -> Crop Details)
  const renderContent = () => {
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

    return (
      <Dashboard
        crops={crops}
        workLogs={workLogs}
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
      
      {/* App Content */}
      <View style={styles.mainContainer}>
        {renderContent()}
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
});
