import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Crop, WorkLog, ActivityType } from '../types';
import { Language, TRANSLATIONS, translateActivity } from '../translations';

interface ActivitiesTabProps {
  crops: Crop[];
  workLogs: WorkLog[];
  onAddWorkLog: (log: Omit<WorkLog, 'id' | 'totalCost'>) => Promise<any>;
  onDeleteWorkLog: (id: string) => Promise<any>;
  preselectedCropId: string | null;
  onClosePreselection: () => void;
  language: Language;
}

const ACTIVITIES: ActivityType[] = ['Tillage', 'Planting', 'Weeding', 'Irrigation', 'Pruning', 'Spraying', 'Harvesting', 'Adding Manure', 'Other'];

export default function ActivitiesTab({
  crops,
  workLogs,
  onAddWorkLog,
  onDeleteWorkLog,
  preselectedCropId,
  onClosePreselection,
  language,
}: ActivitiesTabProps) {
  const t = TRANSLATIONS[language];

  // UI states
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [selectedCropId, setSelectedCropId] = useState(preselectedCropId || (crops[0]?.id || ''));
  const [activityType, setActivityType] = useState<ActivityType>('Weeding');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [laborCost, setLaborCost] = useState('0');
  const [materialCost, setMaterialCost] = useState('0');
  const [equipmentCost, setEquipmentCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [manureName, setManureName] = useState('');

  // When preselectedCropId changes, update state
  React.useEffect(() => {
    if (preselectedCropId) {
      setSelectedCropId(preselectedCropId);
      setShowAddModal(true);
    }
  }, [preselectedCropId]);

  const handleSubmit = async () => {
    if (!selectedCropId) {
      Alert.alert(
        language === 'ml' ? 'വിള ആവശ്യമാണ്' : 'Missing Crop',
        language === 'ml' ? 'ആദ്യം ഒരു വിള വിവരങ്ങൾ രജിസ്റ്റർ ചെയ്തതിനു ശേഷം മാത്രം ജോലി രേഖപ്പെടുത്തുക.' : 'Please register a crop cycle first before logging work.'
      );
      return;
    }

    if (activityType === 'Adding Manure' && !manureName.trim()) {
      Alert.alert(
        language === 'ml' ? 'വളത്തിൻ്റെ പേര് ആവശ്യമാണ്' : 'Missing Manure Name',
        language === 'ml' ? 'വളത്തിൻ്റെ പേര് ദയവായി രേഖപ്പെടുത്തുക.' : 'Please enter the name of the manure.'
      );
      return;
    }

    const logData = {
      cropId: selectedCropId,
      activityType,
      date,
      durationMinutes: activityType === 'Adding Manure' ? 0 : (Number(durationMinutes) || 0),
      laborCost: Number(laborCost) || 0,
      materialCost: Number(materialCost) || 0,
      equipmentCost: Number(equipmentCost) || 0,
      notes,
      manureName: activityType === 'Adding Manure' ? manureName : undefined,
    };

    await onAddWorkLog(logData);
    setShowAddModal(false);
    onClosePreselection();

    // Reset Form
    setDurationMinutes('60');
    setLaborCost('0');
    setMaterialCost('0');
    setEquipmentCost('0');
    setNotes('');
    setManureName('');
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    onClosePreselection();
    setManureName('');
  };

  const handleDelete = (logId: string, activityName: string) => {
    Alert.alert(
      language === 'ml' ? 'ജോലി ഒഴിവാക്കണോ?' : 'Delete Log',
      language === 'ml'
        ? `ഈ "${translateActivity(activityName, language)}" രേഖപ്പെടുത്തൽ ഒഴിവാക്കാൻ താല്പര്യപ്പെടുന്നുണ്ടോ?`
        : `Are you sure you want to delete this "${activityName}" work log? This will remove its expenses from the crop cycle.`,
      [
        { text: language === 'ml' ? 'വേണ്ട' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeleteWorkLog(logId);
          },
        },
      ]
    );
  };

  // Filter and search
  const filteredLogs = workLogs.filter((log) => {
    const crop = crops.find((c) => c.id === log.cropId);
    const cropName = crop ? crop.name : '';
    const cropType = crop ? crop.type : '';
    
    const matchesSearch = cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || log.activityType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchActivities}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Row */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'All' && styles.filterChipActive]}
            onPress={() => setFilterType('All')}
          >
            <Text style={[styles.filterChipText, filterType === 'All' && styles.filterChipTextActive]}>{language === 'ml' ? 'എല്ലാം' : 'All'}</Text>
          </TouchableOpacity>
          {ACTIVITIES.map((act) => (
            <TouchableOpacity
              key={act}
              style={[styles.filterChip, filterType === act && styles.filterChipActive]}
              onPress={() => setFilterType(act)}
            >
              <Text style={[styles.filterChipText, filterType === act && styles.filterChipTextActive]}>{translateActivity(act, language)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Add Work Log Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>➕ {t.logWorkActivity}</Text>
        </TouchableOpacity>

        {filteredLogs.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>{t.noActivitiesLogged}</Text>
          </View>
        ) : (
          filteredLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => {
            const crop = crops.find((c) => c.id === log.cropId);
            const displayActivityLabel = log.activityType === 'Adding Manure' && log.manureName
              ? `${translateActivity(log.activityType, language)} (${log.manureName})`
              : translateActivity(log.activityType, language);
            
            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cropName}>{crop ? crop.name : 'Unknown Crop'}</Text>
                    <Text style={styles.activityLabel}>{displayActivityLabel} • {log.date}</Text>
                  </View>
                  <View style={styles.costBox}>
                    <Text style={styles.costVal}>₹{log.totalCost.toFixed(2)}</Text>
                    {log.activityType !== 'Adding Manure' && (
                      <Text style={styles.durationLabel}>{log.durationMinutes} {language === 'ml' ? 'മിനിറ്റ്' : 'mins'}</Text>
                    )}
                  </View>
                </View>

                {log.notes ? (
                  <Text style={styles.notesText}>{log.notes}</Text>
                ) : null}

                {/* Expense Breakdown Badge Row */}
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownBadge}>
                    <Text style={styles.breakdownBadgeText}>👨‍🌾 {t.laborCost}: ₹{log.laborCost.toFixed(0)}</Text>
                  </View>
                  <View style={[styles.breakdownBadge, { backgroundColor: '#e8f5e9' }]}>
                    <Text style={[styles.breakdownBadgeText, { color: '#2e7d32' }]}>🌱 {language === 'ml' ? 'സാധനം' : 'Material'}: ₹{log.materialCost.toFixed(0)}</Text>
                  </View>
                  <View style={[styles.breakdownBadge, { backgroundColor: '#e3f2fd' }]}>
                    <Text style={[styles.breakdownBadgeText, { color: '#1565c0' }]}>🚜 {language === 'ml' ? 'ഉപകരണങ്ങൾ' : 'Equip'}: ₹{log.equipmentCost.toFixed(0)}</Text>
                  </View>
                </View>

                {/* Delete button */}
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(log.id, log.activityType)}>
                  <Text style={styles.deleteButtonText}>{language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete Entry'}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Work Log Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.logWorkActivity}</Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>{t.associateCrop}</Text>
              <View style={styles.selectWrapper}>
                {crops.length === 0 ? (
                  <Text style={styles.errorText}>{t.noCropsFound}</Text>
                ) : (
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.cropSelector}>
                    {crops.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.cropSelectChip, selectedCropId === c.id && styles.cropSelectChipActive]}
                        onPress={() => setSelectedCropId(c.id)}
                      >
                        <Text style={[styles.cropSelectText, selectedCropId === c.id && styles.cropSelectTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <Text style={styles.inputLabel}>{t.activityType}</Text>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.activitySelector}>
                {ACTIVITIES.map((act) => (
                  <TouchableOpacity
                    key={act}
                    style={[styles.activitySelectChip, activityType === act && styles.activitySelectChipActive]}
                    onPress={() => setActivityType(act)}
                  >
                    <Text style={[styles.activitySelectText, activityType === act && styles.activitySelectTextActive]}>
                      {translateActivity(act, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} />

              {activityType === 'Adding Manure' ? (
                <View>
                  <Text style={styles.inputLabel}>{t.manureNameLabel}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder={language === 'ml' ? 'ഉദാ: ചാണകം, കമ്പോസ്റ്റ്' : 'e.g. Cow Dung, Compost'} 
                    value={manureName} 
                    onChangeText={setManureName} 
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>{t.duration}</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={durationMinutes} onChangeText={setDurationMinutes} />
                </View>
              )}

              {/* Expense Section */}
              <View style={styles.expensesContainer}>
                <Text style={styles.expenseSectionHeader}>{t.expenseBreakdown}</Text>
                
                <View style={styles.expenseRow}>
                  <View style={styles.expenseCol}>
                    <Text style={styles.expenseInputLabel}>{t.laborCost}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={laborCost} onChangeText={setLaborCost} />
                  </View>
                  <View style={styles.expenseCol}>
                    <Text style={styles.expenseInputLabel}>{language === 'ml' ? 'സാധനം' : 'Material Cost'}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={materialCost} onChangeText={setMaterialCost} />
                  </View>
                  <View style={styles.expenseCol}>
                    <Text style={styles.expenseInputLabel}>{language === 'ml' ? 'ഇന്ധനം / വാടക' : 'Equipment/Fuel'}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={equipmentCost} onChangeText={setEquipmentCost} />
                  </View>
                </View>
                <View style={styles.calcCostContainer}>
                  <Text style={styles.calcCostText}>
                    {language === 'ml' ? 'ആകെ കണക്കാക്കിയ ചിലവ്' : 'Estimated Total Cost'}:{' '}
                    <Text style={styles.boldText}>
                      ₹{(Number(laborCost) + Number(materialCost) + Number(equipmentCost)).toFixed(2)}
                    </Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline={true}
                placeholder={language === 'ml' ? 'കുറിപ്പുകൾ...' : 'Details of the job...'}
                value={notes}
                onChangeText={setNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={handleCloseModal}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>{t.logActivity}</Text>
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
    backgroundColor: '#f5f7f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
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
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  logCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cropName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  activityLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  costBox: {
    alignItems: 'flex-end',
  },
  costVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2e7d32',
  },
  durationLabel: {
    fontSize: 10,
    color: '#95a5a6',
  },
  notesText: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
    color: '#555',
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  breakdownBadge: {
    backgroundColor: '#fffdf3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  breakdownBadgeText: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '600',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    padding: 4,
  },
  deleteButtonText: {
    color: '#e53e3e',
    fontSize: 11,
    fontWeight: '600',
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
    marginTop: 12,
    marginBottom: 6,
  },
  selectWrapper: {
    marginVertical: 4,
  },
  cropSelector: {
    paddingVertical: 4,
  },
  cropSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f1f5f1',
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#e2e8e2',
  },
  cropSelectChipActive: {
    backgroundColor: '#1b3a1e',
    borderColor: '#1b3a1e',
  },
  cropSelectText: {
    fontSize: 11,
    color: '#555',
  },
  cropSelectTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  activitySelector: {
    paddingVertical: 4,
    marginBottom: 6,
  },
  activitySelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f1f5f1',
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#e2e8e2',
  },
  activitySelectChipActive: {
    backgroundColor: '#1b3a1e',
    borderColor: '#1b3a1e',
  },
  activitySelectText: {
    fontSize: 11,
    color: '#555',
  },
  activitySelectTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f1f5f1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  expensesContainer: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  expenseSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7f8c8d',
    marginBottom: 8,
    letterSpacing: 1,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseCol: {
    width: '31%',
  },
  expenseInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6e8070',
    marginBottom: 4,
  },
  calcCostContainer: {
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  calcCostText: {
    fontSize: 12,
    color: '#333',
  },
  boldText: {
    fontWeight: '800',
    color: '#2e7d32',
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
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
  },
});
