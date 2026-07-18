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
  onOpenLogWorkModal: (cropId: string) => void;
  onOpenSprayModal: (cropId: string) => void;
  language: Language;
}

const STAGES: CropStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvested', 'Archived'];

export default function CropsTab({
  crops,
  workLogs,
  pesticideLogs,
  onAddCrop,
  onUpdateCrop,
  onDeleteCrop,
  selectedCrop,
  onSelectCrop,
  onOpenLogWorkModal,
  onOpenSprayModal,
  language,
}: CropsTabProps) {
  const t = TRANSLATIONS[language];

  // Navigation & UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [variety, setVariety] = useState('');
  const [field, setField] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [notes, setNotes] = useState('');

  // Submit new crop
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

  // Change stage
  const handleStageChange = async (newStage: CropStage) => {
    if (!selectedCrop) return;
    const updated: Crop = { ...selectedCrop, stage: newStage };
    await onUpdateCrop(updated);
    onSelectCrop(updated); // Refresh view
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedCrop) return;
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

  // Filter crops
  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          crop.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          crop.field.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = filterStage === 'All' || crop.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  // Render Crop Detail View
  if (selectedCrop) {
    const cropWorkLogs = workLogs.filter(w => w.cropId === selectedCrop.id);
    const cropPestLogs = pesticideLogs.filter(p => (p.cropIds || []).includes(selectedCrop.id));

    const laborCost = cropWorkLogs.reduce((sum, l) => sum + l.laborCost, 0);
    const materialCost = cropWorkLogs.reduce((sum, l) => sum + l.materialCost, 0);
    const equipmentCost = cropWorkLogs.reduce((sum, l) => sum + l.equipmentCost, 0);
    const totalCost = laborCost + materialCost + equipmentCost;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => onSelectCrop(null)}>
          <Text style={styles.backButtonText}>{t.backToList}</Text>
        </TouchableOpacity>

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

        {/* Crop Expense Breakdown */}
        <View style={styles.expenseSummaryCard}>
          <Text style={styles.expenseSummaryTitle}>{t.cumulativeExpenses}</Text>
          <Text style={styles.expenseSummaryVal}>₹{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          
          <View style={styles.expenseSummaryBreakdown}>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>👨‍🌾 {t.laborCost}</Text>
              <Text style={styles.breakdownVal}>₹{laborCost.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>🌱 {language === 'ml' ? 'സാധനങ്ങൾ' : 'Materials'}</Text>
              <Text style={styles.breakdownVal}>₹{materialCost.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>🚜 {language === 'ml' ? 'ഉപകരണങ്ങൾ' : 'Equip/Fuel'}</Text>
              <Text style={styles.breakdownVal}>₹{equipmentCost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Direct Log Quick actions */}
        <View style={styles.detailActionsRow}>
          <TouchableOpacity style={styles.detailActionBtn} onPress={() => onOpenLogWorkModal(selectedCrop.id)}>
            <Text style={styles.detailActionBtnText}>➕ {t.logWork}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: '#4caf50' }]} onPress={() => onOpenSprayModal(selectedCrop.id)}>
            <Text style={styles.detailActionBtnText}>🧪 {t.sprayLog}</Text>
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
                        : translateActivity(log.activityType, language)
                      }
                    </Text>
                    <Text style={styles.timelineCost}>₹{log.totalCost.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.timelineDate}>
                    {log.date}
                    {log.activityType !== 'Adding Manure' && ` • ${log.durationMinutes} mins`}
                  </Text>
                  {log.notes ? <Text style={styles.timelineNotes}>{log.notes}</Text> : null}
                  
                  {/* Detailed expense breakdown in timeline */}
                  <Text style={styles.timelineMiniBreakdown}>
                    {t.laborCost}: ₹{log.laborCost} | {language === 'ml' ? 'വസ്തുക്കൾ' : 'Mat'}: ₹{log.materialCost} | {language === 'ml' ? 'ഉപകരണങ്ങൾ' : 'Equip'}: ₹{log.equipmentCost}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pesticide logs */}
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
                </View>
              </View>
            ))}
          </>
        )}

        {/* Delete button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>{t.deleteCropCycle}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Render Crop List View
  return (
    <View style={styles.container}>
      {/* Search & Filter Section */}
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
            <Text style={[styles.filterChipText, filterStage === 'All' && styles.filterChipTextActive]}>{language === 'ml' ? 'എല്ലാം' : 'All'}</Text>
          </TouchableOpacity>
          {STAGES.map((stg) => (
            <TouchableOpacity
              key={stg}
              style={[styles.filterChip, filterStage === stg && styles.filterChipActive]}
              onPress={() => setFilterStage(stg)}
            >
              <Text style={[styles.filterChipText, filterStage === stg && styles.filterChipTextActive]}>{translateStage(stg, language)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {/* New Crop Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>➕ {t.registerNewCrop}</Text>
        </TouchableOpacity>

        {filteredCrops.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>{t.noCropsFound}</Text>
          </View>
        ) : (
          filteredCrops.map((crop) => {
            const cost = workLogs
              .filter(w => w.cropId === crop.id)
              .reduce((sum, w) => sum + w.totalCost, 0);

            return (
              <TouchableOpacity key={crop.id} style={styles.cropListItem} onPress={() => onSelectCrop(crop)}>
                <View style={styles.cropListItemLeft}>
                  <Text style={styles.listItemType}>{crop.type} ({crop.variety})</Text>
                  <Text style={styles.listItemName}>{crop.name}</Text>
                  <Text style={styles.listItemField}>📍 {crop.field}</Text>
                </View>
                <View style={styles.cropListItemRight}>
                  <View style={[styles.listItemStage, { backgroundColor: getStageColor(crop.stage) }]}>
                    <Text style={styles.listItemStageText}>{translateStage(crop.stage, language)}</Text>
                  </View>
                  <Text style={styles.listItemExpense}>₹{cost.toFixed(0)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Crop Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.registerNewCrop}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{t.cropNameLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: കിഴക്കേ പറമ്പ് വരി 5' : 'e.g. East Field Row 5'} value={name} onChangeText={setName} />
              
              <Text style={styles.inputLabel}>{t.cropTypeLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: തക്കാളി, പയർ, വാഴ' : 'e.g. Tomatoes, Bananas'} value={type} onChangeText={setType} />
              
              <Text style={styles.inputLabel}>{t.varietyLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: റോമൻ റെഡ്, റോബസ്റ്റ' : 'e.g. Roma Red, Robusta'} value={variety} onChangeText={setVariety} />
              
              <Text style={styles.inputLabel}>{t.fieldLocationLabel}</Text>
              <TextInput style={styles.input} placeholder={language === 'ml' ? 'ഉദാ: പ്ലോട്ട് എ, ഗ്രീൻഹൗസ് 1' : 'e.g. Plot A, Greenhouse 1'} value={field} onChangeText={setField} />
              
              <Text style={styles.inputLabel}>{t.plantingDateLabel}</Text>
              <TextInput style={styles.input} value={plantingDate} onChangeText={setPlantingDate} />

              <Text style={styles.inputLabel}>{t.expectedHarvestLabel}</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={expectedHarvestDate} onChangeText={setExpectedHarvestDate} />

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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 14,
  },
  detailHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6e8070',
    textTransform: 'uppercase',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b3a1e',
    marginVertical: 4,
  },
  detailSub: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  datesContainer: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8e2',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2,
  },
  notesText: {
    marginTop: 15,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    backgroundColor: '#f1f8e9',
    padding: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b3a1e',
    marginTop: 10,
    marginBottom: 12,
  },
  stagePickerScroll: {
    marginBottom: 20,
  },
  stagePickerItem: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  stagePickerText: {
    fontSize: 12,
    color: '#555',
  },
  expenseSummaryCard: {
    backgroundColor: '#1b3a1e',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  expenseSummaryTitle: {
    color: '#c2dbbe',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  expenseSummaryVal: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 8,
  },
  expenseSummaryBreakdown: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
    marginTop: 8,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    color: '#e4f0e1',
    fontSize: 11,
    marginBottom: 4,
  },
  breakdownVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  detailActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailActionBtn: {
    flex: 1,
    backgroundColor: '#1b3a1e',
    marginHorizontal: 4,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyLogsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8e2',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyLogsText: {
    color: '#6e8070',
    fontSize: 12,
  },
  timelineContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2e7d32',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
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
    color: '#2e7d32',
  },
  timelineDate: {
    fontSize: 11,
    color: '#7f8c8d',
    marginVertical: 2,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#555',
    backgroundColor: '#f9f9f9',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineMiniBreakdown: {
    fontSize: 9,
    color: '#95a5a6',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pestLogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#e2e8e2',
  },
  pestLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pestName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  pestCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
  },
  pestSub: {
    fontSize: 11,
    color: '#7f8c8d',
    marginVertical: 2,
  },
  pestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f1f1',
    paddingTop: 8,
  },
  pestGridItem: {
    width: '50%',
    marginVertical: 4,
  },
  pestGridLabel: {
    fontSize: 9,
    color: '#95a5a6',
    fontWeight: '700',
  },
  pestGridVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 1,
  },
  deleteBtn: {
    backgroundColor: '#fde8e8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteBtnText: {
    color: '#e53e3e',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBarContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8e2',
  },
  searchInput: {
    backgroundColor: '#f1f5f1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8e2',
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1b3a1e',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6e8070',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  addBtn: {
    backgroundColor: '#1b3a1e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  cropListItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b3a1e',
    marginVertical: 2,
  },
  listItemField: {
    fontSize: 12,
    color: '#6e8070',
  },
  cropListItemRight: {
    alignItems: 'flex-end',
  },
  listItemStage: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  listItemStageText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  listItemExpense: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e7d32',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#95a5a6',
    fontSize: 14,
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
    maxHeight: '85%',
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
});
