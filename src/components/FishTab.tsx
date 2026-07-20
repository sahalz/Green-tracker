import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform } from 'react-native';
import { Crop, CropStage, WorkLog } from '../types';
import { Language, TRANSLATIONS, translateStage, translateActivity } from '../translations';

interface FishTabProps {
  workLogs: WorkLog[];
  onUpdateCrop: (crop: Crop) => Promise<any>;
  selectedCrop: Crop | null;
  onAddWorkLog: (log: Omit<WorkLog, 'id' | 'totalCost'>) => Promise<any>;
  onDeleteWorkLog: (id: string) => Promise<any>;
  language: Language;
}

export default function FishTab({
  workLogs,
  onUpdateCrop,
  selectedCrop,
  onAddWorkLog,
  onDeleteWorkLog,
  language,
}: FishTabProps) {
  const t = TRANSLATIONS[language];

  // Modal visibility states
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [showPHModal, setShowPHModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showBuyFishModal, setShowBuyFishModal] = useState(false);
  const [showSellFishModal, setShowSellFishModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Miscellaneous work log states
  const [workActivity, setWorkActivity] = useState<string>('');
  const [workWorkers, setWorkWorkers] = useState<string>('');
  const [workLaborCostPerWorker, setWorkLaborCostPerWorker] = useState<string>('');
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workNotes, setWorkNotes] = useState<string>('');
  const [workMaterialCost, setWorkMaterialCost] = useState<string>('');

  // Water pH state
  const [phValue, setPHValue] = useState<string>('');
  const [phDate, setPHDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [phNotes, setPHNotes] = useState<string>('');

  // Feed form states
  const [feedDate, setFeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feedType, setFeedType] = useState<string>('');
  const [feedQty, setFeedQty] = useState<string>('');
  const [feedCost, setFeedCost] = useState<string>('');
  const [feedNotes, setFeedNotes] = useState<string>('');

  // Buy Fingerlings form states
  const [buyVariety, setBuyVariety] = useState<string>('');
  const [buyQty, setBuyQty] = useState<string>('');
  const [buyCost, setBuyCost] = useState<string>('');
  const [buyDate, setBuyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [buyNotes, setBuyNotes] = useState<string>('');

  // Sell Fish form states
  const [sellQty, setSellQty] = useState<string>('');
  const [sellQtyKg, setSellQtyKg] = useState<string>('');
  const [sellIncome, setSellIncome] = useState<string>('');
  const [sellNotes, setSellNotes] = useState<string>('');
  const [sellDate, setSellDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Mortality/Loss states
  const [lossQty, setLossQty] = useState<string>('');
  const [lossNotes, setLossNotes] = useState<string>('');
  const [lossDate, setLossDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Adjust stock count
  const [adjustQty, setAdjustQty] = useState<string>('');

  if (!selectedCrop) return null;

  // Filter logs for this specific fish farm
  const cropWorkLogs = workLogs.filter(w => w.cropId === selectedCrop.id);

  // Financial calculations
  const laborCost = cropWorkLogs.reduce((sum, l) => sum + l.laborCost, 0);
  const materialCost = cropWorkLogs.reduce((sum, l) => sum + l.materialCost, 0);
  const equipmentCost = cropWorkLogs.reduce((sum, l) => sum + l.equipmentCost, 0);
  const processingCost = cropWorkLogs.reduce((sum, l) => sum + (l.processingCharge || 0), 0);
  const totalCost = laborCost + materialCost + equipmentCost + processingCost;
  const totalRevenue = cropWorkLogs.reduce((sum, l) => sum + (l.income || 0), 0);
  const netProfit = totalRevenue - totalCost;

  // Feed summary
  const feedLogs = cropWorkLogs.filter(w => w.activityType === 'Feed / Food');
  const totalFeedCost = feedLogs.reduce((s, w) => s + w.materialCost, 0);
  const totalFeedQty = feedLogs.reduce((s, w) => s + (w.yieldKg || 0), 0);

  // Last water pH log
  const phLogs = cropWorkLogs.filter(w => w.activityType === 'Water pH');
  const lastPHLog = phLogs.length > 0 
    ? [...phLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
    : null;

  // pH Health check status
  const getPHStatus = (val: number) => {
    if (val < 6.5) {
      return { 
        label: language === 'ml' ? 'അമ്ലത്വം കൂടുതൽ (കുമ്മായം ചേർക്കുക)' : 'Acidic (Add lime/calcium)', 
        color: '#d84315', 
        bg: '#fbe9e7' 
      };
    } else if (val > 8.5) {
      return { 
        label: language === 'ml' ? 'ആൽക്കലൈൻ കൂടുതൽ (ശുദ്ധജലം ചേർക്കുക)' : 'High Alkaline (Add fresh water)', 
        color: '#c62828', 
        bg: '#ffebee' 
      };
    } else {
      return { 
        label: language === 'ml' ? 'സാധാരണ നില (അനുയോജ്യം)' : 'Healthy / Normal Range', 
        color: '#2e7d32', 
        bg: '#e8f5e9' 
      };
    }
  };

  const handleAdjustStockSubmit = async () => {
    if (!selectedCrop) return;
    const updated: Crop = {
      ...selectedCrop,
      fishCount: Number(adjustQty) || 0,
    };
    await onUpdateCrop(updated);
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
    setShowFeedModal(false);

    // Reset feed form
    setFeedType('');
    setFeedQty('');
    setFeedCost('');
    setFeedNotes('');
    setFeedDate(new Date().toISOString().split('T')[0]);
  };

  const handleBuyFingerlingsSubmit = async () => {
    if (!selectedCrop) return;
    if (!buyQty || !buyCost) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'വാങ്ങിയ എണ്ണവും ചിലവ് തുകയും നൽകുക.' : 'Please enter quantity and cost.'
      );
      return;
    }

    const qty = Number(buyQty) || 0;
    const cost = Number(buyCost) || 0;
    const fishVariety = buyVariety.trim() || selectedCrop.variety;

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Buying',
      date: buyDate,
      durationMinutes: 0,
      laborCost: 0,
      materialCost: cost,
      equipmentCost: 0,
      notes: buyNotes.trim() ? `Fish Species: ${fishVariety}. ${buyNotes.trim()}` : `Fish Species: ${fishVariety}`,
      fishCount: qty,
    };

    await onAddWorkLog(logData);

    // Update inventory stock count and variety/breed name automatically
    const updated: Crop = {
      ...selectedCrop,
      fishCount: (selectedCrop.fishCount || 0) + qty,
      variety: fishVariety,
    };
    await onUpdateCrop(updated);
    setShowBuyFishModal(false);

    // Reset buy form
    setBuyQty('');
    setBuyCost('');
    setBuyNotes('');
    setBuyVariety('');
    setBuyDate(new Date().toISOString().split('T')[0]);
  };

  const handleRecordPHSubmit = async () => {
    if (!selectedCrop) return;
    if (!phValue) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'പി.എച്ച് മൂല്യം നൽകുക.' : 'Please enter pH value.'
      );
      return;
    }

    const phNum = Number(phValue) || 7.0;

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Water pH',
      date: phDate,
      durationMinutes: 0,
      laborCost: 0,
      materialCost: 0,
      equipmentCost: 0,
      notes: phNotes.trim(),
      phValue: phNum,
    };

    await onAddWorkLog(logData);
    setShowPHModal(false);

    // Reset pH form
    setPHValue('');
    setPHNotes('');
    setPHDate(new Date().toISOString().split('T')[0]);
  };

  const handleSellFishSubmit = async () => {
    if (!selectedCrop) return;
    if (!sellIncome) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'ആകെ വിറ്റ തുക നൽകുക.' : 'Please enter total sale amount.'
      );
      return;
    }

    const countSold = Number(sellQty) || 0;
    const weightSold = Number(sellQtyKg) || 0;
    const incomeVal = Number(sellIncome) || 0;

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Revenue',
      date: sellDate,
      durationMinutes: 0,
      laborCost: 0,
      materialCost: 0,
      equipmentCost: 0,
      notes: sellNotes.trim(),
      manureName: language === 'ml' ? 'മീൻ വിറ്റത്' : 'Fish Sold',
      yieldKg: weightSold,
      fishCount: countSold,
      income: incomeVal,
    };

    await onAddWorkLog(logData);

    // Update inventory stock count
    const updated: Crop = {
      ...selectedCrop,
      fishCount: Math.max(0, (selectedCrop.fishCount || 0) - countSold),
    };
    await onUpdateCrop(updated);
    setShowSellFishModal(false);

    // Reset sell form
    setSellQty('');
    setSellQtyKg('');
    setSellIncome('');
    setSellNotes('');
    setSellDate(new Date().toISOString().split('T')[0]);
  };

  const handleRecordLossSubmit = async () => {
    if (!selectedCrop) return;
    if (!lossQty) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'നഷ്ടപ്പെട്ട എണ്ണം നൽകുക.' : 'Please enter lost count.'
      );
      return;
    }

    const qty = Number(lossQty) || 0;

    const logData = {
      cropId: selectedCrop.id,
      activityType: 'Mortality',
      date: lossDate,
      durationMinutes: 0,
      laborCost: 0,
      materialCost: 0,
      equipmentCost: 0,
      notes: lossNotes.trim(),
      fishCount: qty,
    };

    await onAddWorkLog(logData);

    // Subtract from inventory stock count
    const updated: Crop = {
      ...selectedCrop,
      fishCount: Math.max(0, (selectedCrop.fishCount || 0) - qty),
    };
    await onUpdateCrop(updated);
    setShowLossModal(false);

    // Reset loss form
    setLossQty('');
    setLossNotes('');
    setLossDate(new Date().toISOString().split('T')[0]);
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

    const calculatedLaborCost = (Number(workWorkers) || 0) * (Number(workLaborCostPerWorker) || 0);
    const workersNum = Number(workWorkers) || undefined;
    const costPerWorkerNum = Number(workLaborCostPerWorker) || undefined;

    const logData = {
      cropId: selectedCrop.id,
      activityType: workActivity.trim(),
      date: workDate,
      durationMinutes: 0,
      laborCost: calculatedLaborCost,
      materialCost: Number(workMaterialCost) || 0,
      equipmentCost: 0,
      notes: workNotes.trim(),
      noOfWorkers: workersNum,
      laborCostPerWorker: costPerWorkerNum,
    };

    await onAddWorkLog(logData);
    setShowWorkLogModal(false);

    // Reset work form
    setWorkActivity('');
    setWorkWorkers('');
    setWorkLaborCostPerWorker('');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setWorkNotes('');
    setWorkMaterialCost('');
  };

  const handleDeleteActivity = async (logId: string) => {
    const title = language === 'ml' ? 'രേഖ ഒഴിവാക്കണോ?' : 'Delete Log Entry';
    const msg = language === 'ml' 
      ? 'ഈ വിവരങ്ങൾ ഒഴിവാക്കപ്പെടും, ഒപ്പം സ്റ്റോക്ക് വിവരങ്ങൾ പഴയതുപോലെ ക്രമീകരിക്കപ്പെടും. തുടർന്നു പോകണോ?' 
      : 'Are you sure you want to delete this activity log? Stock inventory counts will be reverted accordingly.';

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Farm Details Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropName}>🐟 {selectedCrop.name}</Text>
              <Text style={styles.cropField}>📍 {selectedCrop.field}</Text>
            </View>
          </View>

          <View style={styles.metaDivider} />
          
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{language === 'ml' ? 'മത്സ്യ ഇനം' : 'Fish Species'}</Text>
              <Text style={styles.metaValue}>{selectedCrop.variety}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{language === 'ml' ? 'തുടങ്ങിയ തീയതി' : 'Release Date'}</Text>
              <Text style={styles.metaValue}>{selectedCrop.plantingDate}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{language === 'ml' ? 'വിളവെടുപ്പ് തീയതി' : 'Harvest Date'}</Text>
              <Text style={styles.metaValue}>{selectedCrop.expectedHarvestDate || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Fish Inventory & pH Card */}
        <View style={styles.inventoryCard}>
          <Text style={styles.inventoryTitle}>📈 {language === 'ml' ? 'ഫാം നിലവാരം' : 'Farm Status'}</Text>
          
          <View style={styles.inventoryRow}>
            <View style={styles.inventoryCol}>
              <Text style={styles.inventoryIcon}>🐟</Text>
              <Text style={styles.inventoryLabel}>{language === 'ml' ? 'ആകെ മീനുകൾ' : 'Total Fish'}</Text>
              <Text style={styles.inventoryValue}>{selectedCrop.fishCount || 0}</Text>
            </View>
            
            <View style={styles.verticalDivider} />

            <View style={styles.inventoryCol}>
              <Text style={styles.inventoryIcon}>🧪</Text>
              <Text style={styles.inventoryLabel}>{language === 'ml' ? 'അവസാന pH മൂല്യം' : 'Last pH Level'}</Text>
              <Text style={[styles.inventoryValue, { color: lastPHLog ? getPHStatus(lastPHLog.phValue || 7.0).color : '#555' }]}>
                {lastPHLog ? lastPHLog.phValue?.toFixed(1) : '-'}
              </Text>
            </View>
          </View>

          {/* Water Quality Status Box */}
          {lastPHLog && (
            <View style={[styles.waterQualityStatus, { backgroundColor: getPHStatus(lastPHLog.phValue || 7.0).bg, borderColor: getPHStatus(lastPHLog.phValue || 7.0).color }]}>
              <Text style={[styles.waterQualityStatusText, { color: getPHStatus(lastPHLog.phValue || 7.0).color }]}>
                📢 {getPHStatus(lastPHLog.phValue || 7.0).label}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.adjustInventoryBtn} onPress={() => {
            setAdjustQty((selectedCrop.fishCount || 0).toString());
            setShowAdjustModal(true);
          }}>
            <Text style={styles.adjustInventoryBtnText}>⚙️ {language === 'ml' ? 'എണ്ണം നേരിട്ട് തിരുത്തുക' : 'Manual Count Adjust'}</Text>
          </TouchableOpacity>
        </View>

        {/* Ledger & Feed Summary Card */}
        <View style={styles.ledgerCard}>
          <Text style={styles.ledgerTitle}>📊 {language === 'ml' ? 'ലാഭ ചിലവ് കണക്കുകൾ' : 'Financial Ledger'}</Text>
          
          <View style={styles.ledgerRow}>
            <View style={styles.ledgerCol}>
              <Text style={styles.ledgerLabel}>{t.totalExpenses}</Text>
              <Text style={[styles.ledgerValue, styles.costText]}>₹{totalCost.toFixed(0)}</Text>
            </View>
            <View style={styles.ledgerCol}>
              <Text style={styles.ledgerLabel}>{t.revenue}</Text>
              <Text style={[styles.ledgerValue, styles.revenueText]}>₹{totalRevenue.toFixed(0)}</Text>
            </View>
            <View style={styles.ledgerCol}>
              <Text style={styles.ledgerLabel}>{t.profit}</Text>
              <Text style={[styles.ledgerValue, netProfit >= 0 ? styles.profitText : styles.lossText]}>
                ₹{netProfit.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Feed Summary Banner */}
          {totalFeedCost > 0 && (
            <View style={styles.feedSummaryBanner}>
              <Text style={styles.feedSummaryBannerText}>
                🌾 {language === 'ml' ? `ആകെ തീറ്റ: ${totalFeedQty} kg | ചിലവ്: ₹${totalFeedCost.toFixed(0)}` : `Total Feed: ${totalFeedQty} kg | Cost: ₹${totalFeedCost.toFixed(0)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Direct Action Grid (Premium Cyan-Aqua Style) */}
        <View style={styles.goatActionsRow}>
          {/* Row 1 */}
          <TouchableOpacity style={[styles.goatActionBtn, { backgroundColor: '#006064' }]} onPress={() => {
            setBuyVariety(selectedCrop.variety);
            setBuyDate(new Date().toISOString().split('T')[0]);
            setShowBuyFishModal(true);
          }}>
            <Text style={styles.detailActionBtnText}>🛒 {language === 'ml' ? 'മീൻ കുഞ്ഞുങ്ങളെ വാങ്ങുക' : 'Buy Fingerlings'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.goatActionBtn, { backgroundColor: '#00838f' }]} onPress={() => {
            setFeedType('');
            setFeedQty('');
            setFeedCost('');
            setFeedNotes('');
            setFeedDate(new Date().toISOString().split('T')[0]);
            setShowFeedModal(true);
          }}>
            <Text style={styles.detailActionBtnText}>🌾 {language === 'ml' ? 'തീറ്റ ചിലവ് രേഖപ്പെടുത്തുക' : 'Feed Expense'}</Text>
          </TouchableOpacity>

          {/* Row 2 */}
          <TouchableOpacity style={[styles.goatActionBtn, { backgroundColor: '#0097a7' }]} onPress={() => {
            setPHValue('');
            setPHNotes('');
            setPHDate(new Date().toISOString().split('T')[0]);
            setShowPHModal(true);
          }}>
            <Text style={styles.detailActionBtnText}>🧪 {language === 'ml' ? 'pH രേഖപ്പെടുത്തുക' : 'Record Water pH'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.goatActionBtn, { backgroundColor: '#2e7d32' }]} onPress={() => {
            setSellQty('');
            setSellQtyKg('');
            setSellIncome('');
            setSellNotes('');
            setSellDate(new Date().toISOString().split('T')[0]);
            setShowSellFishModal(true);
          }}>
            <Text style={styles.detailActionBtnText}>💰 {language === 'ml' ? 'മീൻ വിൽക്കുക' : 'Sell Fish'}</Text>
          </TouchableOpacity>

          {/* Row 3 */}
          <TouchableOpacity style={[styles.goatActionBtn, { backgroundColor: '#d84315' }]} onPress={() => {
            setLossQty('');
            setLossNotes('');
            setLossDate(new Date().toISOString().split('T')[0]);
            setShowLossModal(true);
          }}>
            <Text style={styles.detailActionBtnText}>⚠️ {language === 'ml' ? 'മീൻ നഷ്ടം / മരണം' : 'Loss / Mortality'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.goatActionBtn, { backgroundColor: '#5c6bc0' }]} onPress={() => {
            setWorkActivity('');
            setWorkWorkers('');
            setWorkLaborCostPerWorker('');
            setWorkNotes('');
            setWorkMaterialCost('');
            setWorkDate(new Date().toISOString().split('T')[0]);
            setShowWorkLogModal(true);
          }}>
            <Text style={styles.detailActionBtnText}>➕ {language === 'ml' ? 'മറ്റ് പണികൾ / ചിലവുകൾ' : 'Other Work Logs'}</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline Log Activities */}
        <Text style={styles.sectionTitle}>{t.timelineActivities}</Text>
        {cropWorkLogs.length === 0 ? (
          <View style={styles.emptyLogsBox}>
            <Text style={styles.emptyLogsText}>{t.noActivitiesLogged}</Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {cropWorkLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => {
              // Determine emoji based on activity type
              let logEmoji = '⚙️';
              if (log.activityType === 'Buying') logEmoji = '🛒';
              else if (log.activityType === 'Feed / Food') logEmoji = '🌾';
              else if (log.activityType === 'Water pH') logEmoji = '🧪';
              else if (log.activityType === 'Revenue') logEmoji = '💰';
              else if (log.activityType === 'Mortality') logEmoji = '💀';

              return (
                <View key={log.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#006064' }]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineActivity}>
                        {logEmoji} {
                          log.activityType === 'Revenue' 
                            ? (language === 'ml' ? 'വിൽപ്പന വരുമാനം' : 'Sale Revenue')
                            : translateActivity(log.activityType, language)
                        }
                      </Text>
                      <Text style={[styles.timelineCost, log.activityType === 'Revenue' && { color: '#2e7d32' }]}>
                        {log.activityType === 'Revenue' ? '+' : '-'}₹{log.activityType === 'Revenue' ? log.income?.toFixed(0) : (log.totalCost || log.materialCost || 0).toFixed(0)}
                      </Text>
                    </View>
                    <Text style={styles.timelineDate}>{log.date}</Text>
                    {log.notes ? <Text style={styles.timelineNotes}>{log.notes}</Text> : null}
                    
                    {/* Activity Specific Rendering */}
                    <View style={styles.timelineHarvestDetails}>
                      {log.activityType === 'Buying' && log.fishCount && (
                        <Text style={styles.timelineDetailText}>
                          🐟 {language === 'ml' ? 'വാങ്ങിയത്: ' : 'Fingerlings stocked: '}{log.fishCount} nos
                        </Text>
                      )}
                      {log.activityType === 'Feed / Food' && log.yieldKg && (
                        <Text style={styles.timelineDetailText}>
                          🌾 {language === 'ml' ? 'തീറ്റ അളവ്: ' : 'Feed qty: '}{log.yieldKg} kg
                        </Text>
                      )}
                      {log.activityType === 'Water pH' && log.phValue && (
                        <Text style={[styles.timelineDetailText, { fontWeight: '700', color: getPHStatus(log.phValue).color }]}>
                          🧪 pH Level: {log.phValue.toFixed(1)} ({getPHStatus(log.phValue).label})
                        </Text>
                      )}
                      {log.activityType === 'Revenue' && (
                        <>
                          {log.fishCount ? (
                            <Text style={styles.timelineDetailText}>
                              🐟 {language === 'ml' ? 'വിറ്റ എണ്ണം: ' : 'Count sold: '}{log.fishCount} nos
                            </Text>
                          ) : null}
                          {log.yieldKg ? (
                            <Text style={styles.timelineDetailText}>
                              ⚖️ {language === 'ml' ? 'ആകെ ഭാരം: ' : 'Total weight: '}{log.yieldKg} kg
                            </Text>
                          ) : null}
                        </>
                      )}
                      {log.activityType === 'Mortality' && log.fishCount && (
                        <Text style={[styles.timelineDetailText, { color: '#c62828', fontWeight: '700' }]}>
                          💀 {language === 'ml' ? 'ചത്തുപോയത്: ' : 'Loss / Deaths: '}{log.fishCount} nos
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity style={styles.timelineDeleteBtn} onPress={() => handleDeleteActivity(log.id)}>
                      <Text style={styles.timelineDeleteBtnText}>{language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Adjust Inventory Modal */}
      <Modal visible={showAdjustModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ⚙️ {language === 'ml' ? 'എണ്ണം ക്രമീകരിക്കുക' : 'Adjust Fish Stock'}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15, lineHeight: 18 }}>
              {language === 'ml' 
                ? 'നിലവിലുള്ള ആകെ മത്സ്യങ്ങളുടെ എണ്ണം ഇവിടെ നേരിട്ട് മാറ്റിയെഴുതാവുന്നതാണ്. ഇത് മുൻപുള്ള വിവരങ്ങളെ ബാധിക്കില്ല.' 
                : 'Directly override the total count of fish currently in stock.'}
            </Text>

            <Text style={styles.inputLabel}>{language === 'ml' ? 'ആകെ മീനുകളുടെ എണ്ണം' : 'Total Fish Count'}</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={adjustQty} 
              onChangeText={setAdjustQty} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAdjustModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#006064' }]} onPress={handleAdjustStockSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'മാറ്റം വരുത്തുക' : 'Update Stock'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Buy Fingerlings Modal */}
      <Modal visible={showBuyFishModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🛒 {language === 'ml' ? 'മീൻ കുഞ്ഞുങ്ങളെ വാങ്ങുക' : 'Buy Fingerlings'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'മത്സ്യത്തിന്റെ പേര് / ഇനം *' : 'Fish Species / Name *'}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={language === 'ml' ? 'ഉദാ: തിലാപ്പിയ, വാള, കാരി' : 'e.g. Tilapia, Catfish, Carp'}
                value={buyVariety} 
                onChangeText={setBuyVariety} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'എണ്ണം *' : 'Quantity *'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 500"
                    value={buyQty} 
                    onChangeText={setBuyQty} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'വില തുക (₹) *' : 'Cost (₹) *'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 1500"
                    value={buyCost} 
                    onChangeText={setBuyCost} 
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി' : 'Date'}</Text>
              <TextInput 
                style={styles.input} 
                value={buyDate} 
                onChangeText={setBuyDate} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true}
                placeholder="e.g. Purchased from Govt hatchery"
                value={buyNotes} 
                onChangeText={setBuyNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowBuyFishModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#006064' }]} onPress={handleBuyFingerlingsSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'രേഖപ്പെടുത്തുക' : 'Save Record'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feed Expenses Modal */}
      <Modal visible={showFeedModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🌾 {language === 'ml' ? 'തീറ്റ ചിലവ് രേഖപ്പെടുത്തുക' : 'Log Feed Expense'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീറ്റയുടെ ഇനം *' : 'Feed Type *'}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={language === 'ml' ? 'ഉദാ: പെല്ലറ്റ് തീറ്റ, തവിട്' : 'e.g. Floating Pellets, Rice Bran'}
                value={feedType} 
                onChangeText={setFeedType} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'അളവ് (Kg)' : 'Quantity (Kg)'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 10"
                    value={feedQty} 
                    onChangeText={setFeedQty} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'ചിലവ് തുക (₹) *' : 'Cost (₹) *'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 750"
                    value={feedCost} 
                    onChangeText={setFeedCost} 
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി' : 'Date'}</Text>
              <TextInput 
                style={styles.input} 
                value={feedDate} 
                onChangeText={setFeedDate} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true}
                placeholder="Notes..."
                value={feedNotes} 
                onChangeText={setFeedNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowFeedModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#00838f' }]} onPress={handleAddFeedExpenseSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'രേഖപ്പെടുത്തുക' : 'Save Expense'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record pH Modal */}
      <Modal visible={showPHModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🧪 {language === 'ml' ? 'pH രേഖപ്പെടുത്തുക' : 'Record Water pH'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'pH മൂല്യം *' : 'pH Value *'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="e.g. 7.2"
                value={phValue} 
                onChangeText={setPHValue} 
              />

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി' : 'Date'}</Text>
              <TextInput 
                style={styles.input} 
                value={phDate} 
                onChangeText={setPHDate} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true}
                placeholder={language === 'ml' ? 'ലക്ഷണങ്ങൾ / ചേർത്ത പദാർത്ഥങ്ങൾ...' : 'Symptoms / added lime / notes...'}
                value={phNotes} 
                onChangeText={setPHNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowPHModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#0097a7' }]} onPress={handleRecordPHSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'രേഖപ്പെടുത്തുക' : 'Record pH'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sell Fish Modal */}
      <Modal visible={showSellFishModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              💰 {language === 'ml' ? 'മീൻ വിൽക്കുക' : 'Sell Fish'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'ആകെ ലഭിച്ച തുക (₹) *' : 'Total Income (₹) *'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="e.g. 8000"
                value={sellIncome} 
                onChangeText={setSellIncome} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'എണ്ണം (ലഭ്യമെങ്കിൽ)' : 'Count Sold (Optional)'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 150"
                    value={sellQty} 
                    onChangeText={setSellQty} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'ഭാരം (Kg)' : 'Weight Sold (Kg)'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 45"
                    value={sellQtyKg} 
                    onChangeText={setSellQtyKg} 
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി' : 'Date'}</Text>
              <TextInput 
                style={styles.input} 
                value={sellDate} 
                onChangeText={setSellDate} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true}
                placeholder="Notes..."
                value={sellNotes} 
                onChangeText={setSellNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowSellFishModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#2e7d32' }]} onPress={handleSellFishSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'വിൽപന രേഖപ്പെടുത്തുക' : 'Record Sale'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mortality / Loss Modal */}
      <Modal visible={showLossModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ⚠️ {language === 'ml' ? 'മീൻ നഷ്ടം / മരണം രേഖപ്പെടുത്തുക' : 'Log Loss / Mortality'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'നഷ്ടപ്പെട്ട എണ്ണം *' : 'Mortality Count *'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="e.g. 5"
                value={lossQty} 
                onChangeText={setLossQty} 
              />

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി' : 'Date'}</Text>
              <TextInput 
                style={styles.input} 
                value={lossDate} 
                onChangeText={setLossDate} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true}
                placeholder={language === 'ml' ? 'കാരണം (ഉദാ: വെള്ളത്തിലെ അംശം)' : 'Reason (e.g. temperature shock)'}
                value={lossNotes} 
                onChangeText={setLossNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowLossModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#d84315' }]} onPress={handleRecordLossSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'നഷ്ടം സംരക്ഷിക്കുക' : 'Save Loss'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Miscellaneous Work Log Modal */}
      <Modal visible={showWorkLogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ➕ {language === 'ml' ? 'മറ്റ് പണികൾ രേഖപ്പെടുത്തുക' : 'Log Work / Expense'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{language === 'ml' ? 'ജോലിയുടെ ഇനം *' : 'Activity Type / Name *'}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={language === 'ml' ? 'ഉദാ: കുളം വൃത്തിയാക്കൽ, പമ്പ് ഫിറ്റിങ്സ്' : 'e.g. Tank cleaning, pump repairs'}
                value={workActivity} 
                onChangeText={setWorkActivity} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'തൊഴിലാളികളുടെ എണ്ണം' : 'No. of Workers'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 2"
                    value={workWorkers} 
                    onChangeText={setWorkWorkers} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'കൂലി (ഒരാൾക്ക്)' : 'Cost per Worker (₹)'}</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="e.g. 500"
                    value={workLaborCostPerWorker} 
                    onChangeText={setWorkLaborCostPerWorker} 
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{language === 'ml' ? 'മറ്റ് ചിലവുകൾ (ഉപകരണങ്ങൾ മുതലായവ)' : 'Material / Extra Costs (₹)'}</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="e.g. 200"
                value={workMaterialCost} 
                onChangeText={setWorkMaterialCost} 
              />

              <Text style={styles.inputLabel}>{language === 'ml' ? 'തീയതി' : 'Date'}</Text>
              <TextInput 
                style={styles.input} 
                value={workDate} 
                onChangeText={setWorkDate} 
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline={true}
                placeholder="Notes..."
                value={workNotes} 
                onChangeText={setWorkNotes} 
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowWorkLogModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { backgroundColor: '#5c6bc0' }]} onPress={handleAddWorkLogSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ml' ? 'രേഖപ്പെടുത്തുക' : 'Save Record'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#004d40',
    marginBottom: 4,
  },
  cropField: {
    fontSize: 13,
    color: '#546e7a',
    fontWeight: '500',
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#eceff1',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#78909c',
    marginBottom: 2,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263238',
  },
  inventoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cfd8dc',
  },
  inventoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004d40',
    marginBottom: 12,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inventoryCol: {
    alignItems: 'center',
    flex: 1,
  },
  inventoryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  inventoryLabel: {
    fontSize: 12,
    color: '#546e7a',
    marginBottom: 4,
    fontWeight: '500',
  },
  inventoryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004d40',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eceff1',
  },
  waterQualityStatus: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  waterQualityStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  adjustInventoryBtn: {
    backgroundColor: '#f0f4f4',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: '#b2dfdb',
  },
  adjustInventoryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004d40',
  },
  ledgerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cfd8dc',
  },
  ledgerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004d40',
    marginBottom: 12,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ledgerCol: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerLabel: {
    fontSize: 11,
    color: '#78909c',
    marginBottom: 4,
    fontWeight: '600',
  },
  ledgerValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  costText: {
    color: '#c62828',
  },
  revenueText: {
    color: '#2e7d32',
  },
  profitText: {
    color: '#2e7d32',
  },
  lossText: {
    color: '#c62828',
  },
  feedSummaryBanner: {
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#b2dfdb',
  },
  feedSummaryBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006064',
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
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#37474f',
    marginTop: 10,
    marginBottom: 12,
  },
  emptyLogsBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceff1',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyLogsText: {
    color: '#90a4ae',
    fontSize: 13,
  },
  timelineContainer: {
    borderLeftWidth: 2,
    borderLeftColor: '#b2dfdb',
    marginLeft: 8,
    paddingLeft: 16,
  },
  timelineItem: {
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -23,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eceff1',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineActivity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263238',
  },
  timelineCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c62828',
  },
  timelineDate: {
    fontSize: 11,
    color: '#78909c',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#455a64',
    lineHeight: 16,
    marginBottom: 6,
  },
  timelineHarvestDetails: {
    marginTop: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 6,
  },
  timelineDetailText: {
    fontSize: 11,
    color: '#37474f',
    fontWeight: '600',
  },
  timelineDeleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  timelineDeleteBtnText: {
    fontSize: 11,
    color: '#e53935',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#004d40',
    marginBottom: 12,
  },
  modalForm: {
    marginVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#546e7a',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 15,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#eceff1',
  },
  cancelBtnText: {
    color: '#546e7a',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    minWidth: 100,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
