export type CropStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvested' | 'Archived';

export type ActivityType = string;

export interface Crop {
  id: string;
  name: string;
  type: string;
  variety: string;
  field: string;
  plantingDate: string;
  expectedHarvestDate: string;
  stage: CropStage;
  notes: string;
}

export interface WorkLog {
  id: string;
  cropId: string;
  activityType: ActivityType;
  date: string;
  durationMinutes: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  totalCost: number;
  notes: string;
  manureName?: string;
  yieldKg?: number;
  rawYieldKg?: number;
  processingCharge?: number;
  income?: number;
  noOfWorkers?: number;
  laborCostPerWorker?: number;
  pricePerKg?: number;
}

export interface PesticideLog {
  id: string;
  cropIds: string[];
  pesticideName: string;
  dosage: string;
  appliedQuantity: string;
  date: string;
  targetPest?: string;
  activeIngredient?: string;
  reentryHours?: number;
  withholdingDays?: number;
  cost?: number;
  noOfWorkers?: number;
  laborCostPerWorker?: number;
}

