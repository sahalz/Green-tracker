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
  malesCount?: number;
  femalesCount?: number;
  kidsCount?: number;
  stageCountKid?: number;
  stageCountGrower?: number;
  stageCountBreeder?: number;
  stageCountPregnant?: number;
  stageCountLactating?: number;
  stageCountArchived?: number;
  fishCount?: number;
  syncCode?: string;
  feedReminderEnabled?: boolean;
  feedReminderTime?: string;
  sprayReminderEnabled?: boolean;
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
  malesCount?: number;
  femalesCount?: number;
  kidsCount?: number;
  breededGoat?: string;
  motherGoat?: string;
  kidsConverted?: boolean;
  fishCount?: number;
  phValue?: number;
  syncCode?: string;
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
  syncCode?: string;
  requiresReminder?: boolean;
}

export interface LaborPayment {
  id: string;
  cropId: string;
  date: string;
  amountPaid: number;
  paymentMode?: string;
  notes?: string;
  syncCode?: string;
}



