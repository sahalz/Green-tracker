export type CropStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvested' | 'Archived';

export type ActivityType = 'Tillage' | 'Planting' | 'Weeding' | 'Irrigation' | 'Pruning' | 'Spraying' | 'Harvesting' | 'Adding Manure' | 'Other';

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
}

export interface PesticideLog {
  id: string;
  cropIds: string[];
  pesticideName: string;
  dosage: string;
  appliedQuantity: string;
  date: string;
}
