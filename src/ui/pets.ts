import { ComponentType } from 'react';
import { PET_MOOD_COPY, PetMood } from '../pet/petHealth';
import { BoltFace } from './BoltFace';
import { EmberFace } from './EmberFace';
import { HootFace } from './HootFace';
import { PipFace } from './PipFace';

export type PetId = 'pip' | 'ember' | 'hoot' | 'bolt';

export interface PetDef {
  id: PetId;
  name: string;
  dot: string;
  concept: string;
  Face: ComponentType<{ mood: PetMood; size?: number }>;
  moodCopy: Record<PetMood, { label: string; flavor: string }>;
}

/** Fixed display order for mood-state previews (best to worst). */
export const ALL_MOODS: PetMood[] = ['thriving', 'happy', 'steady', 'worried', 'fading'];

export const PET_DEFS: Record<PetId, PetDef> = {
  pip: {
    id: 'pip',
    name: 'Pip',
    dot: '#ff8a4c',
    concept: 'The original companion. A rounded little blob that beams when pacts are kept and wilts when they break.',
    Face: PipFace,
    moodCopy: PET_MOOD_COPY,
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    dot: '#ff8a1e',
    concept: 'A living streak-flame. Burns tall and gold when you keep pacts; gutters to a cold blue flicker as they break.',
    Face: EmberFace,
    moodCopy: {
      fading: { label: 'Fading', flavor: 'Ember has guttered to a cold blue flicker.' },
      worried: { label: 'Worried', flavor: 'Ember is burning low — a pact is running hot.' },
      steady: { label: 'On Track', flavor: 'Ember is burning fine. Keep it fed.' },
      happy: { label: 'Happy', flavor: 'Ember is burning bright and gold.' },
      thriving: { label: 'Thriving', flavor: 'Ember is roaring — embers rising on every pact kept.' },
    },
  },
  hoot: {
    id: 'hoot',
    name: 'Hoot',
    dot: '#e6aa50',
    concept: 'A pocket owl on watch. Puffs up proud and bright-eyed; ends drenched and drooping under its own rain cloud.',
    Face: HootFace,
    moodCopy: {
      fading: { label: 'Fading', flavor: 'Hoot is drenched, drooping under a rain cloud.' },
      worried: { label: 'Worried', flavor: "Hoot's tufts have drooped — a pact is running hot." },
      steady: { label: 'On Track', flavor: 'Hoot keeps calm watch on the perch.' },
      happy: { label: 'Happy', flavor: 'Hoot is bright-eyed and content.' },
      thriving: { label: 'Thriving', flavor: 'Hoot is puffed up proud, tufts held high.' },
    },
  },
  bolt: {
    id: 'bolt',
    name: 'Bolt',
    dot: '#5cf2c8',
    concept: 'A little rock-bot. Levitates with charged cyan eyes; powers down, cracks, and throws sparks when pacts expire.',
    Face: BoltFace,
    moodCopy: {
      fading: { label: 'Fading', flavor: 'Bolt has powered down — cracked and sparking.' },
      worried: { label: 'Worried', flavor: 'Bolt is flickering — a pact is running hot.' },
      steady: { label: 'On Track', flavor: 'Bolt is humming along fine. Keep the charge up.' },
      happy: { label: 'Happy', flavor: 'Bolt is humming along, lights fully lit.' },
      thriving: { label: 'Thriving', flavor: 'Bolt is levitating, charged cyan and sparking with energy.' },
    },
  },
};

export const PET_LIST: PetDef[] = Object.values(PET_DEFS);
