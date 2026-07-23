import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Crop, CropStage, WorkLog, PesticideLog, LaborPayment } from '../types';
import { Language, TRANSLATIONS, translateStage, translateActivity } from '../translations';
import CustomDatePicker from './CustomDatePicker';

interface CropsTabProps {
  crops: Crop[];
  workLogs: WorkLog[];
  pesticideLogs: PesticideLog[];
  laborPayments?: LaborPayment[];
  onAddCrop: (crop: Omit<Crop, 'id'>) => Promise<any>;
  onUpdateCrop: (crop: Crop) => Promise<any>;
  onDeleteCrop: (id: string) => Promise<any>;
  selectedCrop: Crop | null;
  onSelectCrop: (crop: Crop | null) => void;
  onAddWorkLog: (log: Omit<WorkLog, 'id' | 'totalCost'>) => Promise<any>;
  onDeleteWorkLog: (id: string) => Promise<any>;
  onAddPesticideLog: (log: Omit<PesticideLog, 'id'>) => Promise<any>;
  onDeletePesticideLog: (id: string) => Promise<any>;
  onAddLaborPayment?: (payment: Omit<LaborPayment, 'id'>) => Promise<any>;
  onDeleteLaborPayment?: (id: string) => Promise<any>;
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
  laborPayments = [],
  onAddCrop,
  onUpdateCrop,
  onDeleteCrop,
  selectedCrop,
  onSelectCrop,
  onAddWorkLog,
  onDeleteWorkLog,
  onAddPesticideLog,
  onDeletePesticideLog,
  onAddLaborPayment,
  onDeleteLaborPayment,
  language,
}: CropsTabProps) {
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
  const [sprayRequiresReminder, setSprayRequiresReminder] = useState<boolean>(true);
  // Labor Payment States
  const [showLaborPayModal, setShowLaborPayModal] = useState(false);
  const [laborPayAmount, setLaborPayAmount] = useState('');
  const [laborPayDate, setLaborPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [laborPayMode, setLaborPayMode] = useState<string>('Cash');
  const [laborPayNotes, setLaborPayNotes] = useState('');
  const [showPayHistoryModal, setShowPayHistoryModal] = useState(false);

  // Earnings Form States
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [earningsItem, setEarningsItem] = useState<string>('');
  const [earningsQuantity, setEarningsQuantity] = useState<string>('');
  const [earningsRawYield, setEarningsRawYield] = useState<string>('');
  const [earningsPricePerKg, setEarningsPricePerKg] = useState<string>('');
  const [earningsDate, setEarningsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earningsNotes, setEarningsNotes] = useState<string>('');
  const [earningsProcessingCharge, setEarningsProcessingCharge] = useState<string>('');

  // Livestock placeholder states to satisfy compilation
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
  const [showStageCountModal, setShowStageCountModal] = useState(false);
  const [targetStageForModal, setTargetStageForModal] = useState<CropStage>('Seedling');
  const [stageCountValue, setStageCountValue] = useState<string>('');
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [feedDate, setFeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feedType, setFeedType] = useState<string>('');
  const [feedQty, setFeedQty] = useState<string>('');
  const [feedCost, setFeedCost] = useState<string>('');
  const [feedNotes, setFeedNotes] = useState<string>('');

  if (!selectedCrop) return null;

  const isCardamom = selectedCrop.type.toLowerCase().includes('cardamom') || 
                     selectedCrop.type.toLowerCase().includes('cardomom') || 
                     selectedCrop.type.includes('ഏല');
  const isPepper = selectedCrop.type.toLowerCase().includes('pepper') || 
                   selectedCrop.type.includes('കുരുമുളക്');
  const isGoat = false;
  const isGoatSingleton = false;
  const isBuying = false;
  const isNewBabies = false;
  const isFeedOrFood = false;
  const isMedical = false;

  const isHarvesting = workActivity.trim().toLowerCase().includes('harvest') || 
                       workActivity.trim().includes('വിളവെടുപ്പ്') || 
                       workActivity.trim().includes('വിളവെടുക്');
  
  const isCuring = workActivity.trim().toLowerCase().includes('curing') ||
                   workActivity.trim().toLowerCase().includes('dry') ||
                   workActivity.trim().includes('ഉണക്കൽ');

  const isHarvestingOrCuring = isHarvesting || isCuring;

  const cropWorkLogs = workLogs.filter(w => w.cropId === selectedCrop.id);
  const cropPestLogs = pesticideLogs.filter(p => (p.cropIds || []).includes(selectedCrop.id));
  const cropLaborPayments = (laborPayments || []).filter(p => p.cropId === selectedCrop.id);

  const laborCost = cropWorkLogs.reduce((sum, l) => sum + l.laborCost, 0);
  const materialCost = cropWorkLogs.reduce((sum, l) => sum + l.materialCost, 0);
  const equipmentCost = cropWorkLogs.reduce((sum, l) => sum + l.equipmentCost, 0);
  const processingCost = cropWorkLogs.reduce((sum, l) => sum + (l.processingCharge || 0), 0);
  const totalCost = laborCost + materialCost + equipmentCost + processingCost;
  
  const totalRevenue = cropWorkLogs.reduce((sum, l) => sum + (l.income || 0), 0);
  const netProfit = totalRevenue - totalCost;

  const totalLaborPaid = cropLaborPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const laborBalanceDue = Math.max(0, laborCost - totalLaborPaid);

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

  const handleDelete = async () => {
    const title = language === 'ml' ? 'വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Delete Crop';
    const msg = language === 'ml' 
      ? `"${selectedCrop.name}" എന്ന വിളയുടെ എല്ലാ വിവരങ്ങളും ഇതിലൂടെ പൂർണ്ണമായി ഒഴിവാക്കപ്പെടും. തുടരണോ?` 
      : `Are you sure you want to delete "${selectedCrop.name}"? This will also delete all related work logs, expenses, and pesticide application records.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${msg}`);
      if (confirmed) {
        await onDeleteCrop(selectedCrop.id);
        onSelectCrop(null);
      }
    } else {
      Alert.alert(title, msg, [
        { text: language === 'ml' ? 'വേണ്ട' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeleteCrop(selectedCrop.id);
            onSelectCrop(null);
          },
        },
      ]);
    }
  };

  const handleAddLaborPaymentSubmit = async () => {
    if (!selectedCrop) return;
    const amount = Number(laborPayAmount);
    if (!laborPayAmount || isNaN(amount) || amount <= 0) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Invalid Amount',
        language === 'ml' ? 'ദയവായി സാധുവായ ഒരു തുക നൽകുക.' : 'Please enter a valid payment amount.'
      );
      return;
    }

    if (onAddLaborPayment) {
      await onAddLaborPayment({
        cropId: selectedCrop.id,
        date: laborPayDate,
        amountPaid: amount,
        paymentMode: laborPayMode,
        notes: laborPayNotes,
      });
    }

    setShowLaborPayModal(false);
    setLaborPayAmount('');
    setLaborPayNotes('');
  };

  const handleDeleteLaborPaymentSubmit = async (id: string) => {
    const title = language === 'ml' ? 'ഒഴിവാക്കണോ?' : 'Delete Payment';
    const msg = t.deletePaymentConfirm || (language === 'ml' ? 'ഈ പേയ്‌മെന്റ് വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Are you sure you want to delete this payment record?');

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${msg}`)) {
        if (onDeleteLaborPayment) await onDeleteLaborPayment(id);
      }
    } else {
      Alert.alert(title, msg, [
        { text: language === 'ml' ? 'വേണ്ട' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteLaborPayment) await onDeleteLaborPayment(id);
          },
        },
      ]);
    }
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
    if (!workWorkers || !workLaborCostPerWorker) {
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
    setWorkRawYield('');
    setWorkMaterialCost('');
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
      requiresReminder: sprayRequiresReminder,
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
    setSprayRequiresReminder(true);
  };

  const handleAddEarningsSubmit = async () => {
    if (!selectedCrop) return;
    if (isGoat) {
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
    } else {
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
        rawYieldKg: isCardamom ? (Number(earningsRawYield) || undefined) : undefined,
        processingCharge: (isPepper || isCardamom) ? (Number(earningsProcessingCharge) || undefined) : undefined,
        income: calculatedIncome,
        pricePerKg: rate,
      };

      await onAddWorkLog(logData);
      setShowEarningsModal(false);

      // Reset crops form
      setEarningsItem('');
      setEarningsQuantity('');
      setEarningsRawYield('');
      setEarningsProcessingCharge('');
      setEarningsPricePerKg('');
      setEarningsNotes('');
      setEarningsDate(new Date().toISOString().split('T')[0]);
    }
  };

  // Dynamic calculations for preview in UI
  const liveWorkTotalLaborCost = (Number(workWorkers) || 0) * (Number(workLaborCostPerWorker) || 0);
  
  const liveSprayLaborCost = (Number(sprayWorkers) || 0) * (Number(sprayLaborCostPerWorker) || 0);
  const liveSprayTotalCost = liveSprayLaborCost + (Number(sprayPesticideCost) || 0);

  const liveEarningsTotalAmount = (Number(earningsQuantity) || 0) * (Number(earningsPricePerKg) || 0);

  const liveManureLaborCost = (Number(manureLogWorkers) || 0) * (Number(manureLogLaborCost) || 0);
  const liveManureTotalCost = liveManureLaborCost + (Number(manureLogCost) || 0);

  // Check if Cardamom and spraying is overdue (30 days)
  const isCropActive = selectedCrop.stage !== 'Archived';
  
  let isSprayingOverdue = false;
  let daysSinceLastSpray = 0;
  let lastSprayDateStr = '';

  if (isCardamom && isCropActive) {
    const sortedSprays = cropPestLogs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedSprays.length > 0) {
      const lastSprayDate = new Date(sortedSprays[0].date);
      lastSprayDateStr = sortedSprays[0].date;
      const msDiff = Date.now() - lastSprayDate.getTime();
      daysSinceLastSpray = Math.floor(msDiff / (24 * 60 * 60 * 1000));
      if (daysSinceLastSpray > 30) {
        isSprayingOverdue = true;
      }
    } else {
      const plantingDate = new Date(selectedCrop.plantingDate);
      const msDiff = Date.now() - plantingDate.getTime();
      daysSinceLastSpray = Math.floor(msDiff / (24 * 60 * 60 * 1000));
      if (daysSinceLastSpray > 30) {
        isSprayingOverdue = true;
      }
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back Button */}
        {!isGoatSingleton && (
          <TouchableOpacity style={styles.backButton} onPress={() => onSelectCrop(null)}>
            <Text style={styles.backButtonText}>{t.backToList}</Text>
          </TouchableOpacity>
        )}

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

        {/* Spraying Overdue Warning Banner */}
        {isSprayingOverdue && (
          <View style={[styles.withholdingAlertCard, { backgroundColor: '#fff3cd', borderColor: '#ffeeba' }]}>
            <Text style={[styles.withholdingAlertTitle, { color: '#856404' }]}>
              ⚠️ {t.sprayingOverdue}
            </Text>
            <Text style={[styles.withholdingAlertText, { color: '#856404' }]}>
              {lastSprayDateStr 
                ? (language === 'ml' 
                  ? `അവസാനമായി മരുന്ന് തളിച്ചത് ${daysSinceLastSpray} ${t.daysAgo} (${lastSprayDateStr}) ആണ്. ${t.sprayingRequirementNotice}` 
                  : `Last chemical spray was ${daysSinceLastSpray} ${t.daysAgo} (${lastSprayDateStr}). ${t.sprayingRequirementNotice}`)
                : (language === 'ml' 
                  ? `വിള നട്ടിട്ട് ${daysSinceLastSpray} ദിവസമായി, ഇതുവരെ മരുന്ന് തളിച്ചിട്ടില്ല. ${t.sprayingRequirementNotice}`
                  : `Planted ${daysSinceLastSpray} ${t.daysAgo}, and has never been sprayed. ${t.sprayingRequirementNotice}`)
              }
            </Text>
          </View>
        )}

        {/* Header Block */}
        {!isGoat && (
          <View style={styles.detailHeaderCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.detailType}>{(selectedCrop.type || '').toUpperCase()} • {(selectedCrop.variety || 'Standard Variety').toUpperCase()}</Text>
              <View style={{ backgroundColor: getStageColor(selectedCrop.stage), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>
                  {translateStage(selectedCrop.stage, language, isGoat)}
                </Text>
              </View>
            </View>
            <Text style={styles.detailTitle}>{selectedCrop.name}</Text>
            <Text style={styles.detailSub}>{selectedCrop.field}</Text>
            
            <View style={styles.datesContainer}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>{isGoat ? (language === 'ml' ? 'ആരംഭിച്ച തീയതി' : 'Start Date') : t.planted}</Text>
                <Text style={styles.dateVal}>{selectedCrop.plantingDate}</Text>
              </View>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>{isGoat ? (language === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന വിൽപന' : 'Expected Sale') : t.estHarvest}</Text>
                <Text style={styles.dateVal}>{selectedCrop.expectedHarvestDate}</Text>
              </View>
            </View>

            {selectedCrop.notes ? (
              <Text style={styles.notesText}>💡 {selectedCrop.notes}</Text>
            ) : null}

            {isCardamom && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: (selectedCrop.sprayReminderEnabled !== false) ? '#e8f5e9' : '#ffebee',
                  borderWidth: 1,
                  borderColor: (selectedCrop.sprayReminderEnabled !== false) ? '#a5d6a7' : '#ffcdd2',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={async () => {
                  const current = selectedCrop.sprayReminderEnabled !== false;
                  await onUpdateCrop({
                    ...selectedCrop,
                    sprayReminderEnabled: !current,
                  });
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: (selectedCrop.sprayReminderEnabled !== false) ? '#2e7d32' : '#c62828' }}>
                  {selectedCrop.sprayReminderEnabled !== false
                    ? (t.sprayReminderEnabledText || '🔔 Monthly Spray Reminders: Enabled')
                    : (t.sprayReminderDisabledText || '🔕 Monthly Spray Reminders: Disabled')}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: (selectedCrop.sprayReminderEnabled !== false) ? '#2e7d32' : '#c62828' }}>
                  {language === 'ml' ? 'മാറ്റുക' : 'Change'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sheep Inventory Card */}
        {isGoat && (
          <View style={styles.inventoryCard}>
            <Text style={styles.inventoryTitle}>
              🐑 {language === 'ml' ? 'ചെമ്മരിയാടുകളുടെ എണ്ണം (നിലവിൽ)' : 'Current Sheep Inventory'}
            </Text>
            
            <View style={styles.inventoryRow}>
              <View style={styles.inventoryCol}>
                <Text style={styles.inventoryIcon}>♂️</Text>
                <Text style={styles.inventoryLabel}>{language === 'ml' ? 'ആൺ ചെമ്മരിയാടുകൾ' : 'Males'}</Text>
                <Text style={styles.inventoryValue}>{selectedCrop.malesCount || 0}</Text>
              </View>
              <View style={styles.inventoryCol}>
                <Text style={styles.inventoryIcon}>♀️</Text>
                <Text style={styles.inventoryLabel}>{language === 'ml' ? 'പെൺ ചെമ്മരിയാടുകൾ' : 'Females'}</Text>
                <Text style={styles.inventoryValue}>{selectedCrop.femalesCount || 0}</Text>
              </View>
              <View style={styles.inventoryCol}>
                <Text style={styles.inventoryIcon}>👶</Text>
                <Text style={styles.inventoryLabel}>{language === 'ml' ? 'കുട്ടികൾ' : 'Lambs'}</Text>
                <Text style={styles.inventoryValue}>{selectedCrop.kidsCount || 0}</Text>
              </View>
            </View>

            <View style={styles.inventoryDivider} />

            <View style={styles.inventoryTotalRow}>
              <Text style={styles.inventoryTotalLabel}>{language === 'ml' ? 'ആകെ ചെമ്മരിയാടുകൾ' : 'Total Sheep'}</Text>
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

            {/* Standalone Labor Payments & Settlement Summary Card */}
            <View style={styles.laborSettlementCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.laborSettlementTitle}>
                  💳 {t.laborSettlementTitle || (language === 'ml' ? 'തൊഴിൽ കൂലി പേയ്‌മെന്റും തീർപ്പാക്കലും' : 'Labor Payments & Settlement')}
                </Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: laborCost > 0 && laborBalanceDue === 0 ? '#e8f5e9' : laborBalanceDue > 0 ? '#fff3e0' : '#f5f5f5' }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: laborCost > 0 && laborBalanceDue === 0 ? '#2e7d32' : laborBalanceDue > 0 ? '#e65100' : '#616161' }
                  ]}>
                    {laborCost === 0 
                      ? (language === 'ml' ? 'കൂലി ചിലവുകളില്ല' : 'No Labor Logged')
                      : laborBalanceDue === 0 
                        ? (t.fullySettledBadge || '✓ Fully Settled')
                        : `${t.pendingBalanceBadge || '⚠️ Balance Due'}: ₹${laborBalanceDue.toLocaleString('en-US')}`
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.laborRow}>
                <View style={styles.laborCol}>
                  <Text style={styles.laborLabel}>{t.totalAccruedLabor || (language === 'ml' ? 'ആകെ കൂലി ചെലവ്' : 'Total Labor Earned')}</Text>
                  <Text style={styles.laborVal}>₹{laborCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
                <View style={styles.laborCol}>
                  <Text style={styles.laborLabel}>{t.totalPaidLabor || (language === 'ml' ? 'നൽകിയ കൂലി' : 'Total Paid')}</Text>
                  <Text style={[styles.laborVal, { color: '#2e7d32' }]}>₹{totalLaborPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
                <View style={styles.laborCol}>
                  <Text style={styles.laborLabel}>{t.laborBalanceDue || (language === 'ml' ? 'നൽകാനുള്ള ബാക്കി' : 'Balance Due')}</Text>
                  <Text style={[styles.laborVal, { color: laborBalanceDue > 0 ? '#d32f2f' : '#2e7d32' }]}>
                    ₹{laborBalanceDue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity 
                  style={[styles.recordPayBtn, { flex: 1 }]}
                  onPress={() => {
                    setLaborPayAmount(laborBalanceDue > 0 ? String(laborBalanceDue) : '');
                    setLaborPayDate(new Date().toISOString().split('T')[0]);
                    setLaborPayMode('Cash');
                    setLaborPayNotes('');
                    setShowLaborPayModal(true);
                  }}
                >
                  <Text style={styles.recordPayBtnText}>
                    💳 {t.recordLaborPayment || (language === 'ml' ? '+ കൂലി നൽകിയത് രേഖപ്പെടുത്തുക' : '+ Record Payment')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.payHistoryBtn, { flex: 1 }]}
                  onPress={() => setShowPayHistoryModal(true)}
                >
                  <Text style={styles.payHistoryBtnText}>
                    📋 {t.paymentHistory || (language === 'ml' ? 'ചരിത്രം' : 'History')} ({cropLaborPayments.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Direct Log Actions */}
            {isGoat ? (
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
                  <Text style={styles.detailActionBtnText}>🛒 {language === 'ml' ? 'ചെമ്മരിയാടുകളെ വാങ്ങുക' : 'Buy Sheep'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.goatActionBtn, { backgroundColor: '#2e7d32' }]} 
                  onPress={() => {
                    setEarningsItem(language === 'ml' ? 'ചെമ്മരിയാടുകളെ വിറ്റത്' : 'Sheep Sold');
                    setEarningsMalesCount('');
                    setEarningsFemalesCount('');
                    setEarningsKidsCount('');
                    setEarningsTotalAmount('');
                    setEarningsDate(new Date().toISOString().split('T')[0]);
                    setEarningsNotes('');
                    setShowEarningsModal(true);
                  }}
                >
                  <Text style={styles.detailActionBtnText}>💰 {language === 'ml' ? 'ചെമ്മരിയാടുകളെ വിൽക്കുക' : 'Sell Sheep'}</Text>
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
            ) : (
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
            )}

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
                                log.activityType === 'Buying' ? (language === 'ml' ? '📦 വാങ്ങിയ എണ്ണം: ' : '📦 Sheep Bought: ') :
                                log.activityType === 'New Babies' ? (language === 'ml' ? '👶 ഉണ്ടായ കുഞ്ഞുങ്ങൾ: ' : '👶 Lambs Born: ') :
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
                              👩‍👧 {language === 'ml' ? `തള്ള ചെമ്മരിയാട്: ${log.motherGoat}` : `Mother Sheep: ${log.motherGoat}`}
                            </Text>
                          ) : null}
                          {log.breededGoat ? (
                            <Text style={styles.timelineHarvestText}>
                              💕 {language === 'ml' ? `ഇണചേർത്ത ചെമ്മരിയാട്: ${log.breededGoat}` : `Bred Sheep: ${log.breededGoat}`}
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
            {!isGoatSingleton && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>{t.deleteCropCycle}</Text>
              </TouchableOpacity>
            )}
          </>

      </ScrollView>

      {/* Log Work Modal */}
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
                ? (language === 'ml' ? 'ചെമ്മരിയാട് ഫാം വിവരങ്ങൾ രേഖപ്പെടുത്തുക' : 'Record Sheep Farm Activity') 
                : t.logWork
              }
            </Text>
            
            <ScrollView style={styles.modalForm}>
              {isGoat ? (
                <View style={{ backgroundColor: '#f1f5f1', borderRadius: 10, padding: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#1b3a1e' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1b3a1e' }}>
                    {workActivity === 'Buying' ? (language === 'ml' ? '🛒 ചെമ്മരിയാടുകളെ വാങ്ങൽ' : '🛒 Buying Sheep') :
                     workActivity === 'Breeding' ? (language === 'ml' ? '💕 ഇണചേർക്കൽ രേഖപ്പെടുത്തൽ' : '💕 Logging Breeding') :
                     workActivity === 'New Babies' ? (language === 'ml' ? '👶 പ്രസവം / കുഞ്ഞുങ്ങൾ' : '👶 New Born Lambs') :
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
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'തള്ള ചെമ്മരിയാട് *' : 'Mother Sheep *'}</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder={language === 'ml' ? 'ഉദാ: തള്ളയുടെ പേര്/നമ്പർ' : 'e.g. Mother Sheep name/ID'} 
                        value={workMotherGoat} 
                        onChangeText={setWorkMotherGoat} 
                      />
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{language === 'ml' ? 'ആൺ കുട്ടികൾ' : 'Male Lambs Born'}</Text>
                          <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="e.g. 1" 
                            value={workMalesCount} 
                            onChangeText={setWorkMalesCount} 
                          />
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.inputLabel}>{language === 'ml' ? 'പെൺ കുട്ടികൾ' : 'Female Lambs Born'}</Text>
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
                      <Text style={styles.inputLabel}>{language === 'ml' ? 'ഇണചേർത്ത ചെമ്മരിയാട് *' : 'Bred Sheep *'}</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder={language === 'ml' ? 'ഉദാ: ചെമ്മരിയാടിന്റെ പേര്/നമ്പർ' : 'e.g. Bred Sheep name/ID'} 
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

      {/* Spray Log Modal */}
      <Modal 
        visible={showSprayLogModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowSprayLogModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
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

              {/* Monthly Spray Reminder Option */}
              <Text style={styles.inputLabel}>{t.chemicalNeedsReminder || 'Requires Monthly Spray Reminder?'}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: sprayRequiresReminder ? '#1b5e20' : '#f5f5f5',
                    borderWidth: 1,
                    borderColor: sprayRequiresReminder ? '#1b5e20' : '#cccccc',
                    alignItems: 'center',
                  }}
                  onPress={() => setSprayRequiresReminder(true)}
                >
                  <Text style={{ color: sprayRequiresReminder ? '#ffffff' : '#333333', fontWeight: '700', fontSize: 12 }}>
                    ✓ {t.reminderYes || 'Yes (Resets Reminder)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: !sprayRequiresReminder ? '#b71c1c' : '#f5f5f5',
                    borderWidth: 1,
                    borderColor: !sprayRequiresReminder ? '#b71c1c' : '#cccccc',
                    alignItems: 'center',
                  }}
                  onPress={() => setSprayRequiresReminder(false)}
                >
                  <Text style={{ color: !sprayRequiresReminder ? '#ffffff' : '#333333', fontWeight: '700', fontSize: 12 }}>
                    ✕ {t.reminderNo || 'No (Skip Resetting)'}
                  </Text>
                </TouchableOpacity>
              </View>

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
              <CustomDatePicker 
                value={sprayDate} 
                onChange={setSprayDate} 
                language={language} 
              />
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

              {isGoat ? (
                <>
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
                </>
              ) : (
                <>
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

                  {isCardamom && (
                    <View style={styles.row}>
                      <View style={styles.col}>
                        <Text style={styles.inputLabel}>{t.rawWeightOptional}</Text>
                        <TextInput 
                          style={styles.input} 
                          keyboardType="numeric" 
                          placeholder={t.rawWeightPlaceholder} 
                          value={earningsRawYield} 
                          onChangeText={setEarningsRawYield} 
                        />
                      </View>
                      <View style={styles.col} />
                    </View>
                  )}

                  {(isPepper || isCardamom) && (
                    <View style={styles.row}>
                      <View style={styles.col}>
                        <Text style={styles.inputLabel}>{t.processingCharge}</Text>
                        <TextInput 
                          style={styles.input} 
                          keyboardType="numeric" 
                          placeholder={t.processingChargePlaceholder} 
                          value={earningsProcessingCharge} 
                          onChangeText={setEarningsProcessingCharge} 
                        />
                      </View>
                      <View style={styles.col} />
                    </View>
                  )}

                  {/* Auto Calculated Preview */}
                  <View style={[styles.autoCalcBox, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}>
                    <Text style={[styles.autoCalcLabel, { color: '#2e7d32' }]}>{t.totalAmount}</Text>
                    <Text style={[styles.autoCalcVal, { color: '#2e7d32' }]}>₹{liveEarningsTotalAmount.toLocaleString('en-US')}</Text>
                  </View>
                </>
              )}

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

      {/* Input Choice Modal */}
      <Modal 
        visible={showInputChoiceModal} 
        animationType="fade" 
        transparent={true}
        onRequestClose={() => setShowInputChoiceModal(false)}
      >
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
      <Modal 
        visible={showManureLogModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowManureLogModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
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
              <CustomDatePicker 
                value={manureLogDate} 
                onChange={setManureLogDate} 
                language={language} 
              />

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
        </KeyboardAvoidingView>
      </Modal>

      {/* Record Labor Payment Modal */}
      <Modal visible={showLaborPayModal} animationType="slide" transparent={true} onRequestClose={() => setShowLaborPayModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💳 {t.laborPaymentModalTitle || (language === 'ml' ? 'കൂലി നൽകിയ വിവരം രേഖപ്പെടുത്തുക' : 'Record Labor Payment')}</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>{t.amountPaid || (language === 'ml' ? 'നൽകിയ തുക (₹) *' : 'Amount Paid (₹) *')}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="e.g. 1200" 
                value={laborPayAmount} 
                onChangeText={setLaborPayAmount} 
              />

              <Text style={styles.inputLabel}>{t.date}</Text>
              <CustomDatePicker 
                value={laborPayDate} 
                onChange={setLaborPayDate} 
                language={language} 
              />

              <Text style={styles.inputLabel}>{t.paymentMode || (language === 'ml' ? 'പേയ്‌മെന്റ് രീതി' : 'Payment Mode')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {['Cash', 'UPI', 'Bank Transfer', 'Other'].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeChip,
                      laborPayMode === mode && styles.modeChipSelected
                    ]}
                    onPress={() => setLaborPayMode(mode)}
                  >
                    <Text style={[styles.modeChipText, laborPayMode === mode && styles.modeChipTextSelected]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true} 
                placeholder={language === 'ml' ? 'ഉദാ: 2 തൊഴിലാളികൾക്കുള്ള കൂലി' : 'e.g. Paid to 2 workers'} 
                value={laborPayNotes} 
                onChangeText={setLaborPayNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowLaborPayModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#2e7d32' }]} onPress={handleAddLaborPaymentSubmit}>
                <Text style={styles.saveBtnText}>{t.saveCrop || (language === 'ml' ? 'രേഖപ്പെടുത്തുക' : 'Save Payment')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Labor Payment History Modal */}
      <Modal visible={showPayHistoryModal} animationType="slide" transparent={true} onRequestClose={() => setShowPayHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>📋 {t.paymentHistory || (language === 'ml' ? 'പേയ്‌മെന്റ് ചരിത്രം' : 'Payment History')} ({cropLaborPayments.length})</Text>

            <ScrollView style={{ marginTop: 10 }}>
              {cropLaborPayments.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>{t.noPaymentsYet || (language === 'ml' ? 'കൂലി പേയ്‌മെന്റുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.' : 'No labor payments recorded yet.')}</Text>
              ) : (
                cropLaborPayments.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#2e7d32' }}>₹{item.amountPaid.toLocaleString('en-US')}</Text>
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>📅 {item.date} • {item.paymentMode || 'Cash'}</Text>
                        {item.notes ? <Text style={{ fontSize: 12, color: '#444', fontStyle: 'italic', marginTop: 4 }}>💡 {item.notes}</Text> : null}
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteLaborPaymentSubmit(item.id)}>
                        <Text style={{ fontSize: 18, padding: 6 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={{ marginTop: 15 }}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn, { width: '100%' }]} onPress={() => setShowPayHistoryModal(false)}>
                <Text style={styles.cancelBtnText}>{language === 'ml' ? 'അടക്കുക' : 'Close'}</Text>
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
  laborSettlementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  laborSettlementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  laborRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fbf9',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  laborCol: {
    flex: 1,
    alignItems: 'center',
  },
  laborLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: '700',
    marginBottom: 4,
  },
  laborVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2c3e50',
  },
  recordPayBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordPayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  payHistoryBtn: {
    backgroundColor: '#f0f4f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  payHistoryBtnText: {
    color: '#1b3a1e',
    fontSize: 12,
    fontWeight: '700',
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  modeChipSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  modeChipText: {
    fontSize: 12,
    color: '#666',
  },
  modeChipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#f9fbf9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8e2',
  },
});
