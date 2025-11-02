import { supabase } from './supabase';

export interface SoapTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  keywords: string[];
  usageCount?: number;
}

export interface SmartSuggestion {
  text: string;
  confidence: number;
  source: 'history' | 'template' | 'common';
  category?: string;
}

export const CONDITIONS_TEMPLATES: SoapTemplate[] = [
  {
    id: 'lombalgie',
    name: 'Lombalgie Aiguë',
    category: 'Dos',
    icon: '🔴',
    color: 'red',
    subjective: 'Patient rapporte douleur bas dos depuis [durée], intensité [1-10]/10, aggravée par [mouvement], soulagée par [position/repos]',
    objective: 'Restriction ROM L4-L5-S1, tension paravertébrale bilatérale, spasmes musculaires lombaires, test de Lasègue négatif',
    assessment: 'Subluxation lombaire avec composante musculaire, irritation facettaire L4-L5',
    plan: 'Ajustement chiropratique lombaire, thérapie des tissus mous, recommandations posturales, réévaluation dans [délai]',
    keywords: ['lombalgie', 'bas dos', 'lombaire', 'L4', 'L5', 'sacrum']
  },
  {
    id: 'cervicalgie',
    name: 'Cervicalgie/Torticolis',
    category: 'Cou',
    icon: '🟡',
    color: 'yellow',
    subjective: 'Douleur cervicale depuis [durée], irradiation [membre/épaule], raideur matinale, difficulté rotation [direction]',
    objective: 'Restriction ROM C3-C4-C5, hypertonie trapèzes supérieurs, tendreté paravertébrale, diminution mobilité articulaire',
    assessment: 'Dysfonction cervicale segmentaire C4-C5, syndrome de dérangement postural',
    plan: 'Ajustement cervical doux, mobilisation articulaire, exercices stretching, ergonomie posturale, suivi [délai]',
    keywords: ['cervicalgie', 'cou', 'cervical', 'torticolis', 'nuque', 'C3', 'C4']
  },
  {
    id: 'sciatique',
    name: 'Sciatique/Radiculopathie',
    category: 'Dos',
    icon: '🔵',
    color: 'blue',
    subjective: 'Douleur radiante bas dos vers [jambe gauche/droite], paresthésies [localisation], engourdissement [zone], aggravée position assise',
    objective: 'Test Lasègue positif [angle], diminution réflexe [achilléen/rotulien], faiblesse [groupe musculaire], dermatome [L4/L5/S1] affecté',
    assessment: 'Radiculopathie L5 droite, probable hernie discale L4-L5, compression nerf sciatique',
    plan: 'Décompression vertébrale douce, flexion-distraction, évaluation IRM si pas amélioration 4 semaines, éviter flexion, suivi rapproché',
    keywords: ['sciatique', 'radiante', 'jambe', 'hernie', 'lasègue', 'radiculopathie']
  },
  {
    id: 'cephalees',
    name: 'Céphalées Cervicogéniques',
    category: 'Tête',
    icon: '🟣',
    color: 'purple',
    subjective: 'Céphalées [fréquence] depuis [durée], débutant nuque irradiant [tempe/front], intensité [1-10]/10, déclenchées par [facteur]',
    objective: 'Restriction C1-C2-C3, trigger points sous-occipitaux, diminution mobilité cervicale haute, posture antérieure tête',
    assessment: 'Céphalées cervicogéniques secondaires à dysfonction cervicale haute, syndrome croisé supérieur',
    plan: 'Ajustement cervical haut, relâchement sous-occipitaux, correction posturale, hydratation, journal céphalées, réévaluation [délai]',
    keywords: ['céphalée', 'migraine', 'mal de tête', 'tête', 'cervicogénique']
  },
  {
    id: 'epaule',
    name: 'Épaule Douloureuse',
    category: 'Membre Supérieur',
    icon: '🟠',
    color: 'orange',
    subjective: 'Douleur épaule [gauche/droite] depuis [durée], limitation [abduction/rotation], difficulté [activités], douleur nocturne [oui/non]',
    objective: 'ROM épaule [degrés], tests conflit positifs (Neer/Hawkins), faiblesse rotation externe, posture épaule antérieure',
    assessment: 'Conflit sous-acromial, possible tendinopathie supra-épineux, dyskinésie scapulaire',
    plan: 'Mobilisation articulaire épaule, thérapie tissus mous coiffe, exercices stabilisation scapulaire, repos relatif, glace, suivi [délai]',
    keywords: ['épaule', 'bras', 'coiffe', 'rotateur', 'acromial']
  },
  {
    id: 'entretien',
    name: 'Visite d\'Entretien',
    category: 'Maintenance',
    icon: '✅',
    color: 'green',
    subjective: 'Visite d\'entretien régulier, pas de nouvelle plainte, état général [bon/stable], activités quotidiennes normales',
    objective: 'Mobilité articulaire conservée, tonus musculaire équilibré, alignement postural optimal, tests orthopédiques négatifs',
    assessment: 'État neuro-musculo-squelettique stable, maintien santé vertébrale optimale',
    plan: 'Ajustement préventif complet, recommandations exercices, prochain entretien [4-6 semaines]',
    keywords: ['entretien', 'maintenance', 'préventif', 'suivi', 'stable']
  }
];

