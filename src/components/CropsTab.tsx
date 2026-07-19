import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Crop, CropStage, WorkLog, PesticideLog } from '../types';
import { Language, TRANSLATIONS, translateStage, translateActivity } from '../translations';

interface CropsTabProps {
  crops: Crop[];
  workLogs: WorkLog[];
  pesticideLogs: PesticideLog[];
  onAddCrop: (crop: Omit<Crop, 'id'>) => Promise<any>;
  onUpdateCrop: (crop: Crop) => Promise<any>;
  onDeleteCrop: (id: string) => Promise<any>;
  selectedCrop: Crop | null;
  onSelectCrop: (crop: Crop | null) => void;
  onAddWorkLog: (log: Omit<WorkLog, 'id' | 'totalCost'>) => Promise<any>;
  onDeleteWorkLog: (id: string) => Promise<any>;
  onAddPesticideLog: (log: Omit<PesticideLog, 'id'>) => Promise<any>;
  onDeletePesticideLog: (id: string) => Promise<any>;
  language: Language;
}

const STAGES: CropStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvested', 'Archived'];
const ACTIVITIES = [
  'Tillage', 'Planting', 'Weeding', 'Irrigation', 'Pruning', 'Spraying', 'Harvesting',
  'Adding Manure', 'Vine Tying', 'Shade Regulation', 'Trashing', 'Curing', 'Other'
];

