import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  language: 'en' | 'ml';
  placeholder?: string;
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_ML = [
  'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മെയ്', 'ജൂൺ',
  'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
];

const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_ML = ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ', 'വെ', 'ശ'];

export default function CustomDatePicker({ value, onChange, language, placeholder }: CustomDatePickerProps) {
  const [showModal, setShowModal] = useState(false);

  // Initialize with current date or parsed value
  const today = new Date();
  let initialYear = today.getFullYear();
  let initialMonth = today.getMonth();

  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split('-').map(Number);
    initialYear = parts[0];
    initialMonth = parts[1] - 1; // 0-indexed
  }

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const selectDay = (day: number, month: number, year: number) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    onChange(dateStr);
    setShowModal(false);
  };

  // Build grid: 42 cells (6 rows * 7 columns)
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  const totalDays = getDaysInMonth(currentYear, currentMonth);

  const cells = [];
  
  // Previous month padding
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthDaysCount = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDaysCount - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    cells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const remainingCells = 42 - cells.length;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  const monthsList = language === 'ml' ? MONTHS_ML : MONTHS_EN;
  const daysList = language === 'ml' ? DAYS_ML : DAYS_EN;

  // Format value to display in input field
  let displayValue = value || placeholder || (language === 'ml' ? 'തീയതി തിരഞ്ഞെടുക്കുക' : 'Select Date');

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerField}
        onPress={() => {
          // Re-initialize view to the selected date or current date on open
          if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const parts = value.split('-').map(Number);
            setCurrentYear(parts[0]);
            setCurrentMonth(parts[1] - 1);
          } else {
            setCurrentYear(today.getFullYear());
            setCurrentMonth(today.getMonth());
          }
          setShowModal(true);
        }}
      >
        <Text style={[styles.pickerFieldText, !value && styles.placeholderText]}>{displayValue}</Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            
            {/* Calendar Header Navigation */}
            <View style={styles.header}>
              <View style={styles.headerNavRow}>
                <TouchableOpacity style={styles.navBtn} onPress={handlePrevYear}>
                  <Text style={styles.navBtnText}>«</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
                  <Text style={styles.navBtnText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                  {language === 'ml' ? `${currentYear} ${monthsList[currentMonth]}` : `${monthsList[currentMonth]} ${currentYear}`}
                </Text>

                <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
                  <Text style={styles.navBtnText}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtn} onPress={handleNextYear}>
                  <Text style={styles.navBtnText}>»</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weekday Names Row */}
            <View style={styles.weekdaysRow}>
              {daysList.map((day, idx) => (
                <Text key={idx} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {cells.map((cell, idx) => {
                const isSelected = 
                  value && 
                  /^\d{4}-\d{2}-\d{2}$/.test(value) && 
                  (() => {
                    const parts = value.split('-').map(Number);
                    return parts[0] === cell.year && parts[1] === (cell.month + 1) && parts[2] === cell.day;
                  })();

                const isToday = 
                  today.getFullYear() === cell.year && 
                  today.getMonth() === cell.month && 
                  today.getDate() === cell.day;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      !cell.isCurrentMonth && styles.dayCellInactive,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => selectDay(cell.day, cell.month, cell.year)}
                  >
                    <Text style={[
                      styles.dayText,
                      !cell.isCurrentMonth && styles.dayTextInactive,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}>
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Bottom Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>{language === 'ml' ? 'അടയ്ക്കുക' : 'Close'}</Text>
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
    marginBottom: 12,
    width: '100%',
  },
  pickerField: {
    backgroundColor: '#f1f5f1',
    borderRadius: 10,
    padding: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerFieldText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  calendarIcon: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    marginBottom: 12,
  },
  headerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b3a1e',
    flex: 1,
    textAlign: 'center',
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  navBtnText: {
    fontSize: 20,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingBottom: 6,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 19,
  },
  dayCellInactive: {
    opacity: 0.35,
  },
  dayCellSelected: {
    backgroundColor: '#2e7d32',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextInactive: {
    color: '#888',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayTextToday: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 12,
    alignItems: 'center',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f1',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
});
