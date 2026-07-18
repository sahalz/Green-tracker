import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Crop, WorkLog, PesticideLog } from '../types';
import { Language, TRANSLATIONS, translateStage, translateActivity } from '../translations';

interface DashboardProps {
  crops: Crop[];
  workLogs: WorkLog[];
  pesticideLogs: PesticideLog[];
  onNavigateToTab: (tab: string) => void;
  onSelectCrop: (crop: Crop) => void;
  language: Language;
}

export default function Dashboard({ crops, workLogs, pesticideLogs, onNavigateToTab, onSelectCrop, language }: DashboardProps) {
  const t = TRANSLATIONS[language];

  // Calculations
  const activeCrops = crops.filter(c => c.stage !== 'Archived');
  
  const totalExpenses = workLogs.reduce((sum, log) => sum + log.totalCost, 0);
  const laborTotal = workLogs.reduce((sum, log) => sum + log.laborCost, 0);
  const materialTotal = workLogs.reduce((sum, log) => sum + log.materialCost, 0);
  const equipmentTotal = workLogs.reduce((sum, log) => sum + log.equipmentCost, 0);

  // Expense by crop
  const cropExpenses = crops.map(crop => {
    const cost = workLogs
      .filter(log => log.cropId === crop.id)
      .reduce((sum, log) => sum + log.totalCost, 0);
    return { ...crop, cost };
  }).filter(c => c.cost > 0 || c.stage !== 'Archived');

  // Expense by activity type
  const activities = ['Tillage', 'Planting', 'Weeding', 'Irrigation', 'Pruning', 'Spraying', 'Harvesting', 'Adding Manure', 'Other'] as const;
  const activityCosts = activities.map(act => {
    const cost = workLogs
      .filter(log => log.activityType === act)
      .reduce((sum, log) => sum + log.totalCost, 0);
    return { name: act, cost };
  }).filter(a => a.cost > 0);

  const maxActivityCost = Math.max(...activityCosts.map(a => a.cost), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sub Header */}
      <View style={styles.header}>
        <Text style={styles.subWelcomeText}>{t.appSub}</Text>
      </View>

      {/* Main Expense Dashboard Card */}
      <View style={styles.dashboardCard}>
        <Text style={styles.cardLabel}>{t.totalInvestment}</Text>
        <Text style={styles.totalValue}>₹{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        
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

      {/* Quick Action Navigation Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigateToTab('Crops')}>
          <Text style={styles.actionBtnIcon}>🌿</Text>
          <Text style={styles.actionBtnText}>{t.addCrop}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigateToTab('Activities')}>
          <Text style={styles.actionBtnIcon}>📝</Text>
          <Text style={styles.actionBtnText}>{t.logWork}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigateToTab('Pesticides')}>
          <Text style={styles.actionBtnIcon}>🧪</Text>
          <Text style={styles.actionBtnText}>{t.sprayLog}</Text>
        </TouchableOpacity>
      </View>

      {/* Cost By Crop Section */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>{t.activeCropExpenses}</Text>
        <Text style={styles.sectionSub}>{t.costsAccumulated}</Text>
      </View>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {cropExpenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.noCropsFound}</Text>
          </View>
        ) : (
          cropExpenses.map(crop => (
            <TouchableOpacity key={crop.id} style={styles.cropExpenseCard} onPress={() => onSelectCrop(crop)}>
              <View style={styles.cropCardTop}>
                <Text style={styles.cropTypeName}>{crop.type}</Text>
                <View style={[styles.stageBadge, { backgroundColor: getStageColor(crop.stage) }]}>
                  <Text style={styles.stageText}>{translateStage(crop.stage, language)}</Text>
                </View>
              </View>
              <Text style={styles.cropCardName} numberOfLines={1}>{crop.name}</Text>
              <Text style={styles.cropCardLocation}>{crop.field}</Text>
              <View style={styles.cropCardDivider} />
              <View style={styles.cropCardBottom}>
                <Text style={styles.spentLabel}>{t.spent}:</Text>
                <Text style={styles.spentValue}>₹{crop.cost.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Activity Cost Chart */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>{t.spendingByActivity}</Text>
        <Text style={styles.sectionSub}>{t.comparingCosts}</Text>
      </View>

      <View style={styles.chartCard}>
        {activityCosts.length === 0 ? (
          <Text style={styles.emptyText}>{t.noActivitiesLogged}</Text>
        ) : (
          activityCosts.map(act => (
            <View key={act.name} style={styles.chartRow}>
              <Text style={styles.chartLabel} numberOfLines={1}>{translateActivity(act.name, language)}</Text>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { width: `${(act.cost / maxActivityCost) * 100}%` }]}>
                  <Text style={styles.chartBarValue}>₹{act.cost.toFixed(0)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  boldText: {
    fontWeight: '700',
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
  totalValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 10,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionBtn: {
    backgroundColor: '#ffffff',
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1b3a1e',
  },
  sectionHeaderContainer: {
    marginBottom: 10,
    marginTop: 5,
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
  horizontalScroll: {
    marginBottom: 25,
    paddingBottom: 5,
  },
  cropExpenseCard: {
    backgroundColor: '#ffffff',
    width: 200,
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cropCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropTypeName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6e8070',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stageText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  cropCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b3a1e',
    marginBottom: 2,
  },
  cropCardLocation: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  cropCardDivider: {
    height: 0.5,
    backgroundColor: '#e2e8e2',
    marginVertical: 10,
  },
  cropCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentLabel: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  spentValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e7d32',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8e2',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6e8070',
    fontSize: 12,
    textAlign: 'center',
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
    width: 95,
    fontSize: 11,
    fontWeight: '600',
    color: '#1b3a1e',
  },
  chartBarWrapper: {
    flex: 1,
    height: 20,
    backgroundColor: '#f1f5f1',
    borderRadius: 10,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  chartBarValue: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
