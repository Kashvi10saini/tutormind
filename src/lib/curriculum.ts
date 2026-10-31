export type QuestionType = 'mcq' | 'short' | 'long';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type Question = {
  id: string;
  concept_id: string;
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  options?: string[];
  answer: string;
  hints: string[];
  explanation: string;
  // rubric keywords the misconception engine looks for when judging long/short answers
  rubricKeywords: string[];
  // keywords whose presence in a long/short answer signals a misconception
  misconceptionTraps: { trap: string; message: string }[];
};

export type Concept = {
  id: string;
  name: string;
  description: string;
  subject: string;
  // ids of concepts that should be understood first
  prerequisites: string[];
};

export type Subject = {
  id: string;
  name: string;
  icon: string;
  color: string;
  blurb: string;
  concepts: Concept[];
};

export const SUBJECTS: Subject[] = [
  {
    id: 'physics',
    name: 'Physics',
    icon: 'Atom',
    color: 'from-brand-500 to-accent-500',
    blurb: 'Motion, energy, fields, and the rules that govern the universe.',
    concepts: [
      { id: 'kinematics', name: 'Kinematics', subject: 'physics', description: 'Describing motion: displacement, velocity, acceleration.', prerequisites: [] },
      { id: 'newton-laws', name: "Newton's Laws", subject: 'physics', description: 'How forces change motion.', prerequisites: ['kinematics'] },
      { id: 'energy-work', name: 'Work & Energy', subject: 'physics', description: 'Energy transfer and conservation.', prerequisites: ['kinematics', 'newton-laws'] },
      { id: 'momentum', name: 'Momentum', subject: 'physics', description: 'Conservation of momentum in collisions.', prerequisites: ['newton-laws'] },
      { id: 'circular-motion', name: 'Circular Motion', subject: 'physics', description: 'Centripetal force and circular paths.', prerequisites: ['kinematics', 'newton-laws'] },
      { id: 'gravitation', name: 'Gravitation', subject: 'physics', description: "Newton's law of universal gravitation.", prerequisites: ['circular-motion'] },
      { id: 'electric-fields', name: 'Electric Fields', subject: 'physics', description: 'Forces between charges and field strength.', prerequisites: ['newton-laws'] },
      { id: 'circuits', name: "DC Circuits", subject: 'physics', description: 'Ohm\u2019s law, resistance, series and parallel.', prerequisites: ['electric-fields'] },
      { id: 'waves', name: 'Wave Motion', subject: 'physics', description: 'Frequency, wavelength, superposition.', prerequisites: ['kinematics'] },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'FlaskConical',
    color: 'from-emerald-500 to-brand-500',
    blurb: 'Atoms, bonds, reactions, and the matter that makes everything.',
    concepts: [
      { id: 'atomic-structure', name: 'Atomic Structure', subject: 'chemistry', description: 'Protons, neutrons, electrons, isotopes.', prerequisites: [] },
      { id: 'periodic-table', name: 'Periodic Trends', subject: 'chemistry', description: 'Organising elements and predicting properties.', prerequisites: ['atomic-structure'] },
      { id: 'bonding', name: 'Chemical Bonding', subject: 'chemistry', description: 'Ionic, covalent, and metallic bonds.', prerequisites: ['atomic-structure', 'periodic-table'] },
      { id: 'moles', name: 'The Mole', subject: 'chemistry', description: 'Avogadro\u2019s number and stoichiometry.', prerequisites: ['atomic-structure'] },
      { id: 'reactions', name: 'Reaction Types', subject: 'chemistry', description: 'Synthesis, decomposition, redox.', prerequisites: ['bonding', 'moles'] },
      { id: 'acids-bases', name: 'Acids & Bases', subject: 'chemistry', description: 'pH, neutralisation, titration.', prerequisites: ['reactions'] },
      { id: 'kinetics', name: 'Reaction Kinetics', subject: 'chemistry', description: 'Rates of reaction and catalysts.', prerequisites: ['reactions'] },
      { id: 'equilibrium', name: 'Equilibrium', subject: 'chemistry', description: 'Le Chatelier\u2019s principle.', prerequisites: ['kinetics'] },
    ],
  },
  {
    id: 'maths',
    name: 'Mathematics',
    icon: 'Sigma',
    color: 'from-accent-500 to-brand-500',
    blurb: 'Algebra, calculus, and the language of patterns.',
    concepts: [
      { id: 'algebra', name: 'Algebra Basics', subject: 'maths', description: 'Variables, equations, and rearranging.', prerequisites: [] },
      { id: 'functions', name: 'Functions', subject: 'maths', description: 'Domain, range, composition, inverses.', prerequisites: ['algebra'] },
      { id: 'trigonometry', name: 'Trigonometry', subject: 'maths', description: 'Sine, cosine, and the unit circle.', prerequisites: ['functions'] },
      { id: 'differentiation', name: 'Differentiation', subject: 'maths', description: 'Rates of change and gradients.', prerequisites: ['functions'] },
      { id: 'integration', name: 'Integration', subject: 'maths', description: 'Antiderivatives and area under curves.', prerequisites: ['differentiation'] },
      { id: 'vectors', name: 'Vectors', subject: 'maths', description: 'Magnitude, direction, dot and cross products.', prerequisites: ['trigonometry'] },
      { id: 'probability', name: 'Probability', subject: 'maths', description: 'Sample spaces, conditional probability.', prerequisites: ['algebra'] },
      { id: 'statistics', name: 'Statistics', subject: 'maths', description: 'Mean, variance, distributions.', prerequisites: ['probability'] },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'Dna',
    color: 'from-teal-500 to-accent-500',
    blurb: 'Cells, genes, evolution, and living systems.',
    concepts: [
      { id: 'cell-structure', name: 'Cell Structure', subject: 'biology', description: 'Organelles and prokaryote vs eukaryote.', prerequisites: [] },
      { id: 'cell-transport', name: 'Cell Transport', subject: 'biology', description: 'Diffusion, osmosis, active transport.', prerequisites: ['cell-structure'] },
      { id: 'respiration', name: 'Respiration', subject: 'biology', description: 'ATP, glycolysis, the Krebs cycle.', prerequisites: ['cell-structure'] },
      { id: 'photosynthesis', name: 'Photosynthesis', subject: 'biology', description: 'Light-dependent and Calvin cycle.', prerequisites: ['cell-structure'] },
      { id: 'genetics', name: 'Genetics', subject: 'biology', description: 'Mendel\u2019s laws and inheritance.', prerequisites: ['cell-structure'] },
      { id: 'dna-protein', name: 'DNA & Protein Synthesis', subject: 'biology', description: 'Transcription and translation.', prerequisites: ['genetics'] },
      { id: 'evolution', name: 'Evolution', subject: 'biology', description: 'Natural selection and speciation.', prerequisites: ['genetics'] },
      { id: 'ecology', name: 'Ecology', subject: 'biology', description: 'Ecosystems, energy flow, niches.', prerequisites: ['evolution'] },
    ],
  },
];

export const SUBJECT_MAP: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
);

export function getConcept(subjectId: string, conceptId: string): Concept | undefined {
  return SUBJECT_MAP[subjectId]?.concepts.find((c) => c.id === conceptId);
}

export const QUESTION_BANK: Question[] = [
  // PHYSICS — kinematics
  {
    id: 'phy-kin-1', concept_id: 'kinematics', type: 'mcq', difficulty: 'easy',
    prompt: 'A car travels 100 m north in 5 s at constant velocity. What is its speed?',
    options: ['10 m/s', '20 m/s', '50 m/s', '500 m/s'],
    answer: '20 m/s',
    hints: ['Speed = distance \u00f7 time.', 'The direction (north) does not affect speed, only velocity.'],
    explanation: 'Speed = 100 m / 5 s = 20 m/s. Direction is irrelevant for speed.',
    rubricKeywords: ['100', '5', '20', 'distance', 'time'],
    misconceptionTraps: [{ trap: 'north', message: 'You mentioned direction \u2014 that belongs to velocity, not speed. Speed is a scalar.' }],
  },
  {
    id: 'phy-kin-2', concept_id: 'kinematics', type: 'mcq', difficulty: 'medium',
    prompt: 'An object slows from 30 m/s to 0 m/s in 6 s. What is its acceleration?',
    options: ['+5 m/s\u00b2', '\u22125 m/s\u00b2', '+180 m/s\u00b2', '0 m/s\u00b2'],
    answer: '\u22125 m/s\u00b2',
    hints: ['Acceleration = (final velocity \u2212 initial velocity) / time.', 'Slowing down means the sign is opposite to the motion.'],
    explanation: 'a = (0 \u2212 30)/6 = \u22125 m/s\u00b2. The negative sign means it decelerates.',
    rubricKeywords: ['change', 'velocity', 'time', '-5', 'negative', 'decelerat'],
    misconceptionTraps: [{ trap: 'positive', message: 'You treated deceleration as positive \u2014 acceleration has a sign. Slowing down against motion is negative.' }],
  },
  {
    id: 'phy-kin-3', concept_id: 'kinematics', type: 'long', difficulty: 'medium',
    prompt: 'A ball is dropped from rest and falls for 3 s. Explain how you would find how far it falls (take g = 10 m/s\u00b2).',
    answer: 's = \u00bdgt\u00b2 = \u00bd \u00d7 10 \u00d7 9 = 45 m',
    hints: ['Use s = ut + \u00bdat\u00b2 with u = 0.', 'a = g = 10 m/s\u00b2.'],
    explanation: 'With u = 0 and a = g = 10 m/s\u00b2, s = \u00bd \u00d7 10 \u00d7 3\u00b2 = 45 m.',
    rubricKeywords: ['s =', 'half', '10', '9', '45', 'at squared', 'gt squared'],
    misconceptionTraps: [
      { trap: '30', message: 'You seem to have used s = g\u00d7t = 30. That ignores the \u00bd and t\u00b2 \u2014 distance under constant acceleration is \u00bdat\u00b2, not at.' },
      { trap: 'final velocity times time', message: 'You multiplied a final velocity by time \u2014 but the ball starts from rest, so average velocity is not the final velocity.' },
    ],
  },
  // PHYSICS — newton-laws
  {
    id: 'phy-nlw-1', concept_id: 'newton-laws', type: 'mcq', difficulty: 'easy',
    prompt: "A 2 kg block has a net force of 8 N acting on it. What is its acceleration?",
    options: ['2 m/s\u00b2', '4 m/s\u00b2', '6 m/s\u00b2', '16 m/s\u00b2'],
    answer: '4 m/s\u00b2',
    hints: ['F = ma, so a = F/m.', 'Divide force by mass.'],
    explanation: 'a = F/m = 8/2 = 4 m/s\u00b2.',
    rubricKeywords: ['8', '2', '4', 'F=ma', 'force', 'mass'],
    misconceptionTraps: [],
  },
  {
    id: 'phy-nlw-2', concept_id: 'newton-laws', type: 'long', difficulty: 'medium',
    prompt: 'A book sits still on a table. Describe all the forces on the book and why it does not move.',
    answer: 'Gravity pulls the book down; the table pushes up with an equal normal force. Net force is zero, so by Newton\u2019s first law the book stays at rest.',
    hints: ['Two forces act: weight (down) and the normal force (up).', 'Newton\u2019s first law says no net force \u2192 no acceleration.'],
    explanation: 'Weight and normal force are equal and opposite, so \u03a3F = 0. By Newton\u2019s first law, the book remains at rest.',
    rubricKeywords: ['weight', 'gravity', 'normal', 'down', 'up', 'equal', 'opposite', 'zero', 'net force', 'first law', 'rest'],
    misconceptionTraps: [
      { trap: 'no forces', message: 'You said no forces act \u2014 but gravity always pulls the book down. The table balances it with a normal force.' },
      { trap: 'mass cancels', message: 'You said the mass cancels \u2014 that conflates free-fall with a resting object. Here the normal force equals the weight, it is not about cancelling mass.' },
    ],
  },
  // PHYSICS — energy-work
  {
    id: 'phy-ew-1', concept_id: 'energy-work', type: 'short', difficulty: 'easy',
    prompt: 'A 1 kg ball is lifted 5 m. How much gravitational potential energy does it gain? (g = 10 m/s\u00b2)',
    answer: '50 J',
    hints: ['PE = mgh.', 'm = 1, g = 10, h = 5.'],
    explanation: 'PE = mgh = 1 \u00d7 10 \u00d7 5 = 50 J.',
    rubricKeywords: ['mgh', '1', '10', '5', '50', 'joules'],
    misconceptionTraps: [{ trap: '5 j', message: 'You wrote 5 J \u2014 you may have used PE = mg only and dropped the height. PE = mgh, the height matters.' }],
  },
  {
    id: 'phy-ew-2', concept_id: 'energy-work', type: 'mcq', difficulty: 'medium',
    prompt: 'A 2 kg toy car moving at 3 m/s has what kinetic energy?',
    options: ['3 J', '6 J', '9 J', '12 J'],
    answer: '9 J',
    hints: ['KE = \u00bdmv\u00b2.', 'm = 2, v = 3.'],
    explanation: 'KE = \u00bd \u00d7 2 \u00d7 3\u00b2 = \u00bd \u00d7 2 \u00d7 9 = 9 J.',
    rubricKeywords: ['half', 'mv squared', '2', '3', '9'],
    misconceptionTraps: [{ trap: 'mv', message: 'You used KE = mv (giving 6) \u2014 kinetic energy is \u00bdmv\u00b2, not mv. The square and the half both matter.' }],
  },
  // PHYSICS — momentum
  {
    id: 'phy-mom-1', concept_id: 'momentum', type: 'mcq', difficulty: 'easy',
    prompt: 'A 0.5 kg ball moving at 4 m/s has what momentum?',
    options: ['0.5 kg\u00b7m/s', '2 kg\u00b7m/s', '4 kg\u00b7m/s', '8 kg\u00b7m/s'],
    answer: '2 kg\u00b7m/s',
    hints: ['p = mv.'],
    explanation: 'p = mv = 0.5 \u00d7 4 = 2 kg\u00b7m/s.',
    rubricKeywords: ['mv', '0.5', '4', '2'],
    misconceptionTraps: [],
  },
  {
    id: 'phy-mom-2', concept_id: 'momentum', type: 'long', difficulty: 'hard',
    prompt: 'Two identical carts collide and stick together. One was moving at 6 m/s, the at rest. Explain how momentum conservation gives the final speed.',
    answer: 'Total momentum before = m\u00d76 + m\u00d70 = 6m. After: 2m\u00d7v. So 2mv = 6m \u2192 v = 3 m/s.',
    hints: ['Momentum is conserved: p_before = p_after.', 'After sticking, the combined mass is 2m.'],
    explanation: 'Before: m\u00d76 = 6m. After: 2m\u00d7v. Set equal: v = 3 m/s.',
    rubricKeywords: ['conserve', 'before', 'after', '6m', '2m', '3', 'combined mass', 'equal'],
    misconceptionTraps: [
      { trap: 'average of speeds', message: 'You averaged the speeds to get 3 by luck \u2014 but the reasoning is wrong. Momentum conservation gives m\u00b7v1 = 2m\u00b7v_f, which happens to equal 3 here. Always start from momentum, not speed-averaging.' },
      { trap: 'energy conserved', message: 'You assumed kinetic energy is conserved \u2014 in an inelastic (sticking) collision, KE is NOT conserved even though momentum is.' },
    ],
  },
  // PHYSICS — circuits
  {
    id: 'phy-cir-1', concept_id: 'circuits', type: 'mcq', difficulty: 'easy',
    prompt: 'A 6 V battery drives 2 A through a resistor. What is its resistance?',
    options: ['3 \u03a9', '6 \u03a9', '12 \u03a9', '0.33 \u03a9'],
    answer: '3 \u03a9',
    hints: ['Ohm\u2019s law: V = IR, so R = V/I.'],
    explanation: 'R = V/I = 6/2 = 3 \u03a9.',
    rubricKeywords: ['V=IR', '6', '2', '3', 'ohm'],
    misconceptionTraps: [],
  },
  {
    id: 'phy-cir-2', concept_id: 'circuits', type: 'long', difficulty: 'medium',
    prompt: 'Two identical 6 \u03a9 resistors are connected in parallel across a battery. Explain how to find the total resistance.',
    answer: '1/R = 1/6 + 1/6 = 2/6, so R = 3 \u03a9. For two equal resistors in parallel, R = R\u2081/2.',
    hints: ['For parallel: 1/R = 1/R\u2081 + 1/R\u2082.', 'Both resistors are 6 \u03a9.'],
    explanation: '1/R = 1/6 + 1/6 = 2/6 \u2192 R = 3 \u03a9.',
    rubricKeywords: ['parallel', 'reciprocal', '1/6', '2/6', '3', 'ohm'],
    misconceptionTraps: [
      { trap: 'add them', message: 'You added 6 + 6 = 12 \u2014 that rule is for series, not parallel. In parallel, reciprocals add.' },
      { trap: '12', message: '12 \u03a9 is the series answer. In parallel the total is always smaller than the smallest resistor.' },
    ],
  },
  // PHYSICS — waves
  {
    id: 'phy-wav-1', concept_id: 'waves', type: 'mcq', difficulty: 'easy',
    prompt: 'A wave has frequency 5 Hz and wavelength 4 m. What is its speed?',
    options: ['0.8 m/s', '9 m/s', '20 m/s', '1.25 m/s'],
    answer: '20 m/s',
    hints: ['v = f\u00d7\u03bb.'],
    explanation: 'v = f\u00d7\u03bb = 5 \u00d7 4 = 20 m/s.',
    rubricKeywords: ['f times lambda', '5', '4', '20', 'wave speed'],
    misconceptionTraps: [],
  },
  {
    id: 'phy-wav-2', concept_id: 'waves', type: 'short', difficulty: 'medium',
    prompt: 'Two waves of the same frequency meet crest-to-crest. What is this called and what happens to the amplitude?',
    answer: 'Constructive interference; the amplitudes add together, giving a larger wave.',
    hints: ['Crest + crest means they are in phase.', 'The amplitudes combine.'],
    explanation: 'When crests align, amplitudes add \u2014 constructive interference.',
    rubricKeywords: ['constructive', 'interference', 'add', 'amplitude', 'larger', 'in phase', 'crest'],
    misconceptionTraps: [
      { trap: 'destructive', message: 'You said destructive interference \u2014 but crest meeting crest is constructive (in phase). Destructive needs crest meeting trough.' },
      { trap: 'cancel', message: 'You said they cancel \u2014 cancellation is destructive interference. Aligned crests reinforce, not cancel.' },
    ],
  },

  // CHEMISTRY — atomic-structure
  {
    id: 'chem-atom-1', concept_id: 'atomic-structure', type: 'mcq', difficulty: 'easy',
    prompt: 'An atom has 11 protons and 12 neutrons. What is its mass number?',
    options: ['11', '12', '23', '1'],
    answer: '23',
    hints: ['Mass number = protons + neutrons.'],
    explanation: 'Mass number = 11 + 12 = 23.',
    rubricKeywords: ['protons', 'neutrons', '11', '12', '23', 'add'],
    misconceptionTraps: [],
  },
  {
    id: 'chem-atom-2', concept_id: 'atomic-structure', type: 'short', difficulty: 'medium',
    prompt: 'Define an isotope and give one example.',
    answer: 'Isotopes are atoms of the same element (same protons) with different numbers of neutrons, e.g. C-12 and C-14.',
    hints: ['Same element, different neutron count.'],
    explanation: 'Isotopes share proton number but differ in neutrons: e.g. 12C and 14C.',
    rubricKeywords: ['same', 'protons', 'different', 'neutrons', 'carbon', 'c-12', 'c-14', 'example'],
    misconceptionTraps: [
      { trap: 'different protons', message: 'You said isotopes differ in protons \u2014 that would make them different elements. Isotopes have the same proton number.' },
      { trap: 'ions', message: 'You confused isotopes with ions \u2014 ions differ in electron count, not neutron count.' },
    ],
  },
  // CHEMISTRY — bonding
  {
    id: 'chem-bond-1', concept_id: 'bonding', type: 'mcq', difficulty: 'easy',
    prompt: 'Which bond forms when electrons are shared between two non-metals?',
    options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'],
    answer: 'Covalent',
    hints: ['Sharing = covalent.', 'Transferring = ionic.'],
    explanation: 'Covalent bonds form by sharing electron pairs, typically between non-metals.',
    rubricKeywords: ['share', 'covalent', 'non-metal'],
    misconceptionTraps: [],
  },
  {
    id: 'chem-bond-2', concept_id: 'bonding', type: 'long', difficulty: 'medium',
    prompt: 'Explain why sodium chloride conducts electricity when molten but not when solid.',
    answer: 'In solid NaCl, ions are fixed in a lattice and cannot move. When molten, ions are free to move and carry charge, so it conducts.',
    hints: ['Conduction needs moving charges.', 'What is different about the solid vs the liquid?'],
    explanation: 'Solid NaCl ions are locked in the lattice; molten ions are mobile and carry current.',
    rubricKeywords: ['lattice', 'fixed', 'free', 'move', 'ions', 'molten', 'charge', 'conduct'],
    misconceptionTraps: [
      { trap: 'electrons', message: 'You mentioned electrons carrying the current \u2014 in NaCl it is the ions (Na\u207a and Cl\u207b) that move, not free electrons. Free electrons are a metallic-bonding idea.' },
      { trap: 'dissolve', message: 'You linked conduction to dissolving \u2014 molten NaCl has no water. It conducts because the ions are mobile, not because of dissolution.' },
    ],
  },
  // CHEMISTRY — moles
  {
    id: 'chem-mol-1', concept_id: 'moles', type: 'short', difficulty: 'easy',
    prompt: 'How many particles are in 2 moles of a substance? (Avogadro = 6\u00d710\u00b2\u00b3)',
    answer: '1.2 \u00d7 10\u00b2\u2074 particles',
    hints: ['Particles = moles \u00d7 Avogadro\u2019s number.'],
    explanation: '2 \u00d7 6\u00d710\u00b2\u00b3 = 1.2\u00d710\u00b2\u2074.',
    rubricKeywords: ['2', 'avogadro', '6', '1.2', '10^24', 'multiply'],
    misconceptionTraps: [],
  },
  // CHEMISTRY — acids-bases
  {
    id: 'chem-ab-1', concept_id: 'acids-bases', type: 'mcq', difficulty: 'easy',
    prompt: 'A solution has pH 3. It is:',
    options: ['Strongly acidic', 'Neutral', 'Weakly basic', 'Strongly basic'],
    answer: 'Strongly acidic',
    hints: ['pH < 7 = acidic; lower = stronger.'],
    explanation: 'pH 3 is well below 7, so strongly acidic.',
    rubricKeywords: ['acidic', 'below 7', 'low', 'strong'],
    misconceptionTraps: [],
  },
  {
    id: 'chem-ab-2', concept_id: 'acids-bases', type: 'long', difficulty: 'medium',
    prompt: 'Explain what happens to the pH of a strong acid when it is diluted 10-fold with water.',
    answer: 'The H\u207a concentration drops to one tenth, so the pH rises by about 1 (e.g. pH 2 \u2192 pH 3). It does not become basic.',
    hints: ['pH = \u2212log[H\u207a]. Diluting 10-fold changes [H\u207a] by 10.'],
    explanation: '10-fold dilution reduces [H\u207a] tenfold, raising pH by 1. Still acidic, never basic.',
    rubricKeywords: ['log', 'concentration', 'dilute', 'tenth', 'ph rises', 'increases by 1', 'still acid'],
    misconceptionTraps: [
      { trap: 'becomes base', message: 'You said it becomes basic \u2014 diluting an acid never flips it past pH 7. The pH rises but approaches 7 asymptotically.' },
      { trap: 'ph doubles', message: 'You said the pH doubles \u2014 pH is logarithmic. A 10-fold dilution raises pH by 1, not doubles it.' },
    ],
  },

  // MATHS — algebra
  {
    id: 'math-alg-1', concept_id: 'algebra', type: 'mcq', difficulty: 'easy',
    prompt: 'Solve 2x + 6 = 14 for x.',
    options: ['x = 2', 'x = 4', 'x = 6', 'x = 8'],
    answer: 'x = 4',
    hints: ['Subtract 6 from both sides, then divide by 2.'],
    explanation: '2x = 8, x = 4.',
    rubricKeywords: ['2x', '6', '14', '8', '4'],
    misconceptionTraps: [],
  },
  {
    id: 'math-alg-2', concept_id: 'algebra', type: 'long', difficulty: 'medium',
    prompt: 'A number is tripled, then 4 is subtracted, giving 11. Set up an equation and solve for the number.',
    answer: 'Let the number be n. 3n \u2212 4 = 11 \u2192 3n = 15 \u2192 n = 5.',
    hints: ['Let the unknown be n.', 'Tripled: 3n. Subtract 4. Set equal to 11.'],
    explanation: '3n \u2212 4 = 11 \u2192 3n = 15 \u2192 n = 5.',
    rubricKeywords: ['let', 'n', '3n', 'subtract', '4', '11', '15', '5', 'equation'],
    misconceptionTraps: [
      { trap: '4 + 11', message: 'You added 4 and 11 to get 15 then divided by 3 \u2014 accidentally right number but wrong algebra. The step is 3n = 11 + 4, written as moving the constant.' },
      { trap: 'divide first', message: 'You divided before isolating the 3n term \u2014 you must move the constant (\u22124) before dividing by the coefficient.' },
    ],
  },
  // MATHS — differentiation
  {
    id: 'math-diff-1', concept_id: 'differentiation', type: 'mcq', difficulty: 'easy',
    prompt: 'What is d/dx of x\u00b3?',
    options: ['3x\u00b2', 'x\u00b2/3', '3x', 'x\u2074/4'],
    answer: '3x\u00b2',
    hints: ['Power rule: multiply by the power and reduce it by 1.'],
    explanation: 'd/dx x\u207f = n\u00b7x\u207f\u207b\u00b9, so x\u00b3 \u2192 3x\u00b2.',
    rubricKeywords: ['power rule', '3', 'x squared', 'reduce', 'power'],
    misconceptionTraps: [],
  },
  {
    id: 'math-diff-2', concept_id: 'differentiation', type: 'long', difficulty: 'hard',
    prompt: 'A ball\u2019s height is h(t) = \u22125t\u00b2 + 20t. Explain how differentiation tells you the maximum height and when it occurs.',
    answer: 'dh/dt = \u221210t + 20. Set = 0: t = 2 s. Then h(2) = \u22125(4) + 40 = 20 m, the maximum.',
    hints: ['Maximum is where dh/dt = 0 (gradient is flat).', 'Sub that t back into h(t).'],
    explanation: 'Solve \u221210t + 20 = 0 \u2192 t = 2 s; h(2) = 20 m.',
    rubricKeywords: ['derivative', 'dh/dt', '-10t', '20', 'set zero', 't=2', 'h(2)', '20', 'maximum', 'gradient'],
    misconceptionTraps: [
      { trap: 'second derivative', message: 'You jumped to the second derivative \u2014 finding the maximum needs dh/dt = 0 first, then test the sign change.' },
      { trap: 'average', message: 'You averaged the coefficients \u2014 the maximum time comes from dh/dt = 0, not from averaging. t = \u2212b/2a for at\u00b2 + bt + c.' },
    ],
  },
  // MATHS — integration
  {
    id: 'math-int-1', concept_id: 'integration', type: 'short', difficulty: 'medium',
    prompt: 'Evaluate \u222b 2x dx and state what the constant of integration represents.',
    answer: 'x\u00b2 + C, where C is an arbitrary constant reflecting all antiderivatives.',
    hints: ['Reverse the power rule.', 'Don\u2019t forget + C.'],
    explanation: '\u222b 2x dx = x\u00b2 + C.',
    rubricKeywords: ['x squared', 'antiderivative', '+ c', 'constant', 'reverse', 'power rule'],
    misconceptionTraps: [{ trap: 'no constant', message: 'You forgot + C \u2014 indefinite integrals always include an arbitrary constant because differentiation loses it.' }],
  },

  // MATHS — probability
  {
    id: 'math-prob-1', concept_id: 'probability', type: 'mcq', difficulty: 'easy',
    prompt: 'A fair six-sided die is rolled. What is the probability of rolling an even number?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    answer: '1/2',
    hints: ['Even numbers are 2, 4, 6 \u2014 three out of six.'],
    explanation: '3 even outcomes / 6 total = 1/2.',
    rubricKeywords: ['even', '2,4,6', 'three', 'six', 'half', '1/2'],
    misconceptionTraps: [],
  },
  {
    id: 'math-prob-2', concept_id: 'probability', type: 'long', difficulty: 'medium',
    prompt: 'Explain the difference between independent and mutually exclusive events, with one example of each.',
    answer: 'Independent: the outcome of one does not affect the other (e.g. two coin tosses). Mutually exclusive: they cannot both happen (e.g. rolling a 1 and a 6 on one die).',
    hints: ['Independent = no influence on probability.', 'Mutually exclusive = cannot co-occur.'],
    explanation: 'Independent events keep probabilities; mutually exclusive events have P(A and B) = 0.',
    rubricKeywords: ['independent', 'no effect', 'mutually exclusive', 'cannot both', 'coin', 'die', 'example'],
    misconceptionTraps: [
      { trap: 'same thing', message: 'You treated them as the same \u2014 independent events can both occur (coins can both be heads), mutually exclusive ones cannot. They are opposites in that sense.' },
      { trap: 'disjoint means independent', message: 'You said mutually exclusive implies independent \u2014 actually mutually exclusive events are dependent (if one happens, the other cannot).' },
    ],
  },

  // BIOLOGY — cell-structure
  {
    id: 'bio-cell-1', concept_id: 'cell-structure', type: 'mcq', difficulty: 'easy',
    prompt: 'Which organelle is the site of photosynthesis?',
    options: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Ribosome'],
    answer: 'Chloroplast',
    hints: ['Green pigment, plant cells.'],
    explanation: 'Chloroplasts contain chlorophyll and are where photosynthesis happens.',
    rubricKeywords: ['chloroplast', 'photosynthesis', 'chlorophyll', 'plant'],
    misconceptionTraps: [],
  },
  {
    id: 'bio-cell-2', concept_id: 'cell-structure', type: 'short', difficulty: 'medium',
    prompt: 'Name two features present in eukaryotic cells but absent from prokaryotic cells.',
    answer: 'A true nucleus and membrane-bound organelles (e.g. mitochondria).',
    hints: ['Prokaryotes have no nucleus.', 'What else is missing in bacteria?'],
    explanation: 'Eukaryotes have a membrane-bound nucleus and organelles like mitochondria; prokaryotes lack both.',
    rubricKeywords: ['nucleus', 'membrane-bound', 'organelles', 'mitochondria', 'absent', 'prokaryote'],
    misconceptionTraps: [
      { trap: 'cell wall', message: 'You listed the cell wall \u2014 but many prokaryotes (bacteria) also have a cell wall. It is not a eukaryote-only feature.' },
      { trap: 'dna', message: 'You said DNA \u2014 both cell types have DNA; the difference is that eukaryotes wrap it in a nucleus.' },
    ],
  },
  // BIOLOGY — genetics
  {
    id: 'bio-gen-1', concept_id: 'genetics', type: 'mcq', difficulty: 'easy',
    prompt: 'In a monohybrid cross of two heterozygous tall plants (Tt \u00d7 Tt), what fraction is short (tt)?',
    options: ['1/4', '1/2', '3/4', '1/3'],
    answer: '1/4',
    hints: ['Punnett square gives TT, Tt, Tt, tt.'],
    explanation: 'Only 1 of 4 is tt, so 1/4 are short.',
    rubricKeywords: ['punnett', 'tt', 'one quarter', '1/4', 'recessive', 'homozygous'],
    misconceptionTraps: [],
  },
  {
    id: 'bio-gen-2', concept_id: 'genetics', type: 'long', difficulty: 'medium',
    prompt: 'Explain Mendel\u2019s law of segregation in your own words and say when it happens during meiosis.',
    answer: 'The two alleles of a gene separate during gamete formation so each gamete gets only one allele. This happens as homologous chromosomes separate in anaphase I of meiosis.',
    hints: ['Alleles separate into different gametes.', 'Which stage of meiosis moves homologues apart?'],
    explanation: 'Segregation = alleles separate into different gametes; occurs in anaphase I.',
    rubricKeywords: ['alleles', 'separate', 'gamete', 'one allele', 'anaphase i', 'meiosis', 'homologous'],
    misconceptionTraps: [
      { trap: 'anaphase ii', message: 'You said anaphase II \u2014 but anaphase II separates sister chromatids. Alleles (on homologous chromosomes) separate in anaphase I.' },
      { trap: 'both alleles', message: 'You said gametes receive both alleles \u2014 that is the opposite of segregation. Each gamete gets only one allele of each gene.' },
    ],
  },
];

export function questionsForConcept(conceptId: string): Question[] {
  return QUESTION_BANK.filter((q) => q.concept_id === conceptId);
}

export function questionsForSubject(subjectId: string): Question[] {
  const conceptIds = new Set(SUBJECT_MAP[subjectId]?.concepts.map((c) => c.id) ?? []);
  return QUESTION_BANK.filter((q) => conceptIds.has(q.concept_id));
}