export default function CropsTab({
  crops,
  workLogs,
  pesticideLogs,
  onAddCrop,
  onUpdateCrop,
  onDeleteCrop,
  selectedCrop,
  onSelectCrop,
  onAddWorkLog,
  onDeleteWorkLog,
  onAddPesticideLog,
  onDeletePesticideLog,
  language,
}: CropsTabProps) {
  const t = TRANSLATIONS[language];

  // Work Log Form States
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [workActivity, setWorkActivity] = useState<string>('');

  const isHarvesting = workActivity.trim().toLowerCase().includes('harvest') || 
                       workActivity.trim().includes('വിളവെടുപ്പ്') || 
                       workActivity.trim().includes('വിളവെടുക്');
  
  const [workWorkers, setWorkWorkers] = useState<string>('');
  const [workLaborCostPerWorker, setWorkLaborCostPerWorker] = useState<string>('');
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workNotes, setWorkNotes] = useState<string>('');
  const [workYield, setWorkYield] = useState<string>('');
  const [workIncome, setWorkIncome] = useState<string>('');

  // Input Selection Modal State
  const [showInputChoiceModal, setShowInputChoiceModal] = useState(false);

  // Dedicated Manure Log Form States
  const [showManureLogModal, setShowManureLogModal] = useState(false);
  const [manureLogName, setManureLogName] = useState<string>('');
  const [manureLogQty, setManureLogQty] = useState<string>('');
  const [manureLogCost, setManureLogCost] = useState<string>('0');
  const [manureLogWorkers, setManureLogWorkers] = useState<string>('');
  const [manureLogLaborCost, setManureLogLaborCost] = useState<string>('');
  const [manureLogDate, setManureLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manureLogNotes, setManureLogNotes] = useState<string>('');

  // Spray Log Form States
  const [showSprayLogModal, setShowSprayLogModal] = useState(false);
  const [sprayPesticideName, setSprayPesticideName] = useState<string>('');
  const [sprayTargetPest, setSprayTargetPest] = useState<string>('');
  const [sprayActiveIngredient, setSprayActiveIngredient] = useState<string>('');
  const [sprayDosage, setSprayDosage] = useState<string>('');
  const [sprayQuantity, setSprayQuantity] = useState<string>('');
  const [sprayDate, setSprayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sprayWithholdingDays, setSprayWithholdingDays] = useState<string>('');
  const [sprayReentryHours, setSprayReentryHours] = useState<string>('');
  const [sprayWorkers, setSprayWorkers] = useState<string>('');
  const [sprayLaborCostPerWorker, setSprayLaborCostPerWorker] = useState<string>('');
  const [sprayPesticideCost, setSprayPesticideCost] = useState<string>('');

  // Earnings Form States
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [earningsItem, setEarningsItem] = useState<string>('');
  const [earningsQuantity, setEarningsQuantity] = useState<string>('');
  const [earningsPricePerKg, setEarningsPricePerKg] = useState<string>('');
  const [earningsDate, setEarningsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earningsNotes, setEarningsNotes] = useState<string>('');

  if (!selectedCrop) return null;

  const cropWorkLogs = workLogs.filter(w => w.cropId === selectedCrop.id);
  const cropPestLogs = pesticideLogs.filter(p => (p.cropIds || []).includes(selectedCrop.id));

  const laborCost = cropWorkLogs.reduce((sum, l) => sum + l.laborCost, 0);
  const materialCost = cropWorkLogs.reduce((sum, l) => sum + l.materialCost, 0);
  const equipmentCost = cropWorkLogs.reduce((sum, l) => sum + l.equipmentCost, 0);
  const totalCost = laborCost + materialCost + equipmentCost;
  
  const totalRevenue = cropWorkLogs.reduce((sum, l) => sum + (l.income || 0), 0);
  const netProfit = totalRevenue - totalCost;

  // Calculate withholding warning for this crop
  let withholdingDaysLeft = 0;
  let warningPesticideName = '';
  const todayTime = new Date(new Date().toISOString().split('T')[0]).getTime();
  
  cropPestLogs.forEach(pest => {
    if (pest.withholdingDays && pest.withholdingDays > 0) {
      const sprayTime = new Date(pest.date).getTime();
      const daysPassed = (todayTime - sprayTime) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.ceil(pest.withholdingDays - daysPassed);
      if (daysLeft > 0 && daysLeft > withholdingDaysLeft) {
        withholdingDaysLeft = daysLeft;
        warningPesticideName = pest.pesticideName;
      }
    }
  });

  const handleStageChange = async (newStage: CropStage) => {
    const updated: Crop = { ...selectedCrop, stage: newStage };
    await onUpdateCrop(updated);
  };

  const handleDelete = () => {
    Alert.alert(
      language === 'ml' ? 'വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Delete Crop',
      language === 'ml' 
        ? `"${selectedCrop.name}" എന്ന വിളയുടെ എല്ലാ വിവരങ്ങളും ഇതിലൂടെ പൂർണ്ണമായി ഒഴിവാക്കപ്പെടും. തുടരണോ?` 
        : `Are you sure you want to delete "${selectedCrop.name}"? This will also delete all related work logs, expenses, and pesticide application records.`,
      [
        { text: language === 'ml' ? 'വേണ്ട' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeleteCrop(selectedCrop.id);
            onSelectCrop(null);
          },
        },
      ]
    );
  };

  const handleAddWorkLogSubmit = async () => {
    if (!workActivity.trim()) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'ജോലിയുടെ ഇനം നൽകുക.' : 'Please enter the activity type.'
      );
      return;
    }
    if (!workWorkers || !workLaborCostPerWorker) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'തൊഴിലാളികളുടെ എണ്ണവും കൂലിയും നൽകുക.' : 'Please enter number of workers and labor cost per worker.'
      );
      return;
    }
    const workersNum = Number(workWorkers) || 0;
    const costPerWorkerNum = Number(workLaborCostPerWorker) || 0;
    const calculatedLaborCost = workersNum * costPerWorkerNum;

    const logData = {
      cropId: selectedCrop.id,
      activityType: workActivity.trim(),
      date: workDate,
      durationMinutes: 0,
      laborCost: calculatedLaborCost,
      materialCost: 0,
      equipmentCost: 0,
      notes: workNotes,
      noOfWorkers: workersNum,
      laborCostPerWorker: costPerWorkerNum,
      manureName: undefined,
      yieldKg: isHarvesting ? (Number(workYield) || undefined) : undefined,
      income: isHarvesting ? (Number(workIncome) || undefined) : undefined,
    };

    await onAddWorkLog(logData);
    setShowWorkLogModal(false);
    
    // Reset work form
    setWorkActivity('');
    setWorkWorkers('');
    setWorkLaborCostPerWorker('');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setWorkNotes('');
    setWorkYield('');
    setWorkIncome('');
  };

  const handleAddManureLogSubmit = async () => {
    if (!manureLogName.trim() || !manureLogQty || !manureLogWorkers || !manureLogLaborCost) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'വളത്തിന്റെ പേര്, അളവ്, തൊഴിലാളികൾ, കൂലി എന്നിവ നൽകുക.' : 'Please enter manure name, quantity, workers, and labor cost per worker.'
      );
      return;
    }

    const workersNum = Number(manureLogWorkers) || 0;
    const costPerWorkerNum = Number(manureLogLaborCost) || 0;
    const calculatedLaborCost = workersNum * costPerWorkerNum;
    const materialCostNum = Number(manureLogCost) || 0;
    const qtyNum = Number(manureLogQty) || 0;

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Adding Manure',
      date: manureLogDate,
      durationMinutes: 0,
      laborCost: calculatedLaborCost,
      materialCost: materialCostNum,
      equipmentCost: 0,
      notes: manureLogNotes.trim(),
      manureName: manureLogName.trim(),
      yieldKg: qtyNum,
      income: undefined,
      noOfWorkers: workersNum,
      laborCostPerWorker: costPerWorkerNum,
    };

    await onAddWorkLog(logData);
    setShowManureLogModal(false);

    // Reset manure log form
    setManureLogName('');
    setManureLogQty('');
    setManureLogCost('0');
    setManureLogWorkers('');
    setManureLogLaborCost('');
    setManureLogDate(new Date().toISOString().split('T')[0]);
    setManureLogNotes('');
  };

  const handleAddSprayLogSubmit = async () => {
    if (!sprayPesticideName) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'കീടനാശിനിയുടെ പേര് നൽകുക.' : 'Please enter pesticide name.'
      );
      return;
    }

    const workersNum = Number(sprayWorkers) || 0;
    const costPerWorkerNum = Number(sprayLaborCostPerWorker) || 0;
    const pesticideCostNum = Number(sprayPesticideCost) || 0;

    const logData = {
      cropIds: [selectedCrop.id],
      pesticideName: sprayPesticideName,
      dosage: sprayDosage,
      appliedQuantity: sprayQuantity,
      date: sprayDate,
      targetPest: sprayTargetPest.trim() || undefined,
      activeIngredient: sprayActiveIngredient.trim() || undefined,
      reentryHours: Number(sprayReentryHours) || undefined,
      withholdingDays: Number(sprayWithholdingDays) || undefined,
      cost: pesticideCostNum,
      noOfWorkers: workersNum,
      laborCostPerWorker: costPerWorkerNum,
    };

    await onAddPesticideLog(logData);
    setShowSprayLogModal(false);

    // Reset spray form
    setSprayPesticideName('');
    setSprayTargetPest('');
    setSprayActiveIngredient('');
    setSprayDosage('');
    setSprayQuantity('');
    setSprayDate(new Date().toISOString().split('T')[0]);
    setSprayWithholdingDays('');
    setSprayReentryHours('');
    setSprayWorkers('');
    setSprayLaborCostPerWorker('');
    setSprayPesticideCost('');
  };

  const handleAddEarningsSubmit = async () => {
    if (!earningsItem.trim() || !earningsQuantity || !earningsPricePerKg) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'ഉൽപ്പന്നം, അളവ്, കിലോ വില എന്നിവ പൂരിപ്പിക്കുക.' : 'Please enter item, quantity, and price per kg.'
      );
      return;
    }

    const qty = Number(earningsQuantity) || 0;
    const rate = Number(earningsPricePerKg) || 0;
    const calculatedIncome = qty * rate;

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
      yieldKg: qty,
      income: calculatedIncome,
      pricePerKg: rate,
    };

    await onAddWorkLog(logData);
    setShowEarningsModal(false);

    // Reset earnings form
    setEarningsItem('');
    setEarningsQuantity('');
    setEarningsPricePerKg('');
    setEarningsNotes('');
    setEarningsDate(new Date().toISOString().split('T')[0]);
  };

  // Dynamic calculations for preview in UI
  const liveWorkTotalLaborCost = (Number(workWorkers) || 0) * (Number(workLaborCostPerWorker) || 0);
  
  const liveSprayLaborCost = (Number(sprayWorkers) || 0) * (Number(sprayLaborCostPerWorker) || 0);
  const liveSprayTotalCost = liveSprayLaborCost + (Number(sprayPesticideCost) || 0);

  const liveEarningsTotalAmount = (Number(earningsQuantity) || 0) * (Number(earningsPricePerKg) || 0);

  const liveManureLaborCost = (Number(manureLogWorkers) || 0) * (Number(manureLogLaborCost) || 0);
  const liveManureTotalCost = liveManureLaborCost + (Number(manureLogCost) || 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => onSelectCrop(null)}>
          <Text style={styles.backButtonText}>{t.backToList}</Text>
        </TouchableOpacity>

        {/* Safety Withholding Warning Banner */}
        {withholdingDaysLeft > 0 && (
          <View style={styles.withholdingAlertCard}>
            <Text style={styles.withholdingAlertTitle}>
              {language === 'ml' ? '⚠️ വിളവെടുപ്പ് വിലക്ക് നിലവിലുണ്ട്!' : '⚠️ HARVEST WITHHOLDING ACTIVE!'}
            </Text>
            <Text style={styles.withholdingAlertText}>
              {language === 'ml' 
                ? `${warningPesticideName} ഉപയോഗിച്ചതിനാൽ അടുത്ത ${withholdingDaysLeft} ദിവസത്തേക്ക് വിളവെടുക്കരുത്.` 
                : `Sprayed with ${warningPesticideName}. Do not harvest for the next ${withholdingDaysLeft} days.`
              }
            </Text>
          </View>
        )}

        {/* Header Block */}
        <View style={styles.detailHeaderCard}>
          <Text style={styles.detailType}>{selectedCrop.type} • {selectedCrop.variety || 'Standard Variety'}</Text>
          <Text style={styles.detailTitle}>{selectedCrop.name}</Text>
          <Text style={styles.detailSub}>{selectedCrop.field}</Text>
          
          <View style={styles.datesContainer}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>{t.planted}</Text>
              <Text style={styles.dateVal}>{selectedCrop.plantingDate}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>{t.estHarvest}</Text>
              <Text style={styles.dateVal}>{selectedCrop.expectedHarvestDate}</Text>
            </View>
          </View>

          {selectedCrop.notes ? (
            <Text style={styles.notesText}>💡 {selectedCrop.notes}</Text>
          ) : null}
        </View>

        {/* Change Stage Section */}
        <Text style={styles.sectionTitle}>{t.updateGrowthStage}</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.stagePickerScroll}>
          {STAGES.map((stg) => {
            const isSelected = selectedCrop.stage === stg;
            return (
              <TouchableOpacity
                key={stg}
                style={[
                  styles.stagePickerItem,
                  isSelected && { backgroundColor: getStageColor(stg), borderColor: getStageColor(stg) },
                ]}
                onPress={() => handleStageChange(stg)}
              >
                <Text style={[styles.stagePickerText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                  {translateStage(stg, language)}
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

          <View style={styles.ledgerDivider} />

          <View style={styles.expenseSummaryBreakdown}>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>👨‍🌾 {t.laborCost}</Text>
              <Text style={styles.breakdownSubVal}>₹{laborCost.toFixed(0)}</Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>🌱 {language === 'ml' ? 'വസ്തുക്കൾ' : 'Materials'}</Text>
              <Text style={styles.breakdownSubVal}>₹{materialCost.toFixed(0)}</Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>🚜 {language === 'ml' ? 'ഉപകരണങ്ങൾ' : 'Equip/Fuel'}</Text>
              <Text style={styles.breakdownSubVal}>₹{equipmentCost.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Direct Log Actions */}
        <View style={styles.detailActionsRow}>
          <TouchableOpacity style={styles.detailActionBtn} onPress={() => setShowWorkLogModal(true)}>
            <Text style={styles.detailActionBtnText}>➕ {t.logWork}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: '#4caf50' }]} onPress={() => setShowInputChoiceModal(true)}>
            <Text style={styles.detailActionBtnText}>🧪 {t.sprayOrManure}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: '#2e7d32' }]} onPress={() => setShowEarningsModal(true)}>
            <Text style={styles.detailActionBtnText}>💰 {t.addEarnings}</Text>
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
                  
                  {log.activityType === 'Harvesting' && (log.yieldKg || log.income) ? (
                    <View style={styles.timelineHarvestDetails}>
                      {log.yieldKg ? (
                        <Text style={styles.timelineHarvestText}>📦 {t.yieldKg}: {log.yieldKg} kg</Text>
                      ) : null}
                      {log.income ? (
                        <Text style={styles.timelineHarvestText}>💰 {t.income}: ₹{log.income.toFixed(0)}</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {log.activityType === 'Revenue' && (log.yieldKg || log.income) ? (
                    <View style={[styles.timelineHarvestDetails, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}>
                      {log.yieldKg ? (
                        <Text style={[styles.timelineHarvestText, { color: '#2e7d32' }]}>📦 {t.quantitySold}: {log.yieldKg} kg</Text>
                      ) : null}
                      {log.pricePerKg ? (
                        <Text style={[styles.timelineHarvestText, { color: '#2e7d32' }]}>🏷️ {t.pricePerKg}: ₹{log.pricePerKg}/kg</Text>
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
                    <TouchableOpacity style={styles.miniDeleteBtn} onPress={() => onDeleteWorkLog(log.id)}>
                      <Text style={styles.miniDeleteBtnText}>{language === 'ml' ? 'ഡിലീറ്റ്' : 'Delete'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pesticide Logs */}
        {cropPestLogs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t.pesticideApplications}</Text>
            {cropPestLogs.map((pest) => (
              <View key={pest.id} style={styles.pestLogCard}>
                <View style={styles.pestLogHeader}>
                  <Text style={styles.pestName}>{pest.pesticideName}</Text>
                  <Text style={styles.pestCost}>{pest.date}</Text>
                </View>
                <View style={styles.pestGrid}>
                  <View style={styles.pestGridItem}>
                    <Text style={styles.pestGridLabel}>{language === 'ml' ? 'അളവ് / തോത്' : 'DOSAGE'}</Text>
                    <Text style={styles.pestGridVal}>{pest.dosage || 'Not specified'}</Text>
                  </View>
                  <View style={styles.pestGridItem}>
                    <Text style={styles.pestGridLabel}>{language === 'ml' ? 'ലായനിയുടെ അളവ്' : 'QUANTITY MIXED'}</Text>
                    <Text style={styles.pestGridVal}>{pest.appliedQuantity || 'Not specified'}</Text>
                  </View>
                  {pest.targetPest ? (
                    <View style={styles.pestGridItem}>
                      <Text style={styles.pestGridLabel}>{language === 'ml' ? 'രോഗം / കീടം' : 'TARGET PEST'}</Text>
                      <Text style={styles.pestGridVal}>{pest.targetPest}</Text>
                    </View>
                  ) : null}
                  {pest.noOfWorkers ? (
                    <View style={styles.pestGridItem}>
                      <Text style={styles.pestGridLabel}>👨‍🌾 {t.noOfWorkers}</Text>
                      <Text style={styles.pestGridVal}>{pest.noOfWorkers} (₹{pest.laborCostPerWorker}/worker)</Text>
                    </View>
                  ) : null}
                  {pest.cost ? (
                    <View style={styles.pestGridItem}>
                      <Text style={styles.pestGridLabel}>{t.pesticideCost}</Text>
                      <Text style={styles.pestGridVal}>₹{pest.cost}</Text>
                    </View>
                  ) : null}
                  {pest.reentryHours ? (
                    <View style={styles.pestGridItem}>
                      <Text style={styles.pestGridLabel}>{language === 'ml' ? 'പ്രവേശന വിലക്ക്' : 'RE-ENTRY'}</Text>
                      <Text style={styles.pestGridVal}>{pest.reentryHours} {language === 'ml' ? 'മണിക്കൂർ' : 'Hours'}</Text>
                    </View>
                  ) : null}
                  {pest.withholdingDays ? (
                    <View style={styles.pestGridItem}>
                      <Text style={styles.pestGridLabel}>{language === 'ml' ? 'വിളവെടുപ്പ് വിലക്ക്' : 'WITHHOLDING'}</Text>
                      <Text style={[styles.pestGridVal, { color: '#dc3545', fontWeight: '700' }]}>{pest.withholdingDays} {language === 'ml' ? 'ദിവസം' : 'Days'}</Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.miniDeleteBtn} onPress={() => onDeletePesticideLog(pest.id)}>
                  <Text style={styles.miniDeleteBtnText}>{language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete Spray'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Delete crop cycle */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>{t.deleteCropCycle}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Log Work Modal */}
      <Modal visible={showWorkLogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.logWork}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'ജോലിയുടെ ഇനം *' : 'Activity Type *'}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={language === 'ml' ? 'ഉദാ: കളപറിക്കൽ, വള്ളി കെട്ടൽ, വിളവെടുപ്പ്' : 'e.g. Weeding, Vine Tying, Harvesting'} 
                value={workActivity} 
                onChangeText={setWorkActivity} 
              />



              {isHarvesting && (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>{t.yieldKg}</Text>
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
              )}

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

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput style={styles.input} value={workDate} onChangeText={setWorkDate} />

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
        </View>
      </Modal>

      {/* Spray Log Modal */}
      <Modal visible={showSprayLogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.sprayLog}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{t.pesticideProductName}</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Copper Fungicide, Neem Oil" 
                value={sprayPesticideName} 
                onChangeText={setSprayPesticideName} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.targetPest}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Thrips, Wilt" 
                    value={sprayTargetPest} 
                    onChangeText={setSprayTargetPest} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.activeIngredient}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Copper" 
                    value={sprayActiveIngredient} 
                    onChangeText={setSprayActiveIngredient} 
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.dosageRate}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 15ml / Litre" 
                    value={sprayDosage} 
                    onChangeText={setSprayDosage} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'ലായനിയുടെ അളവ്' : 'Quantity Mixed'}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 20 Litres" 
                    value={sprayQuantity} 
                    onChangeText={setSprayQuantity} 
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.reentryHours}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric"
                    placeholder="e.g. 24" 
                    value={sprayReentryHours} 
                    onChangeText={setSprayReentryHours} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.withholdingDays}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric"
                    placeholder="e.g. 7" 
                    value={sprayWithholdingDays} 
                    onChangeText={setSprayWithholdingDays} 
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.noOfWorkers}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 2" 
                    value={sprayWorkers} 
                    onChangeText={setSprayWorkers} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.laborCostPerWorker}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 600" 
                    value={sprayLaborCostPerWorker} 
                    onChangeText={setSprayLaborCostPerWorker} 
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{t.pesticideCostLabel}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                placeholder="e.g. 800"
                value={sprayPesticideCost} 
                onChangeText={setSprayPesticideCost} 
              />

              {/* Auto Calculated Previews */}
              <View style={styles.autoCalcBox}>
                <Text style={styles.autoCalcLabel}>{t.totalLaborCost}</Text>
                <Text style={styles.autoCalcVal}>₹{liveSprayLaborCost.toLocaleString('en-US')}</Text>
              </View>
              
              <View style={[styles.autoCalcBox, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}>
                <Text style={[styles.autoCalcLabel, { color: '#2e7d32' }]}>{language === 'ml' ? 'ആകെ കണക്കാക്കിയ ചിലവ്' : 'Estimated Total Cost'}</Text>
                <Text style={[styles.autoCalcVal, { color: '#2e7d32' }]}>₹{liveSprayTotalCost.toLocaleString('en-US')}</Text>
              </View>
              <Text style={styles.helperText}>{t.pesticideHelper}</Text>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput style={styles.input} value={sprayDate} onChangeText={setSprayDate} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowSprayLogModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddSprayLogSubmit}>
                <Text style={styles.saveBtnText}>{t.recordSprayBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Earnings Modal */}
      <Modal visible={showEarningsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.addEarnings}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{t.sellingItem}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={language === 'ml' ? 'ഉദാ: കുരുമുളക് വിറ്റത്, ഉണക്ക ഏലക്ക' : 'e.g. Black Pepper, Green Cardamom'} 
                value={earningsItem} 
                onChangeText={setEarningsItem} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.quantitySold}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 50" 
                    value={earningsQuantity} 
                    onChangeText={setEarningsQuantity} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.pricePerKg}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 600" 
                    value={earningsPricePerKg} 
                    onChangeText={setEarningsPricePerKg} 
                  />
                </View>
              </View>

              {/* Auto Calculated Preview */}
              <View style={[styles.autoCalcBox, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}>
                <Text style={[styles.autoCalcLabel, { color: '#2e7d32' }]}>{t.totalAmount}</Text>
                <Text style={[styles.autoCalcVal, { color: '#2e7d32' }]}>₹{liveEarningsTotalAmount.toLocaleString('en-US')}</Text>
              </View>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput style={styles.input} value={earningsDate} onChangeText={setEarningsDate} />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline={true} value={earningsNotes} onChangeText={setEarningsNotes} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowEarningsModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#2e7d32' }]} onPress={handleAddEarningsSubmit}>
                <Text style={styles.saveBtnText}>{t.addEarnings}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Input Choice Modal */}
      <Modal visible={showInputChoiceModal} animationType="fade" transparent={true}>
        <View style={styles.choiceModalOverlay}>
          <View style={styles.choiceModalContent}>
            <Text style={styles.choiceModalTitle}>{t.selectInputType}</Text>
            
            <View style={styles.choiceButtonsRow}>
              <TouchableOpacity 
                style={[styles.choiceCard, { borderColor: '#4caf50' }]} 
                onPress={() => {
                  setShowInputChoiceModal(false);
                  setShowSprayLogModal(true);
                }}
              >
                <Text style={styles.choiceCardIcon}>🧪</Text>
                <Text style={styles.choiceCardTitle}>{t.recordSprayMenu}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.choiceCard, { borderColor: '#8d6e63' }]} 
                onPress={() => {
                  setShowInputChoiceModal(false);
                  setShowManureLogModal(true);
                }}
              >
                <Text style={styles.choiceCardIcon}>🍂</Text>
                <Text style={styles.choiceCardTitle}>{t.recordManureMenu}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.choiceCancelBtn} onPress={() => setShowInputChoiceModal(false)}>
              <Text style={styles.choiceCancelBtnText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Record Manure Modal */}
      <Modal visible={showManureLogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.recordManureMenu}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{t.manureNameLabel}</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Cow Dung, Compost" 
                value={manureLogName} 
                onChangeText={setManureLogName} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.manureQuantity}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric"
                    placeholder="e.g. 100" 
                    value={manureLogQty} 
                    onChangeText={setManureLogQty} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.manureCostLabel}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 500" 
                    value={manureLogCost} 
                    onChangeText={setManureLogCost} 
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.noOfWorkers}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 2" 
                    value={manureLogWorkers} 
                    onChangeText={setManureLogWorkers} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.laborCostPerWorker}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 600" 
                    value={manureLogLaborCost} 
                    onChangeText={setManureLogLaborCost} 
                  />
                </View>
              </View>

              {/* Auto Calculated Previews */}
              <View style={styles.autoCalcBox}>
                <Text style={styles.autoCalcLabel}>{t.totalLaborCost}</Text>
                <Text style={styles.autoCalcVal}>₹{liveManureLaborCost.toLocaleString('en-US')}</Text>
              </View>

              <View style={[styles.autoCalcBox, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}>
                <Text style={[styles.autoCalcLabel, { color: '#2e7d32' }]}>{t.estimatedTotal}</Text>
                <Text style={[styles.autoCalcVal, { color: '#2e7d32' }]}>₹{liveManureTotalCost.toLocaleString('en-US')}</Text>
              </View>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput style={styles.input} value={manureLogDate} onChangeText={setManureLogDate} />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline={true} value={manureLogNotes} onChangeText={setManureLogNotes} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowManureLogModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#8d6e63' }]} onPress={handleAddManureLogSubmit}>
                <Text style={styles.saveBtnText}>{t.recordManureMenu}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
});
