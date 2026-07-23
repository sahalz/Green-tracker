import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Crop, CropStage, WorkLog, PesticideLog } from '../types';
import { Language, TRANSLATIONS, translateStage, translateActivity } from '../translations';
import CustomDatePicker from './CustomDatePicker';

interface DashboardProps {
  crops: Crop[];
  workLogs: WorkLog[];
  pesticideLogs: PesticideLog[];
  onSelectCrop: (crop: Crop) => void;
  onAddCrop: (crop: Omit<Crop, 'id'>) => Promise<any>;
  language: Language;
}

const STAGES: CropStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvested', 'Archived'];

export default function Dashboard({ crops, workLogs, pesticideLogs, onSelectCrop, onAddCrop, language }: DashboardProps) {
  const t = TRANSLATIONS[language];

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields for Add Crop
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [variety, setVariety] = useState('');
  const [field, setField] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setName('');
    setType('');
    setVariety('');
    setField('');
    setNotes('');
    setPlantingDate(new Date().toISOString().split('T')[0]);
    setExpectedHarvestDate('');
    setShowAddModal(true);
  };

  // Calculations
  const activeCrops = crops.filter(c => c.stage !== 'Archived');
  
  const totalExpenses = workLogs.reduce((sum, log) => sum + log.totalCost, 0);
  const totalRevenue = workLogs.reduce((sum, log) => sum + (log.income || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const laborTotal = workLogs.reduce((sum, log) => sum + log.laborCost, 0);
  const materialTotal = workLogs.reduce((sum, log) => sum + log.materialCost, 0);
  const equipmentTotal = workLogs.reduce((sum, log) => sum + log.equipmentCost, 0);

  // Expense by activity type (updated activities list)
  const activities = [
    'Tillage', 'Planting', 'Weeding', 'Irrigation', 'Pruning', 'Spraying', 'Harvesting',
    'Adding Manure', 'Vine Tying', 'Shade Regulation', 'Trashing', 'Curing', 'Other'
  ] as const;
  
  const activityCosts = activities.map(act => {
    const cost = workLogs
      .filter(log => log.activityType === act)
      .reduce((sum, log) => sum + log.totalCost, 0);
    return { name: act, cost };
  }).filter(a => a.cost > 0);

  const maxActivityCost = Math.max(...activityCosts.map(a => a.cost), 1);

  // Withholding warnings
  const withholdingWarnings: Array<{ cropId: string; cropName: string; pesticideName: string; daysLeft: number }> = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTime = new Date(todayStr).getTime();

  activeCrops.forEach(crop => {
    let maxDaysLeft = 0;
    let worstPesticideName = '';

    pesticideLogs.forEach(pest => {
      if (pest.cropIds && pest.cropIds.includes(crop.id) && pest.withholdingDays && pest.withholdingDays > 0) {
        const sprayTime = new Date(pest.date).getTime();
        const daysPassed = (todayTime - sprayTime) / (1000 * 60 * 60 * 24);
        const daysLeft = Math.ceil(pest.withholdingDays - daysPassed);
        if (daysLeft > 0 && daysLeft > maxDaysLeft) {
          maxDaysLeft = daysLeft;
          worstPesticideName = pest.pesticideName;
        }
      }
    });

    if (maxDaysLeft > 0) {
      withholdingWarnings.push({
        cropId: crop.id,
        cropName: crop.name,
        pesticideName: worstPesticideName,
        daysLeft: maxDaysLeft
      });
    }
  });

  const cardamomOverdueWarnings: Array<{ cropId: string; cropName: string; lastSprayDate?: string; daysSinceLastSpray: number }> = [];

  activeCrops.forEach(crop => {
    const isCard = crop.type.toLowerCase().includes('cardamom') || 
                   crop.type.toLowerCase().includes('cardomom') || 
                   crop.type.includes('ഏല');
    if (isCard && crop.sprayReminderEnabled !== false) {
      const cropSprays = pesticideLogs
        .filter(p => (p.cropIds || []).includes(crop.id) && p.requiresReminder !== false)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (cropSprays.length > 0) {
        const lastSprayDate = new Date(cropSprays[0].date);
        const msDiff = Date.now() - lastSprayDate.getTime();
        const days = Math.floor(msDiff / (24 * 60 * 60 * 1000));
        if (days > 30) {
          cardamomOverdueWarnings.push({
            cropId: crop.id,
            cropName: crop.name,
            lastSprayDate: cropSprays[0].date,
            daysSinceLastSpray: days
          });
        }
      } else {
        const plantingDate = new Date(crop.plantingDate);
        const msDiff = Date.now() - plantingDate.getTime();
        const days = Math.floor(msDiff / (24 * 60 * 60 * 1000));
        if (days > 30) {
          cardamomOverdueWarnings.push({
            cropId: crop.id,
            cropName: crop.name,
            daysSinceLastSpray: days
          });
        }
      }
    }
  });

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          crop.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          crop.field.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = filterStage === 'All' || crop.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  const handleSubmit = async () => {
    if (!name || !type || !field) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' ? 'പേര്, വിളയുടെ ഇനം, കൃഷിസ്ഥലം എന്നിവ പൂരിപ്പിക്കുക.' : 'Please fill in Name, Crop Type, and Field Location.'
      );
      return;
    }
    const cropData: Omit<Crop, 'id'> = {
      name,
      type,
      variety,
      field,
      plantingDate,
      expectedHarvestDate: expectedHarvestDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // default 90 days
      stage: 'Seedling',
      notes,
    };
    await onAddCrop(cropData);
    setShowAddModal(false);
    // Reset Form
    setName('');
    setType('');
    setVariety('');
    setField('');
    setPlantingDate(new Date().toISOString().split('T')[0]);
    setExpectedHarvestDate('');
    setNotes('');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Sub Header */}
        <View style={styles.header}>
          <Text style={styles.subWelcomeText}>{t.appSub}</Text>
        </View>

        {/* Withholding Period Warnings */}
        {withholdingWarnings.length > 0 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningHeader}>{t.withholdingWarning}</Text>
            {withholdingWarnings.map((warn, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningText}>
                  {language === 'ml' 
                    ? `${warn.cropName}-ൽ ${warn.pesticideName} ഉപയോഗിച്ചിരിക്കുന്നു. വിളവെടുക്കരുത്!` 
                    : `${warn.cropName} was sprayed with ${warn.pesticideName}. DO NOT harvest!`
                  }
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{warn.daysLeft} {t.daysLeft}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Cardamom Spray Overdue Warnings */}
        {cardamomOverdueWarnings.length > 0 && (
          <View style={[styles.warningContainer, { backgroundColor: '#fff3cd', borderColor: '#ffeeba' }]}>
            <Text style={[styles.warningHeader, { color: '#856404' }]}>⚠️ {t.sprayingOverdue}</Text>
            {cardamomOverdueWarnings.map((warn, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={[styles.warningText, { color: '#856404', flex: 1, paddingRight: 10 }]}>
                  {warn.lastSprayDate
                    ? (language === 'ml' 
                      ? `${warn.cropName}: അവസാനമായി മരുന്ന് തളിച്ചത് ${warn.daysSinceLastSpray} ദിവസങ്ങൾക്ക് മുൻപാണ്. ${t.sprayingRequirementNotice}`
                      : `${warn.cropName}: Last spray was ${warn.daysSinceLastSpray} ${t.daysAgo}. ${t.sprayingRequirementNotice}`)
                    : (language === 'ml'
                      ? `${warn.cropName}: നട്ടിട്ട് ${warn.daysSinceLastSpray} ദിവസമായി, ഇതുവരെ മരുന്ന് തളിച്ചിട്ടില്ല. ${t.sprayingRequirementNotice}`
                      : `${warn.cropName}: Planted ${warn.daysSinceLastSpray} ${t.daysAgo}, never sprayed. ${t.sprayingRequirementNotice}`)
                  }
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Main Expense/Revenue Dashboard Card */}
        <View style={styles.dashboardCard}>
          <View style={styles.financialRow}>
            <View style={styles.financialCol}>
              <Text style={styles.cardLabel}>{t.totalExpenses}</Text>
              <Text style={styles.financialValue}>₹{totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={styles.financialCol}>
              <Text style={styles.cardLabel}>{t.revenue}</Text>
              <Text style={styles.financialValue}>₹{totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>

          <View style={styles.profitDivider} />

          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>{t.profit}</Text>
            <Text style={[styles.profitValueText, { color: netProfit >= 0 ? '#4caf50' : '#ff5252' }]}>
              ₹{netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          {/* Cost Breakdown Progress Bars */}
          <View style={styles.breakdownContainer}>
            {/* Labor */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownName}>{t.laborCost}</Text>
                <Text style={styles.breakdownVal}>₹{laborTotal.toFixed(0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(laborTotal / (totalExpenses || 1)) * 100}%`, backgroundColor: '#ffb300' }]} />
              </View>
            </View>

            {/* Materials */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownName}>{t.materialsInputs}</Text>
                <Text style={styles.breakdownVal}>₹{materialTotal.toFixed(0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(materialTotal / (totalExpenses || 1)) * 100}%`, backgroundColor: '#4caf50' }]} />
              </View>
            </View>

            {/* Equipment */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownName}>{t.equipmentFuel}</Text>
                <Text style={styles.breakdownVal}>₹{equipmentTotal.toFixed(0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(equipmentTotal / (totalExpenses || 1)) * 100}%`, backgroundColor: '#2196f3' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Operations List Header */}
        <View style={styles.cropListHeaderContainer}>
          <Text style={styles.cropListTitle} numberOfLines={1}>
            {language === 'ml' ? 'വിളവുകളുടെ വിവരങ്ങൾ' : 'My Crop Cycles'}
          </Text>
          <TouchableOpacity style={styles.quickAddBtn} onPress={openAddModal}>
            <Text style={styles.quickAddBtnText}>
              ➕ {t.addCrop}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchCrops}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Stage Filters Row */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filterStage === 'All' && styles.filterChipActive]}
              onPress={() => setFilterStage('All')}
            >
              <Text style={[styles.filterChipText, filterStage === 'All' && styles.filterChipTextActive]}>
                {language === 'ml' ? 'എല്ലാം' : 'All'}
              </Text>
            </TouchableOpacity>
            {STAGES.map((stg) => {
              return (
                <TouchableOpacity
                  key={stg}
                  style={[styles.filterChip, filterStage === stg && styles.filterChipActive]}
                  onPress={() => setFilterStage(stg)}
                >
                  <Text style={[styles.filterChipText, filterStage === stg && styles.filterChipTextActive]}>
                    {translateStage(stg, language)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Crop Vertical List */}
        <View style={styles.cropListContainer}>
          {filteredCrops.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>{t.noCropsFound}</Text>
            </View>
          ) : (
            filteredCrops.map((crop) => {
              const cost = workLogs
                .filter(w => w.cropId === crop.id)
                .reduce((sum, w) => sum + w.totalCost, 0);
              const revenue = workLogs
                .filter(w => w.cropId === crop.id)
                .reduce((sum, w) => sum + (w.income || 0), 0);
              const profit = revenue - cost;

              return (
                <TouchableOpacity key={crop.id} style={styles.cropListItem} onPress={() => onSelectCrop(crop)}>
                  <View style={styles.cropListItemLeft}>
                    <Text style={styles.listItemType}>{crop.type}{crop.variety ? ` (${crop.variety})` : ''}</Text>
                    <Text style={styles.listItemName}>{crop.name}</Text>
                    <Text style={styles.listItemField}>📍 {crop.field}</Text>
                  </View>
                  <View style={styles.cropListItemRight}>
                    <View style={[styles.listItemStage, { backgroundColor: getStageColor(crop.stage) }]}>
                      <Text style={styles.listItemStageText}>{translateStage(crop.stage, language)}</Text>
                    </View>
                    <Text style={[styles.listItemExpense, { color: profit >= 0 ? '#2e7d32' : '#ff5252' }]}>
                      {profit >= 0 ? '+' : ''}₹{profit.toFixed(0)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Add Crop Modal */}
      <Modal 
        visible={showAddModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.registerNewCrop}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{t.cropNameLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: കിഴക്കേ പറമ്പ് കുരുമുളക്' : 'e.g. East Field Pepper'} value={name} onChangeText={setName} />
              
              <Text style={styles.inputLabel}>{t.cropTypeLabel}</Text>
              <View style={styles.pickerContainer}>
                {['Pepper', 'Cardamom'].map(chipType => {
                  const displayLabel = chipType === 'Pepper' ? (language === 'ml' ? 'കുരുമുളക്' : 'Pepper') : (language === 'ml' ? 'ഏലം' : 'Cardamom');
                  const val = chipType === 'Cardamom' ? (language === 'ml' ? 'ഏലം' : 'Cardamom') : (language === 'ml' ? 'കുരുമുളക്' : 'Pepper');
                  return (
                    <TouchableOpacity
                      key={chipType}
                      style={[styles.pickerChip, type === val && styles.pickerChipActive]}
                      onPress={() => setType(val)}
                    >
                      <Text style={[styles.pickerChipText, type === val && styles.pickerChipTextActive]}>
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: കുരുമുളക്, ഏലം' : 'e.g. Pepper, Cardamom'} value={type} onChangeText={setType} />
              
              <Text style={styles.inputLabel}>{t.varietyLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: പന്നിയൂർ-1, ഞള്ളാനി' : 'e.g. Panniyur-1, NJallani'} value={variety} onChangeText={setVariety} />
              
              <Text style={styles.inputLabel}>{t.fieldLocationLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: പ്ലോട്ട് എ, ചരിവ് പ്രദേശം' : 'e.g. Plot A, Slope Area'} value={field} onChangeText={setField} />
              
              <Text style={styles.inputLabel}>{t.plantingDateLabel}</Text>
              <CustomDatePicker 
                value={plantingDate} 
                onChange={setPlantingDate} 
                language={language} 
              />

              <Text style={styles.inputLabel}>{t.expectedHarvestLabel}</Text>
              <CustomDatePicker 
                value={expectedHarvestDate} 
                onChange={setExpectedHarvestDate} 
                language={language} 
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline={true} placeholder={language === 'ml' ? 'കുറിപ്പുകൾ...' : 'Growth notes...'} value={notes} onChangeText={setNotes} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>{t.saveCrop}</Text>
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
  header: {
    marginBottom: 10,
    marginTop: 5,
  },
  subWelcomeText: {
    fontSize: 14,
    color: '#556b2f',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 5,
    borderLeftColor: '#ffc107',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  warningHeader: {
    color: '#856404',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
    flex: 1,
    paddingRight: 8,
  },
  badge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  dashboardCard: {
    backgroundColor: '#1b3a1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardLabel: {
    color: '#c2dbbe',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  breakdownContainer: {
    marginTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 15,
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownName: {
    color: '#e4f0e1',
    fontSize: 12,
  },
  breakdownVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeaderContainer: {
    marginBottom: 10,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6e8070',
  },
  cropListHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  cropListTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b3a1e',
    flex: 1,
    marginRight: 8,
  },
  quickAddBtn: {
    backgroundColor: '#1b3a1e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexShrink: 0,
  },
  quickAddBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 2,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e2e8e2',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1b3a1e',
  },
  filterChipText: {
    fontSize: 12,
    color: '#556b2f',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  cropListContainer: {
    marginBottom: 10,
  },
  cropListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cropListItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  listItemType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6e8070',
    textTransform: 'uppercase',
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b3a1e',
    marginVertical: 4,
  },
  listItemField: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  cropListItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  listItemStage: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  listItemStageText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  listItemExpense: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyListText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  chartLabel: {
    width: 120,
    fontSize: 11,
    fontWeight: '600',
    color: '#1b3a1e',
  },
  chartBarWrapper: {
    flex: 1,
    height: 22,
    backgroundColor: '#f1f5f1',
    borderRadius: 11,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  chartBarValueInside: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  chartBarValueOutside: {
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: '700',
    paddingLeft: 6,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  financialCol: {
    flex: 1,
  },
  financialValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  profitDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: {
    color: '#c2dbbe',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  profitValueText: {
    fontSize: 24,
    fontWeight: '800',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8f0e8',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1b3a1e',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6e8070',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 6,
  },
  pickerChip: {
    paddingHorizontal: 12,
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
});
