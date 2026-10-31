import { getConcept, type Question, type Concept } from './curriculum';

export type TutorReply = {
  text: string;
  // whether the tutor detected a misconception in the student message
  misconception?: string;
  // a follow-up probe the tutor wants the student to answer
  probe?: string;
  // suggested concept to focus on
  conceptId?: string;
};

const ENCOURAGE = [
  'Great thinking',
  'Nice work',
  'You are on the right track',
  'Good intuition',
  'Solid start',
];

const PROBES = [
  'Why do you think that is the case?',
  'Can you break that down step by step?',
  'What would happen if we changed one quantity?',
  'Which principle are you applying here?',
  'How would you explain this to a friend?',
];

// keyword-based misconception library per concept id
const MISCONCEPTION_LIBRARY: Record<string, { trap: string; message: string }[]> = {
  kinematics: [
    { trap: 'velocity is speed', message: 'Careful \u2014 velocity and speed are not the same. Velocity includes direction; speed does not.' },
    { trap: 'acceleration is speed', message: 'Acceleration is the rate of change of velocity, not the same as being fast.' },
  ],
  'newton-laws': [
    { trap: 'no force', message: 'A body at rest can still have forces acting on it \u2014 they just balance. No net force is what keeps it at rest.' },
    { trap: 'force causes motion', message: 'Force causes acceleration, not motion itself. An object can move with zero net force (Newton\u2019s first law).' },
  ],
  'energy-work': [
    { trap: 'energy is used up', message: 'Energy is not "used up" \u2014 it is transformed. Total energy is conserved.' },
  ],
  momentum: [
    { trap: 'energy conserved', message: 'In an inelastic collision momentum is conserved but kinetic energy is not \u2014 don\u2019t conflate the two.' },
  ],
  circuits: [
    { trap: 'current is used', message: 'Current is not "used up" by a bulb \u2014 the same current flows in and out. Energy is what is transferred.' },
  ],
  'atomic-structure': [
    { trap: 'isotopes differ in protons', message: 'Isotopes have the same number of protons \u2014 they differ in neutrons.' },
  ],
  bonding: [
    { trap: 'electrons transferred in covalent', message: 'Covalent bonds share electrons; ionic bonds transfer them. Mixing these up is a classic misconception.' },
  ],
  'acids-bases': [
    { trap: 'dilute acid becomes base', message: 'Diluting an acid never makes it basic \u2014 its pH approaches 7 from below.' },
  ],
  differentiation: [
    { trap: 'differentiate constant', message: 'The derivative of a constant is zero \u2014 make sure you applied the power rule to the variable term only.' },
  ],
  integration: [
    { trap: 'no constant', message: 'Indefinite integrals need + C \u2014 the constant of integration is easy to forget but essential.' },
  ],
  probability: [
    { trap: 'mutually exclusive independent', message: 'Mutually exclusive events are actually dependent \u2014 if one happens, the other cannot.' },
  ],
  genetics: [
    { trap: 'both alleles', message: 'Each gamete carries only one allele of a gene \u2014 that is Mendel\u2019s law of segregation.' },
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function tutorReply(
  studentMessage: string,
  context: { subjectId: string; conceptId?: string; mastery: number; conceptName?: string },
): TutorReply {
  const text = studentMessage.toLowerCase();
  const conceptId = context.conceptId;
  const traps = (conceptId && MISCONCEPTION_LIBRARY[conceptId]) || [];
  const hit = traps.find((t) => text.includes(t.trap.toLowerCase()));

  // direct answer prevention: if the student just asks for the answer, give a hint instead
  if (/(what is the answer|just tell me|give me the answer|answer is)/.test(text)) {
    return {
      text: `I could hand you the answer, but you\u2019d learn more by reasoning it through. Here is a hint: think about the core principle behind ${context.conceptName ?? 'this topic'} and what quantities are involved. Want me to guide you step by step?`,
      probe: pick(PROBES),
      conceptId,
    };
  }

  if (hit) {
    return {
      text: `${pick(ENCOURAGE)} \u2014 but I want to flag something important. ${hit.message} Let\u2019s make sure you\u2019ve got this nailed before your viva. Can you rephrase the idea in your own words?`,
      misconception: hit.message,
      probe: pick(PROBES),
      conceptId,
    };
  }

  // mastery-aware tone
  if (context.mastery < 35) {
    return {
      text: `Let\u2019s build this up gently. ${context.conceptName ?? 'This concept'} can feel tricky at first \u2014 try starting from the basics. ${pick(PROBES)}`,
      probe: pick(PROBES),
      conceptId,
    };
  }
  if (context.mastery > 75) {
    return {
      text: `You clearly understand ${context.conceptName ?? 'this'} well. Let me push you: ${pick(PROBES)}`,
      probe: pick(PROBES),
      conceptId,
    };
  }
  return {
    text: `Good reasoning. To go deeper on ${context.conceptName ?? 'this'}, consider ${pick(PROBES)}`,
    probe: pick(PROBES),
    conceptId,
  };
}

export function tutorExplain(concept: Concept): string {
  const prereqs = concept.prerequisites
    .map((p) => getConcept(concept.subject, p)?.name)
    .filter(Boolean);
  const intro = prereqs.length
    ? `This builds on ${prereqs.join(', ')} \u2014 so make sure those feel solid first. `
    : '';
  return `${intro}${concept.description} Think of it as: ${concept.name.toLowerCase()} is about understanding ${concept.description.toLowerCase().replace(/describing|how|the rules that govern|atoms|cells|variables|/g, '').trim() || 'the core idea'}. Start by asking yourself what quantities are involved and what stays constant.`;
}
