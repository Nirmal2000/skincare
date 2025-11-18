import { RoutineIntake } from '@/types/api';

/**
 * Onboarding Question Type
 * Represents a single question in the onboarding flow
 */
export interface Question {
  id: keyof RoutineIntake;
  title: string;
  description: string;
  type: 'single' | 'multi' | 'text';
  options?: QuestionOption[];
  placeholder?: string;
}

export interface QuestionOption {
  label: string;
  value: string;
  description?: string;
}

/**
 * 8-Question Onboarding Flow
 * Based on RoutineIntake schema from types/api.ts
 */
export const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 'sensitivity',
    title: 'How sensitive is your skin?',
    description: 'This helps us recommend gentler products if needed.',
    type: 'single',
    options: [
      {
        label: 'Low',
        value: 'low',
        description: 'My skin tolerates most products well',
      },
      {
        label: 'Medium',
        value: 'medium',
        description: 'Some products cause mild irritation',
      },
      {
        label: 'High',
        value: 'high',
        description: 'My skin reacts easily to new products',
      },
      {
        label: "I'm not sure",
        value: 'unsure',
        description: "I haven't noticed a pattern yet",
      },
    ],
  },
  {
    id: 'pregnancy',
    title: 'Are you currently pregnant or nursing?',
    description: 'Some active ingredients are not recommended during pregnancy.',
    type: 'single',
    options: [
      {
        label: 'Yes',
        value: 'yes',
      },
      {
        label: 'No',
        value: 'no',
      },
      {
        label: 'Prefer not to say',
        value: 'prefer_not_to_say',
      },
    ],
  },
  {
    id: 'rx_topical',
    title: 'Are you using prescription topicals?',
    description: 'Examples: tretinoin, hydroquinone, prescription acne treatments.',
    type: 'single',
    options: [
      {
        label: 'Yes',
        value: 'yes',
      },
      {
        label: 'No',
        value: 'no',
      },
      {
        label: "I'm not sure",
        value: 'unsure',
      },
    ],
  },
  {
    id: 'allergies',
    title: 'Any known skincare allergies?',
    description: 'Select all ingredients you need to avoid.',
    type: 'multi',
    options: [
      { label: 'Fragrance', value: 'fragrance' },
      { label: 'Alcohol', value: 'alcohol' },
      { label: 'Sulfates', value: 'sulfates' },
      { label: 'Parabens', value: 'parabens' },
      { label: 'Essential Oils', value: 'essential_oils' },
      { label: 'Silicones', value: 'silicones' },
      { label: 'Chemical Sunscreens', value: 'chemical_sunscreens' },
      { label: 'None', value: 'none' },
    ],
  },
  {
    id: 'fitzpatrick',
    title: 'What is your skin tone?',
    description: 'Based on the Fitzpatrick scale. This helps with product safety.',
    type: 'single',
    options: [
      {
        label: 'Very fair to fair (I-II)',
        value: 'I-II',
        description: 'Burns easily, rarely tans',
      },
      {
        label: 'Medium (III-IV)',
        value: 'III-IV',
        description: 'Burns sometimes, tans gradually',
      },
      {
        label: 'Dark to very dark (V-VI)',
        value: 'V-VI',
        description: 'Rarely burns, tans easily',
      },
      {
        label: "I'm not sure",
        value: 'unsure',
      },
    ],
  },
  {
    id: 'current_actives',
    title: 'Which actives are you currently using?',
    description: 'Select all that apply to avoid product conflicts.',
    type: 'multi',
    options: [
      { label: 'Vitamin C', value: 'vitamin_c' },
      { label: 'Retinol / Retinoids', value: 'retinol' },
      { label: 'AHA (Glycolic, Lactic Acid)', value: 'aha' },
      { label: 'BHA (Salicylic Acid)', value: 'bha' },
      { label: 'Niacinamide', value: 'niacinamide' },
      { label: 'Azelaic Acid', value: 'azelaic_acid' },
      { label: 'Benzoyl Peroxide', value: 'benzoyl_peroxide' },
      { label: 'None', value: 'none' },
    ],
  },
  {
    id: 'country',
    title: 'Where are you located?',
    description: "We'll recommend products available in your region.",
    type: 'text',
    placeholder: 'e.g., United States, Canada, UK',
  },
  {
    id: 'budget_preference',
    title: "What's your budget preference?",
    description: "We'll prioritize products in your preferred price range.",
    type: 'single',
    options: [
      {
        label: 'Budget-friendly',
        value: 'budget',
        description: 'Under $20 per product',
      },
      {
        label: 'Mid-range',
        value: 'mid',
        description: '$20-$50 per product',
      },
      {
        label: 'Premium',
        value: 'premium',
        description: '$50+ per product',
      },
      {
        label: 'No preference',
        value: 'no_pref',
        description: 'Show me all options',
      },
    ],
  },
];
