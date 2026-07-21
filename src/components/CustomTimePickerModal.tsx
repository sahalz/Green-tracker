import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';

interface CustomTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time24h: string) => void; // Returns "HH:MM"
  language: 'en' | 'ml';
  initialTime?: string; // Optional "HH:MM"
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function CustomTimePickerModal({
  visible,
  onClose,
  onSelectTime,
  language,
  initialTime,
}: CustomTimePickerModalProps) {
  // Parse initial time
  let defaultHour = 8;
  let defaultMinute = 0;
  let defaultPeriod: 'AM' | 'PM' = 'AM';

  if (initialTime && /^\d{2}:\d{2}$/.test(initialTime)) {
    const parts = initialTime.split(':').map(Number);
    const hour24 = parts[0];
    defaultMinute = Math.round(parts[1] / 5) * 5; // round to nearest 5
    if (defaultMinute >= 60) defaultMinute = 55;

    if (hour24 === 0) {
      defaultHour = 12;
      defaultPeriod = 'AM';
    } else if (hour24 === 12) {
      defaultHour = 12;
      defaultPeriod = 'PM';
    } else if (hour24 > 12) {
      defaultHour = hour24 - 12;
      defaultPeriod = 'PM';
    } else {
      defaultHour = hour24;
      defaultPeriod = 'AM';
    }
  }

  const [selectedHour, setSelectedHour] = useState(defaultHour);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(defaultPeriod);

  const handleConfirm = () => {
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 += 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const timeStr = `${pad(hour24)}:${pad(selectedMinute)}`;
    onSelectTime(timeStr);
    onClose();
  };

  const t = {
    title: language === 'ml' ? 'തീറ്റ സമയം തിരഞ്ഞെടുക്കുക' : 'Select Feeding Time',
    hourLabel: language === 'ml' ? 'മണിക്കൂർ' : 'Hour',
    minuteLabel: language === 'ml' ? 'മിനിറ്റ്' : 'Minute',
    confirm: language === 'ml' ? 'തീരുമാനിക്കുക' : 'Confirm',
    cancel: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerCard}>
          <Text style={styles.modalTitle}>{t.title}</Text>

          {/* AM / PM Selector */}
          <View style={styles.periodRow}>
            <TouchableOpacity
              style={[
                styles.periodChip,
                selectedPeriod === 'AM' && styles.periodChipActive,
              ]}
              onPress={() => setSelectedPeriod('AM')}
            >
              <Text
                style={[
                  styles.periodChipText,
                  selectedPeriod === 'AM' && styles.periodChipTextActive,
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodChip,
                selectedPeriod === 'PM' && styles.periodChipActive,
              ]}
              onPress={() => setSelectedPeriod('PM')}
            >
              <Text
                style={[
                  styles.periodChipText,
                  selectedPeriod === 'PM' && styles.periodChipTextActive,
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hours Section */}
          <Text style={styles.sectionLabel}>{t.hourLabel}</Text>
          <View style={styles.grid}>
            {HOURS.map((hr) => (
              <TouchableOpacity
                key={hr}
                style={[
                  styles.gridChip,
                  selectedHour === hr && styles.gridChipActive,
                ]}
                onPress={() => setSelectedHour(hr)}
              >
                <Text
                  style={[
                    styles.gridChipText,
                    selectedHour === hr && styles.gridChipTextActive,
                  ]}
                >
                  {hr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Minutes Section */}
          <Text style={styles.sectionLabel}>{t.minuteLabel}</Text>
          <View style={styles.grid}>
            {MINUTES.map((min) => {
              const formattedMin = min < 10 ? `0${min}` : `${min}`;
              return (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.gridChip,
                    selectedMinute === min && styles.gridChipActive,
                  ]}
                  onPress={() => setSelectedMinute(min)}
                >
                  <Text
                    style={[
                      styles.gridChipText,
                      selectedMinute === min && styles.gridChipTextActive,
                    ]}
                  >
                    {formattedMin}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>{t.confirm}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006064',
    textAlign: 'center',
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  periodChip: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f5',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodChipActive: {
    backgroundColor: '#006064',
    borderColor: '#006064',
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  periodChipTextActive: {
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridChip: {
    width: '22%',
    paddingVertical: 8,
    backgroundColor: '#f1f5f5',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gridChipActive: {
    backgroundColor: '#006064',
    borderColor: '#006064',
  },
  gridChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  gridChipTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  modalBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#006064',
  },
  confirmBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
