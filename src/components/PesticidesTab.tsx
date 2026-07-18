import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Crop, PesticideLog } from '../types';
import { Language, TRANSLATIONS } from '../translations';

interface PesticidesTabProps {
  crops: Crop[];
  pesticideLogs: PesticideLog[];
  onAddPesticideLog: (log: Omit<PesticideLog, 'id'>) => Promise<any>;
  onDeletePesticideLog: (id: string) => Promise<any>;
  preselectedCropId: string | null;
  onClosePreselection: () => void;
  language: Language;
}

export default function PesticidesTab({
  crops,
  pesticideLogs,
  onAddPesticideLog,
  onDeletePesticideLog,
  preselectedCropId,
  onClosePreselection,
  language,
}: PesticidesTabProps) {
  const t = TRANSLATIONS[language];

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
  const [pesticideName, setPesticideName] = useState('');
  const [dosage, setDosage] = useState('');
  const [appliedQuantity, setAppliedQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Preselected Crop handler
  React.useEffect(() => {
    if (preselectedCropId) {
      setSelectedCropIds([preselectedCropId]);
      setShowAddModal(true);
    }
  }, [preselectedCropId]);

  const toggleCropSelection = (cropId: string) => {
    if (selectedCropIds.includes(cropId)) {
      setSelectedCropIds(selectedCropIds.filter(id => id !== cropId));
    } else {
      setSelectedCropIds([...selectedCropIds, cropId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCropIds.length === 0 || !pesticideName) {
      Alert.alert(
        language === 'ml' ? 'അപൂർണ്ണമായ വിവരങ്ങൾ' : 'Missing Fields',
        language === 'ml' 
          ? 'കുറഞ്ഞത് ഒരു വിളയെങ്കിലും തെരഞ്ഞെടുക്കുക, കീടനാശിനിയുടെ പേര് രേഖപ്പെടുത്തുക.' 
          : 'Please select at least one crop and provide the Pesticide Name.'
      );
      return;
    }

    const logData: Omit<PesticideLog, 'id'> = {
      cropIds: selectedCropIds,
      pesticideName,
      dosage,
      appliedQuantity,
      date,
    };

    await onAddPesticideLog(logData);
    setShowAddModal(false);
    onClosePreselection();

    // Reset Form
    setSelectedCropIds([]);
    setPesticideName('');
    setDosage('');
    setAppliedQuantity('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedCropIds([]);
    onClosePreselection();
  };

  const handleDelete = (logId: string, name: string) => {
    Alert.alert(
      language === 'ml' ? 'കീടനാശിനി വിവരങ്ങൾ ഒഴിവാക്കണോ?' : 'Delete Spray Log',
      language === 'ml'
        ? `"${name}" അടിച്ചതിൻ്റെ വിവരങ്ങൾ ഒഴിവാക്കാൻ താല്പര്യപ്പെടുന്നുണ്ടോ?`
        : `Are you sure you want to delete the log for "${name}"?`,
      [
        { text: language === 'ml' ? 'വേണ്ട' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeletePesticideLog(logId);
          },
        },
      ]
    );
  };

  // Filter and search
  const filteredLogs = pesticideLogs.filter((log) => {
    // Check if search matches pesticide name or any of the applied crop names
    const cropNames = (log.cropIds || [])
      .map((cid) => crops.find((c) => c.id === cid)?.name || '')
      .join(' ')
      .toLowerCase();
    
    return log.pesticideName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           cropNames.includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPesticides}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Record Application Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>🧪 {t.recordSpray}</Text>
        </TouchableOpacity>

        {filteredLogs.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>{t.noPesticidesLogged}</Text>
          </View>
        ) : (
          filteredLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => {
            const cropList = (log.cropIds || [])
              .map((cid) => crops.find((c) => c.id === cid)?.name)
              .filter(Boolean)
              .join(', ');

            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.pestName}>{log.pesticideName}</Text>
                    <Text style={styles.cropRelation}>
                      {language === 'ml' ? 'വിളകൾ' : 'Crops'}: {cropList || 'None'}
                    </Text>
                  </View>
                  <View style={styles.costBox}>
                    <Text style={styles.dateLabel}>{log.date}</Text>
                  </View>
                </View>

                {/* Spray Specifications Grid */}
                <View style={styles.specsGrid}>
                  <View style={styles.specCell}>
                    <Text style={styles.specLabel}>{language === 'ml' ? 'അളവ്' : 'DOSAGE'}</Text>
                    <Text style={styles.specVal}>{log.dosage || 'Not specified'}</Text>
                  </View>
                  <View style={styles.specCell}>
                    <Text style={styles.specLabel}>{language === 'ml' ? 'ആകെ ഉപയോഗിച്ചത്' : 'QUANTITY MIXED'}</Text>
                    <Text style={styles.specVal}>{log.appliedQuantity || 'Not specified'}</Text>
                  </View>
                </View>

                {/* Delete Entry */}
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(log.id, log.pesticideName)}>
                  <Text style={styles.deleteButtonText}>{language === 'ml' ? 'ഒഴിവാക്കുക' : 'Delete Spray Log'}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Pesticide Application Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.recordSpray}</Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>
                {language === 'ml' ? 'വിളകൾ തെരഞ്ഞെടുക്കുക (ഒന്നിൽ കൂടുതൽ ആകാം) *' : 'Select Applied Crops (Multiple Select) *'}
              </Text>
              <View style={styles.selectWrapper}>
                {crops.length === 0 ? (
                  <Text style={styles.errorText}>{t.noCropsFound}</Text>
                ) : (
                  <View style={styles.cropGrid}>
                    {crops.map((c) => {
                      const isSelected = selectedCropIds.includes(c.id);
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.cropSelectChip, isSelected && styles.cropSelectChipActive]}
                          onPress={() => toggleCropSelection(c.id)}
                        >
                          <Text style={[styles.cropSelectText, isSelected && styles.cropSelectTextActive]}>
                            {isSelected ? '✓ ' : ''}{c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>{t.pesticideProductName}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={language === 'ml' ? 'ഉദാ: ബ്ലൈറ്റ്സ്റ്റോപ്പ്, വേപ്പെണ്ണ' : 'e.g. Copper Fungicide, Neem Oil'} 
                value={pesticideName} 
                onChangeText={setPesticideName} 
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{t.dosageRate}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 15ml / Litre" 
                    value={dosage} 
                    onChangeText={setDosage} 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>{language === 'ml' ? 'ലായനിയുടെ അളവ്' : 'Quantity Mixed'}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 20 Litres" 
                    value={appliedQuantity} 
                    onChangeText={setAppliedQuantity} 
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={handleCloseModal}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>{t.recordSprayBtn}</Text>
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
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  pestName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b3a1e',
  },
  cropRelation: {
    fontSize: 12,
    color: '#6e8070',
    marginTop: 4,
    lineHeight: 16,
  },
  costBox: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 0.5,
    borderTopColor: '#f1f1f1',
    paddingTop: 8,
    marginTop: 8,
  },
  specCell: {
    width: '50%',
    marginVertical: 4,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#95a5a6',
  },
  specVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 1,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
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
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cropSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f1f5f1',
    marginRight: 6,
    marginBottom: 6,
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
  input: {
    backgroundColor: '#f1f5f1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
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
