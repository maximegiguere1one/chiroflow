export interface QuickTemplate {
  id: string;
  name: string;
  category: 'pediatric' | 'prenatal' | 'neurological' | 'musculoskeletal' | 'general';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpDays?: number;
}

export const soapTemplates: QuickTemplate[] = [
  {
    id: 'colique-bebe',
    name: 'Coliques - Bébé',
    category: 'pediatric',
    subjective: 'Parent rapporte que bébé pleure excessivement, surtout en soirée. Difficulté à s\'alimenter et à dormir. Selles irrégulières.',
    objective: 'Observation: bébé irritable. Palpation: tension au niveau cervical C1-C2, spasme musculaire paravertébral thoracique. ROM cervicale réduite de 30%. Réflexes normaux.',
    assessment: 'Dysfonction cervicale haute avec irritation du nerf vague. Tension thoracique contribuant aux symptômes digestifs.',
    plan: 'Ajustement doux C1-C2 avec technique Activator. Mobilisation thoracique T4-T6. Éducation parentale sur positionnement et alimentation. Retour dans 3-4 jours.',
    followUpDays: 4
  },
  {
    id: 'tdah-enfant',
    name: 'TDA/H - Enfant',
    category: 'neurological',
    subjective: 'Parent rapporte difficultés de concentration à l\'école, hyperactivité, impulsivité. Troubles du sommeil. Alimentation sélective.',
    objective: 'Examen neurologique: asymétrie posturale, hyperréflexie patellaire bilatérale. Palpation: tension sous-occipitale, restriction C1-C2. Tests vestibulaires: poursuite oculaire saccadée.',
    assessment: 'Dysfonction cervicale haute affectant l\'intégration sensorielle. Déséquilibre du système nerveux autonome.',
    plan: 'Ajustement cervical spécifique C1-C2. Exercices d\'intégration vestibulaire. Plan nutritionnel (oméga-3, magnésium). Programme Reconnexion à domicile. Réévaluation dans 2 semaines.',
    followUpDays: 14
  },
  {
    id: 'grossesse-lombalgie',
    name: 'Lombalgie de grossesse',
    category: 'prenatal',
    subjective: 'Patiente enceinte (trimestre: __). Douleur lombaire et sacro-iliaque augmentant en position debout prolongée. Difficulté à marcher, irradiation dans la fesse.',
    objective: 'Analyse posturale: antéversion pelvienne accentuée. Palpation: hypertonicité des érecteurs spinaux L4-S1, restriction sacro-iliaque droite. Test de Gaenslen positif à droite. ROM lombaire réduite de 40%.',
    assessment: 'Subluxation lombo-pelvienne secondaire aux changements biomécaniques de la grossesse. Instabilité sacro-iliaque.',
    plan: 'Ajustement pelvien technique Webster. Mobilisation lombaire douce. Taping kinésiologique pour support. Exercices de stabilisation. Coussin de positionnement. Retour dans 5-7 jours.',
    followUpDays: 6
  },
  {
    id: 'torticolis-bebe',
    name: 'Torticolis congénital',
    category: 'pediatric',
    subjective: 'Parent note que bébé tourne la tête toujours du même côté. Préférence posturale marquée. Difficulté à l\'allaitement d\'un côté.',
    objective: 'Observation: rotation cervicale préférentielle à gauche, inclinaison à droite. Palpation: tension SCM droit, restriction C1-C2. ROM cervicale: rotation droite 15°, gauche 60°. Asymétrie crânienne légère.',
    assessment: 'Torticolis musculaire congénital avec dysfonction cervicale C1-C2. Plagiocéphalie positionnelle débutante.',
    plan: 'Ajustement cervical pédiatrique doux. Relâchement myofascial SCM. Éducation parentale: exercices de stretching, positionnement optimal, tummy time. Retour dans 3 jours.',
    followUpDays: 3
  },
  {
    id: 'lombalgie-aigue',
    name: 'Lombalgie aiguë',
    category: 'musculoskeletal',
    subjective: 'Douleur lombaire aiguë depuis 2 jours suite à soulèvement d\'objet lourd. Douleur 8/10, irradiant dans fesse gauche. Difficulté à se pencher et se lever.',
    objective: 'Posture antalgique en flexion latérale droite. Palpation: spasme paravertébral L4-L5, point trigger iliocostal. ROM lombaire très limitée (flexion 20%, extension 10%). SLR négatif. Réflexes normaux.',
    assessment: 'Spasme musculaire aigu lombaire avec subluxation L4-L5. Strain ligamentaire probable.',
    plan: 'Ajustement lombaire doux L4-L5. Thérapie des tissus mous (trigger points). Glace 15 min/2h pendant 48h. Repos relatif. Exercices McKenzie dès amélioration. Retour dans 2-3 jours ou avant si aggravation.',
    followUpDays: 3
  },
  {
    id: 'cervicalgie-bureau',
    name: 'Cervicalgie - Travail de bureau',
    category: 'musculoskeletal',
    subjective: 'Douleur cervicale et céphalées de tension depuis plusieurs semaines. Travail prolongé à l\'ordinateur. Douleur augmente en fin de journée. Raideur matinale.',
    objective: 'Posture: antépulsion de tête, épaules enroulées. Palpation: tension trapèze supérieur bilatéral, restriction C5-C6. ROM cervicale: rotation 60° bilatérale (N: 80°). Tests orthopédiques négatifs.',
    assessment: 'Syndrome cervical postural avec dysfonction C5-C6. Tension myofasciale chronique du complexe cervico-scapulaire.',
    plan: 'Ajustement cervical C5-C6 et thoracique T1-T4. Relâchement myofascial trapèzes et élévateurs scapulae. Éducation ergonomique. Exercices de renforcement cervical profond. Protocole 3x/semaine pendant 2 semaines.',
    followUpDays: 3
  },
  {
    id: 'autisme-integration',
    name: 'Trouble du spectre autistique',
    category: 'neurological',
    subjective: 'Parent rapporte difficultés d\'intégration sensorielle, hypersensibilité aux sons et textures. Anxiété sociale. Stéréotypies motrices. Problèmes de sommeil.',
    objective: 'Examen: hyper-réactivité au toucher léger, évitement du contact visuel. Palpation: tension cervicale C1-C2, restriction thoracique. Tests sensoriels: réponses atypiques aux stimuli vestibulaires et proprioceptifs.',
    assessment: 'Dysfonction du traitement sensoriel avec composante vertébrale cervicale haute. Déséquilibre autonomique.',
    plan: 'Ajustements cervicaux spécifiques C1-C2 avec approche douce. Protocole d\'intégration sensorielle adapté. Programme Reconnexion à domicile. Collaboration avec ergothérapeute. Suivi aux 2 semaines.',
    followUpDays: 14
  }
];

