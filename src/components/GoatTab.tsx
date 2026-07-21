import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Crop, CropStage, WorkLog } from '../types';
import { Language, TRANSLATIONS, translateStage, translateActivity } from '../translations';
import CustomDatePicker from './CustomDatePicker';

interface GoatTabProps {
  workLogs: WorkLog[];
  onUpdateCrop: (crop: Crop) => Promise<any>;
  selectedCrop: Crop | null;
  onAddWorkLog: (log: Omit<WorkLog, 'id' | 'totalCost'>) => Promise<any>;
  onDeleteWorkLog: (id: string) => Promise<any>;
  language: Language;
}

const STAGES: CropStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvested', 'Archived'];

export default function GoatTab({
  workLogs,
  onUpdateCrop,
  selectedCrop,
  onAddWorkLog,
  onDeleteWorkLog,
  language,
}: GoatTabProps) {
  const t = TRANSLATIONS[language];

  // Work Log Form States
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [workActivity, setWorkActivity] = useState<string>('');
  
  const [workWorkers, setWorkWorkers] = useState<string>('');
  const [workLaborCostPerWorker, setWorkLaborCostPerWorker] = useState<string>('');
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workNotes, setWorkNotes] = useState<string>('');
  const [workYield, setWorkYield] = useState<string>('');
  const [workRawYield, setWorkRawYield] = useState<string>('');
  const [workMaterialCost, setWorkMaterialCost] = useState<string>('');
  const [workIncome, setWorkIncome] = useState<string>('');

  // Goat specific states
  const [workMalesCount, setWorkMalesCount] = useState<string>('');
  const [workFemalesCount, setWorkFemalesCount] = useState<string>('');
  const [workBreededGoat, setWorkBreededGoat] = useState<string>('');
  const [workMotherGoat, setWorkMotherGoat] = useState<string>('');

  const [earningsMalesCount, setEarningsMalesCount] = useState<string>('');
  const [earningsFemalesCount, setEarningsFemalesCount] = useState<string>('');
  const [earningsKidsCount, setEarningsKidsCount] = useState<string>('');
  const [earningsTotalAmount, setEarningsTotalAmount] = useState<string>('');

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustMales, setAdjustMales] = useState('');
  const [adjustFemales, setAdjustFemales] = useState('');
  const [adjustKids, setAdjustKids] = useState('');

  // Stage Count / Manual Entry Modal States
  const [showStageCountModal, setShowStageCountModal] = useState(false);
  const [targetStageForModal, setTargetStageForModal] = useState<CropStage>('Seedling');
  const [stageCountValue, setStageCountValue] = useState<string>('');

  // Feed Modal State
  const [showFeedModal, setShowFeedModal] = useState(false);

  // Feed form states
  const [feedDate, setFeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feedType, setFeedType] = useState<string>('');
  const [feedQty, setFeedQty] = useState<string>('');
  const [feedCost, setFeedCost] = useState<string>('');
  const [feedNotes, setFeedNotes] = useState<string>('');



  // Earnings Form States
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [earningsItem, setEarningsItem] = useState<string>('');
  const [earningsDate, setEarningsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earningsNotes, setEarningsNotes] = useState<string>('');

  if (!selectedCrop) return null;

  const isGoat = true;
  const isCardamom = false;
  const isPepper = false;

  const isHarvesting = false;
  const isCuring = false;

  const isBuying = workActivity === 'Buying' || workActivity.trim().toLowerCase().includes('buy') || workActivity.trim().includes('വാങ്ങ');
  const isNewBabies = workActivity === 'New Babies' || workActivity.trim().toLowerCase().includes('baby') || workActivity.trim().includes('കുട്ടി') || workActivity.trim().includes('പ്രസവ');
  const isFeedOrFood = workActivity === 'Feed / Food' || workActivity.trim().toLowerCase().includes('feed') || workActivity.trim().toLowerCase().includes('food') || workActivity.trim().includes('തീറ്റ');
  const isMedical = workActivity === 'Medical / Vaccine' || workActivity.trim().toLowerCase().includes('med') || workActivity.trim().toLowerCase().includes('vacc') || workActivity.trim().includes('മരുന്ന്') || workActivity.trim().includes('വാക്സിൻ');

  const isHarvestingOrCuring = isBuying || isNewBabies || isFeedOrFood;

  const cropWorkLogs = workLogs.filter(w => w.cropId === selectedCrop.id);

  const laborCost = cropWorkLogs.reduce((sum, l) => sum + l.laborCost, 0);
  const materialCost = cropWorkLogs.reduce((sum, l) => sum + l.materialCost, 0);
  const equipmentCost = cropWorkLogs.reduce((sum, l) => sum + l.equipmentCost, 0);
  const processingCost = cropWorkLogs.reduce((sum, l) => sum + (l.processingCharge || 0), 0);
  const totalCost = laborCost + materialCost + equipmentCost + processingCost;
  
  const totalRevenue = cropWorkLogs.reduce((sum, l) => sum + (l.income || 0), 0);
  const netProfit = totalRevenue - totalCost;

  const handleStageChange = async (newStage: CropStage) => {
    const updated: Crop = { ...selectedCrop, stage: newStage };
    await onUpdateCrop(updated);
  };



  const handleAdjustInventorySubmit = async () => {
    if (!selectedCrop) return;
    const updatedCrop = {
      ...selectedCrop,
      malesCount: Number(adjustMales) || 0,
      femalesCount: Number(adjustFemales) || 0,
      kidsCount: Number(adjustKids) || 0,
    };
    await onUpdateCrop(updatedCrop);
    setShowAdjustModal(false);
  };

  const handleAddFeedExpenseSubmit = async () => {
    if (!selectedCrop) return;
    if (!feedType.trim() || !feedCost) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'തീറ്റയുടെ ഇനവും ചിലവ് തുകയും നൽകുക.' : 'Please enter feed type and cost.'
      );
      return;
    }

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Feed / Food',
      date: feedDate,
      durationMinutes: 0,
      laborCost: 0,
      materialCost: Number(feedCost) || 0,
      equipmentCost: 0,
      notes: feedNotes.trim() ? `Feed Type: ${feedType.trim()}. ${feedNotes.trim()}` : `Feed Type: ${feedType.trim()}`,
      yieldKg: Number(feedQty) || 0,
    };

    await onAddWorkLog(logData);

    // Reset feed form
    setFeedType('');
    setFeedQty('');
    setFeedCost('');
    setFeedNotes('');
    setFeedDate(new Date().toISOString().split('T')[0]);
    setShowFeedModal(false);
  };

  const handleStageCountSubmit = async (saveAsActiveStage: boolean) => {
    if (!selectedCrop) return;
    const countNum = Number(stageCountValue) || 0;

    let updatedCrop = { ...selectedCrop };
    
    // Update the correct stage count property
    if (targetStageForModal === 'Seedling') updatedCrop.stageCountKid = countNum;
    else if (targetStageForModal === 'Vegetative') updatedCrop.stageCountGrower = countNum;
    else if (targetStageForModal === 'Flowering') updatedCrop.stageCountBreeder = countNum;
    else if (targetStageForModal === 'Fruiting') updatedCrop.stageCountPregnant = countNum;
    else if (targetStageForModal === 'Harvested') updatedCrop.stageCountLactating = countNum;
    else if (targetStageForModal === 'Archived') updatedCrop.stageCountArchived = countNum;

    if (saveAsActiveStage) {
      updatedCrop.stage = targetStageForModal;
    }

    await onUpdateCrop(updatedCrop);
    setShowStageCountModal(false);
  };

  const handleAddWorkLogSubmit = async () => {
    if (!selectedCrop) return;
    if (!workActivity.trim()) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'ജോലിയുടെ ഇനം നൽകുക.' : 'Please enter the activity type.'
      );
      return;
    }
    if (!isGoat && (!workWorkers || !workLaborCostPerWorker)) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'തൊഴിലാളികളുടെ എണ്ണവും കൂലിയും നൽകുക.' : 'Please enter number of workers and labor cost per worker.'
      );
      return;
    }

    const calculatedLaborCost = (Number(workWorkers) || 0) * (Number(workLaborCostPerWorker) || 0);
    const workersNum = Number(workWorkers) || undefined;
    const costPerWorkerNum = Number(workLaborCostPerWorker) || undefined;

    let finalYield: number | undefined = isHarvestingOrCuring ? (Number(workYield) || undefined) : undefined;
    let finalMalesCount: number | undefined = undefined;
    let finalFemalesCount: number | undefined = undefined;

    if (isGoat) {
      if (isBuying) {
        finalMalesCount = Number(workMalesCount) || 0;
        finalFemalesCount = Number(workFemalesCount) || 0;
        finalYield = finalMalesCount + finalFemalesCount;
      } else if (isNewBabies) {
        finalMalesCount = Number(workMalesCount) || 0;
        finalFemalesCount = Number(workFemalesCount) || 0;
        finalYield = finalMalesCount + finalFemalesCount;
      } else if (isFeedOrFood) {
        finalYield = Number(workYield) || 0;
      }
    }

    const logData = {
      cropId: selectedCrop.id,
      activityType: workActivity.trim(),
      date: workDate,
      durationMinutes: 0,
      laborCost: calculatedLaborCost,
      materialCost: Number(workMaterialCost) || 0,
      equipmentCost: 0,
      notes: workNotes,
      noOfWorkers: workersNum,
      laborCostPerWorker: costPerWorkerNum,
      manureName: undefined,
      yieldKg: finalYield,
      rawYieldKg: isHarvestingOrCuring && isCardamom ? (Number(workRawYield) || undefined) : undefined,
      income: isHarvesting ? (Number(workIncome) || undefined) : undefined,
      malesCount: finalMalesCount,
      femalesCount: finalFemalesCount,
      breededGoat: workActivity === 'Breeding' ? workBreededGoat.trim() || undefined : undefined,
      motherGoat: workActivity === 'New Babies' ? workMotherGoat.trim() || undefined : undefined,
    };

    await onAddWorkLog(logData);

    // Update inventory automatically
    if (isGoat) {
      let updatedMales = selectedCrop.malesCount || 0;
      let updatedFemales = selectedCrop.femalesCount || 0;
      let updatedKids = selectedCrop.kidsCount || 0;

      if (isBuying) {
        updatedMales += finalMalesCount || 0;
        updatedFemales += finalFemalesCount || 0;
      } else if (isNewBabies) {
        updatedKids += finalYield || 0;
      }

      await onUpdateCrop({
        ...selectedCrop,
        malesCount: updatedMales,
        femalesCount: updatedFemales,
        kidsCount: updatedKids,
      });
    }

    setShowWorkLogModal(false);
    
    // Reset work form
    setWorkActivity('');
    setWorkWorkers('');
    setWorkLaborCostPerWorker('');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setWorkNotes('');
    setWorkYield('');
    setWorkRawYield('');
    setWorkMaterialCost('');
    setWorkIncome('');
    setWorkMalesCount('');
    setWorkFemalesCount('');
    setWorkBreededGoat('');
    setWorkMotherGoat('');
  };



  const handleAddEarningsSubmit = async () => {
    if (!selectedCrop) return;
    if (!earningsTotalAmount) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'ആകെ വിറ്റ തുക നൽകുക.' : 'Please enter total sale amount.'
      );
      return;
    }
    const malesSold = Number(earningsMalesCount) || 0;
    const femalesSold = Number(earningsFemalesCount) || 0;
    const kidsSold = Number(earningsKidsCount) || 0;
    const totalSold = malesSold + femalesSold + kidsSold;

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Revenue',
      date: earningsDate,
      durationMinutes: 0,
      laborCost: 0,
      materialCost: 0,
      equipmentCost: 0,
      notes: earningsNotes.trim(),
      manureName: earningsItem.trim(),
      yieldKg: totalSold,
      income: Number(earningsTotalAmount) || 0,
      malesCount: malesSold,
      femalesCount: femalesSold,
      kidsCount: kidsSold,
    };

    await onAddWorkLog(logData);

    // Subtract from inventory
    let updatedMales = Math.max(0, (selectedCrop.malesCount || 0) - malesSold);
    let updatedFemales = Math.max(0, (selectedCrop.femalesCount || 0) - femalesSold);
    let updatedKids = Math.max(0, (selectedCrop.kidsCount || 0) - kidsSold);

    await onUpdateCrop({
      ...selectedCrop,
      malesCount: updatedMales,
      femalesCount: updatedFemales,
      kidsCount: updatedKids,
    });

    setShowEarningsModal(false);

    // Reset goat form
    setEarningsItem('');
    setEarningsMalesCount('');
    setEarningsFemalesCount('');
    setEarningsKidsCount('');
    setEarningsTotalAmount('');
    setEarningsNotes('');
    setEarningsDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteActivity = async (logId: string) => {
    const title = language === 'ml' ? 'രേഖ ഒഴിവാക്കണോ?' : 'Delete Log Entry';
    const msg = language === 'ml' 
      ? 'ഈ വിവരങ്ങൾ ഒഴിവാക്കപ്പെടും, ഒപ്പം സ്റ്റോക്ക് വിവരങ്ങൾ പഴയതുപോലെ ക്രമീകരിക്കപ്പെടും. തുടർന്നു പോകണോ?' 
      : 'Are you sure you want to delete this log? Stock inventory counts will be reverted accordingly.';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${msg}`);
      if (confirmed) {
        await onDeleteWorkLog(logId);
      }
    } else {
      Alert.alert(title, msg, [
        { text: t.cancel, style: 'cancel' },
        {
          text: language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeleteWorkLog(logId);
          }
        }
      ]);
    }
  };

  // Dynamic calculations for preview in UI
  const liveWorkTotalLaborCost = (Number(workWorkers) || 0) * (Number(workLaborCostPerWorker) || 0);
  


  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>


        {/* Goat Inventory Card */}
        {isGoat && (
          <View style={styles.inventoryCard}>
            <Text style={styles.inventoryTitle}>
              🐐 {language === 'ml' ? 'ആടുകളുടെ എണ്ണം (നിലവിൽ)' : 'Current Goat Inventory'}
            </Text>
            
            <View style={styles.inventoryRow}>
              <View style={styles.inventoryCol}>
                <Text style={styles.inventoryIcon}>♂️</Text>
                <Text style={styles.inventoryLabel}>{language === 'ml' ? 'ആൺ ആടുകൾ' : 'Males'}</Text>
                <Text style={styles.inventoryValue}>{selectedCrop.malesCount || 0}</Text>
              </View>
              <View style={styles.inventoryCol}>
                <Text style={styles.inventoryIcon}>♀️</Text>
                <Text style={styles.inventoryLabel}>{language === 'ml' ? 'പെൺ ആടുകൾ' : 'Females'}</Text>
                <Text style={styles.inventoryValue}>{selectedCrop.femalesCount || 0}</Text>
              </View>
              <View style={styles.inventoryCol}>
                <Text style={styles.inventoryIcon}>👶</Text>
                <Text style={styles.inventoryLabel}>{language === 'ml' ? 'കുട്ടികൾ' : 'Kids'}</Text>
                <Text style={styles.inventoryValue}>{selectedCrop.kidsCount || 0}</Text>
              </View>
            </View>

            <View style={styles.inventoryDivider} />

            <View style={styles.inventoryTotalRow}>
              <Text style={styles.inventoryTotalLabel}>{language === 'ml' ? 'ആകെ ആടുകൾ' : 'Total Goats'}</Text>
              <Text style={styles.inventoryTotalValue}>
                {(selectedCrop.malesCount || 0) + (selectedCrop.femalesCount || 0) + (selectedCrop.kidsCount || 0)}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.adjustInventoryBtn} 
              onPress={() => {
                setAdjustMales(String(selectedCrop.malesCount || 0));
                setAdjustFemales(String(selectedCrop.femalesCount || 0));
                setAdjustKids(String(selectedCrop.kidsCount || 0));
                setShowAdjustModal(true);
              }}
            >
              <Text style={styles.adjustInventoryBtnText}>
                ⚙️ {language === 'ml' ? 'എണ്ണം ക്രമീകരിക്കുക / മാറ്റി എഴുതുക' : 'Adjust / Override Counts'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

          <>
            {/* Change Stage Section */}
            <Text style={styles.sectionTitle}>{isGoat ? (language === 'ml' ? 'വളർച്ചാ ഘട്ടങ്ങൾ' : 'Growth Stages') : t.updateGrowthStage}</Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.stagePickerScroll}>
              {STAGES.map((stg) => {
                const isSelected = selectedCrop.stage === stg;
                let countText = '';
                if (isGoat) {
                  const count = 
                    stg === 'Seedling' ? (selectedCrop.stageCountKid || 0) :
                    stg === 'Vegetative' ? (selectedCrop.stageCountGrower || 0) :
                    stg === 'Flowering' ? (selectedCrop.stageCountBreeder || 0) :
                    stg === 'Fruiting' ? (selectedCrop.stageCountPregnant || 0) :
                    stg === 'Harvested' ? (selectedCrop.stageCountLactating || 0) :
                    stg === 'Archived' ? (selectedCrop.stageCountArchived || 0) : 0;
                  countText = ` (${count})`;
                }

                return (
                  <TouchableOpacity
                    key={stg}
                    style={[
                      styles.stagePickerItem,
                      isSelected && { backgroundColor: getStageColor(stg), borderColor: getStageColor(stg) },
                    ]}
                    onPress={() => {
                      if (isGoat) {
                        setTargetStageForModal(stg);
                        const count = 
                          stg === 'Seedling' ? (selectedCrop.stageCountKid || 0) :
                          stg === 'Vegetative' ? (selectedCrop.stageCountGrower || 0) :
                          stg === 'Flowering' ? (selectedCrop.stageCountBreeder || 0) :
                          stg === 'Fruiting' ? (selectedCrop.stageCountPregnant || 0) :
                          stg === 'Harvested' ? (selectedCrop.stageCountLactating || 0) :
                          stg === 'Archived' ? (selectedCrop.stageCountArchived || 0) : 0;
                        setStageCountValue(String(count));
                        setShowStageCountModal(true);
                      } else {
                        handleStageChange(stg);
                      }
                    }}
                  >
                    <Text style={[styles.stagePickerText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                      {translateStage(stg, language, isGoat)}{countText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Crop Financial Ledger */}
            <View style={styles.expenseSummaryCard}>
              <View style={styles.ledgerHeaderRow}>
                <View style={styles.ledgerHeaderCol}>
                  <Text style={styles.expenseSummaryTitle}>{t.totalExpenses}</Text>
                  <Text style={styles.expenseSummaryVal}>₹{totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
                <View style={styles.ledgerHeaderCol}>
                  <Text style={styles.expenseSummaryTitle}>{t.revenue}</Text>
                  <Text style={styles.expenseSummaryVal}>₹{totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
              </View>
              
              <View style={styles.ledgerDivider} />
              
              <View style={styles.ledgerProfitRow}>
                <Text style={styles.ledgerProfitLabel}>{t.profit}</Text>
                <Text style={[styles.ledgerProfitValue, { color: netProfit >= 0 ? '#2e7d32' : '#ff5252' }]}>
                  ₹{netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              {processingCost > 0 && (
                <>
                  <View style={styles.ledgerDivider} />
                  <View style={styles.ledgerProfitRow}>
                    <Text style={[styles.ledgerProfitLabel, { fontWeight: 'normal', color: '#7f8c8d' }]}>⚙️ {language === 'ml' ? 'പ്രൊസസ്സിംഗ് ചിലവ്' : 'Processing Cost'}</Text>
                    <Text style={[styles.ledgerProfitValue, { fontSize: 16, color: '#2c3e50', fontWeight: '600' }]}>
                      ₹{processingCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.ledgerDivider} />

              <View style={styles.expenseSummaryBreakdown}>
                <View style={styles.breakdownCol}>
                  <Text style={styles.breakdownLabel}>👨‍🌾 {t.laborCost}</Text>
                  <Text style={styles.breakdownSubVal}>₹{laborCost.toFixed(0)}</Text>
                </View>
                <View style={styles.breakdownCol}>
                  <Text style={styles.breakdownLabel}>{isGoat ? (language === 'ml' ? 'തീറ്റ & മരുന്ന് ചിലവ്' : 'Feed & Medical') : t.materialsInputs}</Text>
                  <Text style={styles.breakdownSubVal}>₹{materialCost.toFixed(0)}</Text>
                </View>
                <View style={styles.breakdownCol}>
                  <Text style={styles.breakdownLabel}>{isGoat ? (language === 'ml' ? 'ഉപകരണങ്ങൾ/ഇതര ചിലവ്' : 'Equip & Others') : t.equipmentFuel}</Text>
                  <Text style={styles.breakdownSubVal}>₹{equipmentCost.toFixed(0)}</Text>
                </View>
              </View>

              {isGoat && (
                <View style={{ marginTop: 12, padding: 10, backgroundColor: '#fffde7', borderRadius: 8, borderWidth: 1, borderColor: '#fff59d' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#f57f17', marginBottom: 4 }}>
                    🌾 {language === 'ml' ? 'തീറ്റ ചിലവ് സംഗ്രഹം' : 'Feed Summary'}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: '#f57f17' }}>
                      {language === 'ml' ? 'ആകെ തുക: ' : 'Total Feed Cost: '}<Text style={{ fontWeight: '800' }}>₹{cropWorkLogs.filter(w => w.activityType === 'Feed / Food').reduce((s, w) => s + w.materialCost, 0).toFixed(0)}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: '#f57f17' }}>
                      {language === 'ml' ? 'ആകെ അളവ്: ' : 'Total Quantity: '}<Text style={{ fontWeight: '800' }}>{cropWorkLogs.filter(w => w.activityType === 'Feed / Food').reduce((s, w) => s + (w.yieldKg || 0), 0)} kg</Text>
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Direct Log Actions */}
            <View style={styles.goatActionsRow}>
              {/* Row 1 */}
              <TouchableOpacity 
                style={[styles.goatActionBtn, { backgroundColor: '#1b3a1e' }]} 
                onPress={() => {
                  setWorkActivity('Buying');
                  setWorkDate(new Date().toISOString().split('T')[0]);
                  setWorkNotes('');
                  setWorkMalesCount('');
                  setWorkFemalesCount('');
                  setWorkBreededGoat('');
                  setWorkMotherGoat('');
                  setWorkMaterialCost('');
                  setShowWorkLogModal(true);
                }}
              >
                <Text style={styles.detailActionBtnText}>🛒 {language === 'ml' ? 'ആടുകളെ വാങ്ങുക' : 'Buy Goats'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.goatActionBtn, { backgroundColor: '#2e7d32' }]} 
                onPress={() => {
                  setEarningsItem(language === 'ml' ? 'ആടുകളെ വിറ്റത്' : 'Goats Sold');
                  setEarningsMalesCount('');
                  setEarningsFemalesCount('');
                  setEarningsKidsCount('');
                  setEarningsTotalAmount('');
                  setEarningsDate(new Date().toISOString().split('T')[0]);
                  setEarningsNotes('');
                  setShowEarningsModal(true);
                }}
              >
                <Text style={styles.detailActionBtnText}>💰 {language === 'ml' ? 'ആടുകളെ വിൽക്കുക' : 'Sell Goats'}</Text>
              </TouchableOpacity>

              {/* Row 2 */}
              <TouchableOpacity 
                style={[styles.goatActionBtn, { backgroundColor: '#8d6e63' }]} 
                onPress={() => {
                  setWorkActivity('Breeding');
                  setWorkDate(new Date().toISOString().split('T')[0]);
                  setWorkNotes('');
                  setWorkMalesCount('');
                  setWorkFemalesCount('');
                  setWorkBreededGoat('');
                  setWorkMotherGoat('');
                  setWorkMaterialCost('');
                  setShowWorkLogModal(true);
                }}
              >
                <Text style={styles.detailActionBtnText}>💕 {language === 'ml' ? 'ഇണചേർക്കൽ' : 'Log Breeding'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.goatActionBtn, { backgroundColor: '#4caf50' }]} 
                onPress={() => {
                  setWorkActivity('New Babies');
                  setWorkDate(new Date().toISOString().split('T')[0]);
                  setWorkNotes('');
                  setWorkMalesCount('');
                  setWorkFemalesCount('');
                  setWorkBreededGoat('');
                  setWorkMotherGoat('');
                  setShowWorkLogModal(true);
                }}
              >
                <Text style={styles.detailActionBtnText}>👶 {language === 'ml' ? 'പ്രസവം / കുഞ്ഞുങ്ങൾ' : 'New Borns'}</Text>
              </TouchableOpacity>

              {/* Row 3 */}
              <TouchableOpacity 
                style={[styles.goatActionBtn, { backgroundColor: '#ff9800' }]} 
                onPress={() => {
                  setFeedType('');
                  setFeedQty('');
                  setFeedCost('');
                  setFeedNotes('');
                  setFeedDate(new Date().toISOString().split('T')[0]);
                  setShowFeedModal(true);
                }}
              >
                <Text style={styles.detailActionBtnText}>🌾 {language === 'ml' ? 'തീറ്റ ചിലവ്' : 'Food Expenses'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.goatActionBtn, { backgroundColor: '#c62828' }]} 
                onPress={() => {
                  setWorkActivity('Medical / Vaccine');
                  setWorkDate(new Date().toISOString().split('T')[0]);
                  setWorkNotes('');
                  setWorkMalesCount('');
                  setWorkFemalesCount('');
                  setWorkBreededGoat('');
                  setWorkMotherGoat('');
                  setWorkMaterialCost('');
                  setShowWorkLogModal(true);
                }}
              >
                <Text style={styles.detailActionBtnText}>💊 {language === 'ml' ? 'മരുന്ന് / വാക്സിൻ ചിലവ്' : 'Medical Exp'}</Text>
              </TouchableOpacity>
            </View>

            {/* Work Timeline */}
            <Text style={styles.sectionTitle}>{t.timelineActivities}</Text>
            {cropWorkLogs.length === 0 ? (
              <View style={styles.emptyLogsBox}>
                <Text style={styles.emptyLogsText}>{t.noActivitiesLogged}</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {cropWorkLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                  <View key={log.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineActivity}>
                          {log.activityType === 'Adding Manure' && log.manureName
                            ? `${translateActivity(log.activityType, language)} (${log.manureName})`
                            : log.activityType === 'Revenue' && log.manureName
                            ? `${translateActivity(log.activityType, language)} (${log.manureName})`
                            : translateActivity(log.activityType, language)
                          }
                        </Text>
                        <Text style={[styles.timelineCost, log.activityType === 'Revenue' && { color: '#2e7d32' }]}>
                          {log.activityType === 'Revenue' ? '+' : ''}₹{log.activityType === 'Revenue' ? log.income?.toFixed(0) : log.totalCost.toFixed(0)}
                        </Text>
                      </View>
                      <Text style={styles.timelineDate}>{log.date}</Text>
                      {log.notes ? <Text style={styles.timelineNotes}>{log.notes}</Text> : null}
                      
                      {(log.activityType === 'Harvesting' || log.activityType === 'Curing' || 
                        log.activityType === 'Buying' || log.activityType === 'New Babies' || log.activityType === 'Feed / Food' || log.activityType === 'Breeding') && 
                       (log.yieldKg || log.rawYieldKg || log.income || log.materialCost) ? (
                        <View style={styles.timelineHarvestDetails}>
                          {log.yieldKg ? (
                            <Text style={styles.timelineHarvestText}>
                              {isGoat ? (
                                log.activityType === 'Buying' ? (language === 'ml' ? '📦 വാങ്ങിയ എണ്ണം: ' : '📦 Goats Bought: ') :
                                log.activityType === 'New Babies' ? (language === 'ml' ? '👶 ഉണ്ടായ കുഞ്ഞുങ്ങൾ: ' : '👶 Kids Born: ') :
                                log.activityType === 'Feed / Food' ? (language === 'ml' ? '🌾 തീറ്റയുടെ അളവ്: ' : '🌾 Feed Qty: ') :
                                '📦 Quantity: '
                              ) : (
                                log.activityType === 'Curing' && isCardamom ? (language === 'ml' ? '📦 ഉണങ്ങിയ അളവ്: ' : '📦 Dried Yield: ') :
                                `📦 ${t.yieldKg}: `
                              )}
                              {log.yieldKg} {isGoat && (log.activityType === 'Buying' || log.activityType === 'New Babies') ? (language === 'ml' ? 'എണ്ണം' : 'nos') : 'kg'}
                            </Text>
                          ) : null}
                          {log.rawYieldKg ? (
                            <Text style={styles.timelineHarvestText}>🌳 {t.rawWeight}: {log.rawYieldKg} kg</Text>
                          ) : null}
                          {log.materialCost && isGoat ? (
                            <Text style={styles.timelineHarvestText}>
                              💵 {log.activityType === 'Breeding' 
                                ? (language === 'ml' ? 'ഇണചേർക്കൽ ചിലവ്: ₹' : 'Breeding Cost: ₹')
                                : (language === 'ml' ? 'ചിലവ്: ₹' : 'Expense: ₹')
                              }{log.materialCost.toFixed(0)}
                            </Text>
                          ) : null}
                          {log.income ? (
                            <Text style={styles.timelineHarvestText}>💰 {t.income}: ₹{log.income.toFixed(0)}</Text>
                          ) : null}
                          {log.motherGoat ? (
                            <Text style={styles.timelineHarvestText}>
                              👩‍👧 {language === 'ml' ? `തള്ളയാട്: ${log.motherGoat}` : `Mother Goat: ${log.motherGoat}`}
                            </Text>
                          ) : null}
                          {log.breededGoat ? (
                            <Text style={styles.timelineHarvestText}>
                              💕 {language === 'ml' ? `ഇണചേർത്ത ആട്: ${log.breededGoat}` : `Bred Goat: ${log.breededGoat}`}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}

                      {log.activityType === 'Revenue' && (log.yieldKg || log.income || log.rawYieldKg || log.processingCharge) ? (
                        <View style={[styles.timelineHarvestDetails, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}>
                          {log.yieldKg ? (
                            <Text style={[styles.timelineHarvestText, { color: '#2e7d32' }]}>📦 {isGoat ? (language === 'ml' ? 'വിറ്റ അളവ്: ' : 'Quantity Sold: ') : `${t.quantitySold}: `}{log.yieldKg}{isGoat ? '' : ' kg'}</Text>
                          ) : null}
                          {log.rawYieldKg ? (
                            <Text style={[styles.timelineHarvestText, { color: '#2e7d32' }]}>🌳 {t.rawWeight}: {log.rawYieldKg} kg</Text>
                          ) : null}
                          {log.processingCharge ? (
                            <Text style={[styles.timelineHarvestText, { color: '#7f8c8d' }]}>⚙️ {language === 'ml' ? 'പ്രൊസസ്സിംഗ് ചിലവ്' : 'Processing Cost'}: ₹{log.processingCharge}</Text>
                          ) : null}
                          {log.pricePerKg ? (
                            <Text style={[styles.timelineHarvestText, { color: '#2e7d32' }]}>🏷️ {isGoat ? (language === 'ml' ? 'യൂണിറ്റ് വില: ' : 'Price/Unit: ') : `${t.pricePerKg}: `}₹{log.pricePerKg}{isGoat ? '' : '/kg'}</Text>
                          ) : null}
                        </View>
                      ) : null}

                      {log.activityType === 'Adding Manure' && log.yieldKg ? (
                        <View style={[styles.timelineHarvestDetails, { backgroundColor: '#efebe9', borderColor: '#d7ccc8' }]}>
                          <Text style={[styles.timelineHarvestText, { color: '#5d4037' }]}>📦 {t.manureQuantity}: {log.yieldKg} kg</Text>
                        </View>
                      ) : null}

                      <View style={styles.timelineBreakdownRow}>
                        {log.noOfWorkers ? (
                          <Text style={styles.timelineMiniBreakdown}>
                            👨‍🌾 {t.noOfWorkers}: {log.noOfWorkers} (₹{log.laborCostPerWorker}/worker)
                          </Text>
                        ) : (
                          <Text style={styles.timelineMiniBreakdown}>
                            {t.laborCost}: ₹{log.laborCost} | {language === 'ml' ? 'സാധനങ്ങൾ' : 'Mat'}: ₹{log.materialCost}
                          </Text>
                        )}
                        <TouchableOpacity style={styles.miniDeleteBtn} onPress={() => handleDeleteActivity(log.id)}>
                          <Text style={styles.miniDeleteBtnText}>{language === 'ml' ? 'ഡിലീറ്റ്' : 'Delete'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
      </ScrollView>

      <Modal 
        visible={showWorkLogModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowWorkLogModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isGoat 
                ? (language === 'ml' ? 'ആട് ഫാം വിവരങ്ങൾ രേഖപ്പെടുത്തുക' : 'Record Goat Farm Activity') 
                : t.logWork
              }
            </Text>
            
            <ScrollView style={styles.modalForm}>
              {isGoat ? (
                <View style={{ backgroundColor: '#f1f5f1', borderRadius: 10, padding: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#1b3a1e' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1b3a1e' }}>
                    {workActivity === 'Buying' ? (language === 'ml' ? '🛒 ആടുകളെ വാങ്ങൽ' : '🛒 Buying Goats') :
                     workActivity === 'Breeding' ? (language === 'ml' ? '💕 പ്രജനനം രേഖപ്പെടുത്തൽ' : '💕 Logging Breeding') :
                     workActivity === 'New Babies' ? (language === 'ml' ? '👶 പ്രസവം / കുഞ്ഞുങ്ങൾ' : '👶 New Born Kids') :
                     (language === 'ml' ? `പ്രവർത്തനം: ${workActivity}` : `Activity: ${workActivity}`)}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'ജോലിയുടെ ഇനം *' : 'Activity Type *'}</Text>
                  <View style={styles.pickerContainer}>
                    {['Weeding', 'Spraying', 'Harvesting', 'Curing', 'Adding Manure', 'Tillage', 'Other'].map(act => {
                      const displayAct = translateActivity(act, language);
                      return (
                        <TouchableOpacity
                          key={act}
                          style={[styles.pickerChip, workActivity === act && styles.pickerChipActive]}
                          onPress={() => setWorkActivity(act)}
                        >
                          <Text style={[styles.pickerChipText, workActivity === act && styles.pickerChipTextActive]}>
                            {displayAct}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TextInput 
                    style={styles.input} 
                    placeholder={language === 'ml' ? 'ഉദാ: കളപറിക്കൽ, വള്ളി കെട്ടൽ, വിളവെടുപ്പ്' : 'e.g. Weeding, Vine Tying, Harvesting'} 
                    value={workActivity} 
                    onChangeText={setWorkActivity} 
                  />
                </>
              )}

              {isGoat ? (
                <>
                  {isBuying && (
                    <>
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{language === 'ml' ? 'വാങ്ങിയ ആൺ ചെമ്മരിയാടുകൾ' : 'Males Bought'}</Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 2" 
                            value={workMalesCount} 
                            onChangeText={setWorkMalesCount} 
                          />
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{language === 'ml' ? 'വാങ്ങിയ പെൺ ചെമ്മരിയാടുകൾ' : 'Females Bought'}</Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 5" 
                            value={workFemalesCount} 
                            onChangeText={setWorkFemalesCount} 
                          />
                        </View>
                      </View>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'വാങ്ങൽ ചിലവ് (₹)' : 'Purchase Cost (₹)'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 25000" 
                        value={workMaterialCost} 
                        onChangeText={setWorkMaterialCost} 
                      />
                    </>
                  )}

                  {isNewBabies && (
                    <>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'തള്ളയാട് *' : 'Mother Goat *'}</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder={language === 'ml' ? 'ഉദാ: തള്ളയുടെ പേര്/നമ്പർ' : 'e.g. Mother Goat name/ID'} 
                        value={workMotherGoat} 
                        onChangeText={setWorkMotherGoat} 
                      />
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{language === 'ml' ? 'ആൺ കുട്ടികൾ' : 'Male Kids Born'}</Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 1" 
                            value={workMalesCount} 
                            onChangeText={setWorkMalesCount} 
                          />
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{language === 'ml' ? 'പെൺ കുട്ടികൾ' : 'Female Kids Born'}</Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 2" 
                            value={workFemalesCount} 
                            onChangeText={setWorkFemalesCount} 
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {workActivity === 'Breeding' && (
                    <>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'ഇണചേർത്ത ആട് *' : 'Bred Goat *'}</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder={language === 'ml' ? 'ഉദാ: ആടിന്റെ പേര്/നമ്പർ' : 'e.g. Bred Goat name/ID'} 
                        value={workBreededGoat} 
                        onChangeText={setWorkBreededGoat} 
                      />
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'ഇണചേർക്കൽ ചിലവ് (₹)' : 'Breeding Cost (₹)'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 1500" 
                        value={workMaterialCost} 
                        onChangeText={setWorkMaterialCost} 
                      />
                    </>
                  )}

                  {workActivity === 'Medical / Vaccine' && (
                    <>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'ചികിത്സ / വാക്സിൻ വിവരങ്ങൾ' : 'Treatment / Vaccine Name'}</Text>
                      <TextInput 
                        style={[styles.input, { height: 44 }]} 
                        placeholder={language === 'ml' ? 'ഉദാ: മരുന്ന് പേര്, കുത്തിവെപ്പ്' : 'e.g. Deworming, FMD Vaccine'} 
                        value={workNotes} 
                        onChangeText={setWorkNotes} 
                      />
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'മരുന്ന് / ചിലവ് തുക (₹)' : 'Medical Cost (₹)'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 500" 
                        value={workMaterialCost} 
                        onChangeText={setWorkMaterialCost} 
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  {isHarvestingOrCuring && (
                    <>
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>
                            {isCardamom 
                              ? (language === 'ml' ? 'ഉണങ്ങിയ അളവ് (Kg)' : 'Dried Yield (Kg)') 
                              : t.yieldKg
                            }
                          </Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 50" 
                            value={workYield} 
                            onChangeText={setWorkYield} 
                          />
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{t.income}</Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 15000" 
                            value={workIncome} 
                            onChangeText={setWorkIncome} 
                          />
                        </View>
                      </View>
                      {isCardamom && (
                        <View style={styles.row}>
                          <View style={styles.col}>
                            <Text style={styles.inputLabel}>{t.rawWeightOptional}</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              placeholder={t.rawWeightPlaceholder} 
                              value={workRawYield} 
                              onChangeText={setWorkRawYield} 
                            />
                          </View>
                          <View style={styles.col} />
                        </View>
                      )}
                    </>
                  )}

                  <Text style={styles.inputLabel}>{language === 'ml' ? 'സാധനങ്ങളുടെ ചിലവ് (₹)' : 'Material Cost (₹)'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 1500" 
                    value={workMaterialCost} 
                    onChangeText={setWorkMaterialCost} 
                  />
                </>
              )}

              {!isGoat && (
                <>
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>{t.noOfWorkers}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 4" 
                        value={workWorkers} 
                        onChangeText={setWorkWorkers} 
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>{t.laborCostPerWorker}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 600" 
                        value={workLaborCostPerWorker} 
                        onChangeText={setWorkLaborCostPerWorker} 
                      />
                    </View>
                  </View>

                  {/* Auto Calculated Preview */}
                  <View style={styles.autoCalcBox}>
                    <Text style={styles.autoCalcLabel}>{t.totalLaborCost}</Text>
                    <Text style={styles.autoCalcVal}>₹{liveWorkTotalLaborCost.toLocaleString('en-US')}</Text>
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>{t.date}</Text>
              <CustomDatePicker 
                value={workDate} 
                onChange={setWorkDate} 
                language={language} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline={true} value={workNotes} onChangeText={setWorkNotes} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowWorkLogModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddWorkLogSubmit}>
                <Text style={styles.saveBtnText}>{t.logActivity}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>



      {/* Record Earnings Modal */}
      <Modal 
        visible={showEarningsModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowEarningsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isGoat 
                ? (language === 'ml' ? 'ആടുകളെ വിറ്റ വിവരം രേഖപ്പെടുത്തുക' : 'Record Goat Sales')
                : t.addEarnings
              }
            </Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{isGoat ? (language === 'ml' ? 'വിശദാംശങ്ങൾ' : 'Sale Label / Details') : t.sellingItem}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={isGoat 
                  ? (language === 'ml' ? 'ഉദാ: ആടുകളെ വിറ്റത്' : 'e.g. Goats Sold')
                  : (language === 'ml' ? 'ഉദാ: കുരുമുളക് വിറ്റത്, ഉണക്ക ഏലക്ക' : 'e.g. Black Pepper, Green Cardamom')
                } 
                value={earningsItem} 
                onChangeText={setEarningsItem} 
              />

                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'വിറ്റ ആൺ ആടുകൾ' : 'Males Sold'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 1" 
                        value={earningsMalesCount} 
                        onChangeText={setEarningsMalesCount} 
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'വിറ്റ പെൺ ആടുകൾ' : 'Females Sold'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 2" 
                        value={earningsFemalesCount} 
                        onChangeText={setEarningsFemalesCount} 
                      />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'വിറ്റ കുട്ടികൾ' : 'Kids Sold'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 1" 
                        value={earningsKidsCount} 
                        onChangeText={setEarningsKidsCount} 
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'ആകെ തുക (₹) *' : 'Total Revenue (₹) *'}</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 35000" 
                        value={earningsTotalAmount} 
                        onChangeText={setEarningsTotalAmount} 
                      />
                    </View>
                  </View>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <CustomDatePicker 
                value={earningsDate} 
                onChange={setEarningsDate} 
                language={language} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline={true} value={earningsNotes} onChangeText={setEarningsNotes} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowEarningsModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#2e7d32' }]} onPress={handleAddEarningsSubmit}>
                <Text style={styles.saveBtnText}>{isGoat ? (language === 'ml' ? 'വിൽപ്പന രേഖപ്പെടുത്തുക' : 'Record Sale') : t.addEarnings}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>



      {/* Adjust Inventory Modal */}
      <Modal 
        visible={showAdjustModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ⚙️ {language === 'ml' ? 'എണ്ണം ക്രമീകരിക്കുക / തിരുത്തുക' : 'Adjust Inventory'}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15, lineHeight: 18 }}>
              {language === 'ml' 
                ? 'നിലവിലുള്ള ആടുകളുടെ എണ്ണം ഇവിടെ നേരിട്ട് മാറ്റിയെഴുതാവുന്നതാണ്. ഇത് മുൻപുള്ള വിവരങ്ങളെ ബാധിക്കില്ല.' 
                : 'Directly override the counts of your goats in stock. This manual adjustment won\'t affect historical logs.'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'ആൺ ആടുകൾ' : 'Males'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={adjustMales} 
                onChangeText={setAdjustMales} 
              />

              <Text style={styles.inputLabel}>{language === 'ml' ? 'പെൺ ആടുകൾ' : 'Females'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={adjustFemales} 
                onChangeText={setAdjustFemales} 
              />

              <Text style={styles.inputLabel}>{language === 'ml' ? 'കുട്ടികൾ' : 'Kids'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={adjustKids} 
                onChangeText={setAdjustKids} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAdjustModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#1b3a1e' }]} onPress={handleAdjustInventorySubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'മാറ്റം വരുത്തുക' : 'Update Counts'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Stage Count / Manual Entry Modal */}
      <Modal 
        visible={showStageCountModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowStageCountModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🐐 {translateStage(targetStageForModal, language, true)}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15, lineHeight: 18 }}>
              {language === 'ml' 
                ? `ഈ ഘട്ടത്തിലുള്ള ആടുകളുടെ എണ്ണം പരിശോധിക്കുകയോ നേരിട്ട് മാറ്റി എഴുതുകയോ ചെയ്യാം.` 
                : `View or manually enter the number of goats currently in this growth stage.`}
            </Text>

            <Text style={styles.inputLabel}>
              {language === 'ml' ? 'ആടുകളുടെ എണ്ണം *' : 'Number of Goats *'}
            </Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="e.g. 10"
              value={stageCountValue} 
              onChangeText={setStageCountValue} 
            />

            <View style={{ gap: 10, marginTop: 15, width: '100%' }}>
              <TouchableOpacity 
                style={[styles.saveFeedBtn, { backgroundColor: '#1b3a1e', marginTop: 0 }]} 
                onPress={() => handleStageCountSubmit(true)}
              >
                <Text style={styles.saveFeedBtnText}>
                  ✔️ {language === 'ml' ? 'സജീവ ഘട്ടമാക്കുക & സംരക്ഷിക്കുക' : 'Set Active Stage & Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveFeedBtn, { backgroundColor: '#8d6e63', marginTop: 0 }]} 
                onPress={() => handleStageCountSubmit(false)}
              >
                <Text style={styles.saveFeedBtnText}>
                  💾 {language === 'ml' ? 'എണ്ണം മാത്രം സംരക്ഷിക്കുക' : 'Save Count Only'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn, { alignSelf: 'center', marginTop: 5 }]} 
                onPress={() => setShowStageCountModal(false)}
              >
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Food Expenses Modal */}
      <Modal 
        visible={showFeedModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowFeedModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🌾 {language === 'ml' ? 'തീറ്റ ചിലവ് രേഖപ്പെടുത്തുക' : 'Log Feed Expense'}
            </Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീറ്റയുടെ ഇനം *' : 'Feed Type *'}</Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'ml' ? 'ഉദാ: പുല്ല്, ആട്ടിൻ തീറ്റ, തവിട്' : 'e.g. Grass, Goat Feed, Bran'}
                value={feedType}
                onChangeText={setFeedType}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'അളവ് (Kg)' : 'Quantity (Kg)'}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="e.g. 25"
                    value={feedQty}
                    onChangeText={setFeedQty}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'ചിലവ് തുക (₹) *' : 'Cost Amount (₹) *'}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="e.g. 800"
                    value={feedCost}
                    onChangeText={setFeedCost}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി *' : 'Date *'}</Text>
              <CustomDatePicker 
                value={feedDate} 
                onChange={setFeedDate} 
                language={language} 
              />

              <Text style={styles.inputLabel}>{language === 'ml' ? 'കുറിപ്പുകൾ' : 'Notes'}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline={true}
                placeholder={language === 'ml' ? 'അധിക വിവരങ്ങൾ...' : 'Additional notes...'}
                value={feedNotes}
                onChangeText={setFeedNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowFeedModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#ff9800' }]} onPress={handleAddFeedExpenseSubmit}>
                <Text style={styles.saveFeedBtnText}>{language === 'ml' ? 'ചിലവ് സംരക്ഷിക്കുക' : 'Save Expense'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getStageColor(stage: string): string {
  switch (stage) {
    case 'Seedling': return '#81c784';
    case 'Vegetative': return '#4caf50';
    case 'Flowering': return '#e91e63';
    case 'Fruiting': return '#ff9800';
    case 'Harvested': return '#795548';
    default: return '#9e9e9e';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#1b3a1e',
    fontSize: 14,
    fontWeight: '700',
  },
  withholdingAlertCard: {
    backgroundColor: '#fde8e8',
    borderWidth: 1,
    borderColor: '#fbd5d5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
  },
  withholdingAlertTitle: {
    color: '#e53e3e',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  withholdingAlertText: {
    color: '#c53030',
    fontSize: 12,
    fontWeight: '500',
  },
  detailHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1b3a1e',
    marginVertical: 6,
  },
  detailSub: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fbf9',
    borderRadius: 10,
    padding: 12,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: '700',
  },
  dateVal: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
    marginTop: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#2c3e50',
    fontStyle: 'italic',
    marginTop: 15,
    backgroundColor: '#f5f7f5',
    padding: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b3a1e',
    marginTop: 20,
    marginBottom: 10,
  },
  stagePickerScroll: {
    marginBottom: 15,
  },
  stagePickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  stagePickerText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  expenseSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ledgerHeaderCol: {
    flex: 1,
  },
  expenseSummaryTitle: {
    fontSize: 11,
    color: '#7f8c8d',
    fontWeight: '700',
  },
  expenseSummaryVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c3e50',
    marginTop: 4,
  },
  ledgerDivider: {
    height: 0.5,
    backgroundColor: '#e2e8e2',
    marginVertical: 12,
  },
  ledgerProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerProfitLabel: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '700',
  },
  ledgerProfitValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  expenseSummaryBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: '700',
  },
  breakdownSubVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 2,
  },
  detailActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  detailActionBtn: {
    flex: 1,
    backgroundColor: '#1b3a1e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  timelineContainer: {
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8e2',
    marginLeft: 8,
    paddingLeft: 12,
    marginBottom: 20,
  },
  timelineItem: {
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -19,
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  timelineContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineActivity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  timelineCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  timelineDate: {
    fontSize: 11,
    color: '#7f8c8d',
    marginVertical: 2,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#555',
    backgroundColor: '#f9fbf9',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  timelineHarvestDetails: {
    flexDirection: 'row',
    backgroundColor: '#f1f8e9',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  timelineHarvestText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#33691e',
    marginRight: 10,
  },
  timelineBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f1',
    paddingTop: 6,
  },
  timelineMiniBreakdown: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  miniDeleteBtn: {
    padding: 4,
  },
  miniDeleteBtnText: {
    fontSize: 10,
    color: '#e53e3e',
    fontWeight: '700',
  },
  pestLogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pestLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f1',
    paddingBottom: 6,
    marginBottom: 8,
  },
  pestName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  pestCost: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  pestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pestGridItem: {
    width: '50%',
    marginBottom: 8,
  },
  pestGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  pestGridVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 1,
  },
  deleteBtn: {
    marginTop: 30,
    backgroundColor: '#fde8e8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbd5d5',
  },
  deleteBtnText: {
    color: '#c53030',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyLogsBox: {
    padding: 30,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontSize: 13,
    color: '#95a5a6',
  },
  pesticideApplications: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b3a1e',
    marginTop: 25,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b3a1e',
    marginBottom: 15,
  },
  modalForm: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6e8070',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f1f5f1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8e2',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#f1f5f1',
  },
  cancelBtnText: {
    color: '#6e8070',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#1b3a1e',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f1',
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#e2e8e2',
  },
  pickerChipActive: {
    backgroundColor: '#1b3a1e',
    borderColor: '#1b3a1e',
  },
  pickerChipText: {
    fontSize: 11,
    color: '#555',
  },
  pickerChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  autoCalcBox: {
    backgroundColor: '#fcf8e3',
    borderWidth: 0.5,
    borderColor: '#faf2cc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoCalcLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a6d3b',
  },
  autoCalcVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8a6d3b',
  },
  helperText: {
    fontSize: 10,
    color: '#6e8070',
    marginTop: 4,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  choiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  choiceModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b3a1e',
    marginBottom: 20,
  },
  choiceButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  choiceCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: '#fdfdfd',
  },
  choiceCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  choiceCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  choiceCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  choiceCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  goatActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  goatActionBtn: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  inventoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8e2',
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b3a1e',
    marginBottom: 16,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  inventoryCol: {
    alignItems: 'center',
  },
  inventoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  inventoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inventoryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1b3a1e',
  },
  inventoryDivider: {
    height: 1,
    backgroundColor: '#f1f1f1',
    marginVertical: 12,
  },
  inventoryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  inventoryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },
  inventoryTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1b3a1e',
  },
  adjustInventoryBtn: {
    backgroundColor: '#f1f5f1',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#d0dfd0',
  },
  adjustInventoryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8f0e8',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabButtonActive: {
    backgroundColor: '#1b3a1e',
  },
  subTabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6e8070',
  },
  subTabButtonTextActive: {
    color: '#ffffff',
  },
  feedTabContainer: {
    marginBottom: 20,
  },
  feedFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8e2',
  },
  feedFormTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b3a1e',
    marginBottom: 12,
  },
  saveFeedBtn: {
    backgroundColor: '#1b3a1e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveFeedBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  feedSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8e2',
  },
  feedSummaryText: {
    fontSize: 14,
    color: '#555',
  },
  feedLogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8e2',
  },
  feedLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  feedLogDate: {
    fontSize: 12,
    color: '#888',
  },
  feedLogCost: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff5252',
  },
  feedLogNotes: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  feedLogQty: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
  },
  feedLogDeleteBtn: {
    alignSelf: 'flex-end',
  },
  feedLogDeleteBtnText: {
    fontSize: 11,
    color: '#ff5252',
    fontWeight: '700',
  },
});