export const COMMON_PHRASES = {
  subjective: [
    'Patient rapporte douleur',
    'Apparition progressive depuis',
    'Traumatisme/accident récent',
    'Pas de drapeau rouge',
    'Antécédents similaires',
    'Première occurrence',
    'Aggravée par mouvement',
    'Soulagée par repos',
    'Douleur constante',
    'Douleur intermittente'
  ],
  objective: [
    'Restriction ROM',
    'Tension paravertébrale',
    'Spasmes musculaires',
    'Palpation révèle',
    'Tests orthopédiques négatifs',
    'Posture antérieure',
    'Asymétrie pelvienne',
    'Mobilité articulaire diminuée',
    'Hypertonie musculaire',
    'Points trigger actifs'
  ],
  assessment: [
    'Subluxation vertébrale',
    'Dysfonction segmentaire',
    'Syndrome de dérangement',
    'Irritation facettaire',
    'Composante musculaire',
    'Origine mécanique',
    'Pronostic favorable',
    'Évolution positive',
    'Réponse au traitement',
    'Chronicisation possible'
  ],
  plan: [
    'Ajustement chiropratique',
    'Thérapie tissus mous',
    'Mobilisation articulaire',
    'Recommandations posturales',
    'Exercices thérapeutiques',
    'Réévaluation dans',
    'Suivi rapproché',
    'Imagerie si besoin',
    'Référence si pas amélioration',
    'Plan de soins progressif'
  ]
};

export async function getPatientHistory(patientId: string, limit: number = 5) {
  try {
    const { data, error } = await supabase
      .from('soap_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching patient history:', error);
    return [];
  }
}

export async function analyzePatternFromHistory(patientId: string): Promise<SmartSuggestion[]> {
  const history = await getPatientHistory(patientId, 10);
  const suggestions: SmartSuggestion[] = [];

  if (history.length === 0) return suggestions;

  const recentNote = history[0];
  const allNotes = history;

  const assessmentWords = allNotes
    .map(n => n.assessment?.toLowerCase() || '')
    .join(' ')
    .split(/\s+/)
    .filter(w => w.length > 5);

  const uniqueWords = [...new Set(assessmentWords)];
  const commonConditions = uniqueWords.filter(word =>
    ['lombalgie', 'cervicalgie', 'subluxation', 'tension', 'sciatique'].some(k => word.includes(k))
  );

  if (commonConditions.length > 0) {
    suggestions.push({
      text: `Condition récurrente détectée: ${commonConditions[0]}`,
      confidence: 0.8,
      source: 'history',
      category: 'assessment'
    });
  }

  if (recentNote.visit_date) {
    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(recentNote.visit_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastVisit < 14) {
      suggestions.push({
        text: `Suivi ${daysSinceLastVisit} jours après dernière visite`,
        confidence: 0.9,
        source: 'history',
        category: 'subjective'
      });
    }
  }

  return suggestions;
}

export function getSmartSuggestions(
  field: 'subjective' | 'objective' | 'assessment' | 'plan',
  currentText: string,
  patternSuggestions: SmartSuggestion[]
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  const commonForField = COMMON_PHRASES[field];
  const matchingPhrases = commonForField.filter(phrase =>
    phrase.toLowerCase().includes(currentText.toLowerCase()) ||
    currentText.toLowerCase().includes(phrase.toLowerCase().substring(0, 5))
  );

  matchingPhrases.slice(0, 3).forEach(phrase => {
    suggestions.push({
      text: phrase,
      confidence: 0.7,
      source: 'common',
      category: field
    });
  });

  const relevantPatterns = patternSuggestions.filter(s => s.category === field);
  suggestions.push(...relevantPatterns);

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

export function findMatchingTemplate(text: string): SoapTemplate | null {
  const lowerText = text.toLowerCase();

  for (const template of CONDITIONS_TEMPLATES) {
    const matchCount = template.keywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    ).length;

    if (matchCount >= 2) {
      return template;
    }
  }

  return null;
}

export function autoFillTemplate(template: SoapTemplate, customizations: Record<string, string>) {
  const result = {
    subjective: template.subjective,
    objective: template.objective,
    assessment: template.assessment,
    plan: template.plan
  };

  Object.entries(customizations).forEach(([key, value]) => {
    Object.keys(result).forEach(field => {
      result[field as keyof typeof result] = result[field as keyof typeof result].replace(
        `[${key}]`,
        value
      );
    });
  });

  return result;
}

export async function trackTemplateUsage(templateId: string) {
  try {
    const { data: existing } = await supabase
      .from('template_usage')
      .select('*')
      .eq('template_id', templateId)
      .single();

    if (existing) {
      await supabase
        .from('template_usage')
        .update({ usage_count: existing.usage_count + 1 })
        .eq('template_id', templateId);
    } else {
      await supabase
        .from('template_usage')
        .insert({ template_id: templateId, usage_count: 1 });
    }
  } catch (error) {
  }
}