export const treatmentProtocols = [
  {
    id: 'protocol-colique',
    name: 'Protocole Coliques (0-4 mois)',
    visits: 6,
    frequency: '3x première semaine, puis 2x semaine 2, puis 1x semaine 3',
    techniques: [
      'Ajustement C1-C2 (Activator ou doigt)',
      'Mobilisation thoracique douce',
      'Relâchement diaphragme',
      'Stimulation nerf vague'
    ],
    homeExercises: [
      'Positionnement optimal pour allaitement',
      'Massage abdominal (sens horaire)',
      'Tummy time 3x/jour',
      'Éviter sur-stimulation'
    ],
    expectedOutcome: 'Réduction 70-80% des symptômes en 2-3 semaines',
    nutritionalAdvice: 'Évaluer alimentation mère si allaitement, éviter produits laitiers/caféine'
  },
  {
    id: 'protocol-tdah',
    name: 'Protocole TDA/H (Intensive)',
    visits: 12,
    frequency: '2x/semaine pendant 6 semaines',
    techniques: [
      'Ajustement cervical spécifique C1-C2',
      'Travail vestibulaire',
      'Exercices oculomoteurs',
      'Équilibration hémisphérique'
    ],
    homeExercises: [
      'Programme Reconnexion quotidien',
      'Exercices d\'intégration primitive reflexes',
      'Balance board 5-10 min/jour',
      'Exercices de coordination croisée'
    ],
    expectedOutcome: 'Amélioration concentration et comportement en 4-8 semaines',
    nutritionalAdvice: 'Oméga-3 (DHA/EPA), magnésium, éliminer colorants artificiels, réduire sucres'
  },
  {
    id: 'protocol-grossesse',
    name: 'Protocole Suivi Grossesse',
    visits: 12,
    frequency: '1x/mois T1, 2x/mois T2, 1x/semaine T3',
    techniques: [
      'Technique Webster (équilibre pelvien)',
      'Ajustement lombaire et sacro-iliaque',
      'Mobilisation costale',
      'Relâchement ligaments utérins'
    ],
    homeExercises: [
      'Étirements psoas et piriformis',
      'Exercices de stabilisation pelvienne',
      'Positionnement optimal (sleeping, sitting)',
      'Exercices de respiration diaphragmatique'
    ],
    expectedOutcome: 'Grossesse plus confortable, travail plus court, moins d\'interventions',
    nutritionalAdvice: 'Calcium, magnésium, vitamine D, hydratation optimale'
  }
];

export const quickNotes = {
  commonFindings: [
    'ROM cervicale réduite',
    'Spasme musculaire paravertébral',
    'Restriction articulaire',
    'Tension trapèze supérieur',
    'Antépulsion de tête',
    'Point trigger actif',
    'Asymétrie posturale',
    'Hyperlordose lombaire'
  ],
  commonTreatments: [
    'Ajustement diversifié',
    'Thérapie des tissus mous',
    'Mobilisation articulaire',
    'Relâchement myofascial',
    'Taping kinésiologique',
    'Ultrasons thérapeutiques',
    'TENS',
    'Application glace/chaleur'
  ],
  commonRecommendations: [
    'Glace 15 min/2h x 48h',
    'Éviter mouvements brusques',
    'Maintenir activité modérée',
    'Exercices à domicile quotidiens',
    'Ergonomie poste de travail',
    'Hydratation 2L/jour',
    'Repos si douleur aiguë',
    'Retour si aggravation'
  ]
};
