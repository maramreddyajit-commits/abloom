// All user-facing copy that rotates or is reused lives here.
// House rules (see README): warm, lowercase, never reassuring about the content of a fear,
// never promising that something bad won't happen. We praise the *choice*, not the outcome.

export const STAGE_NAMES = ['seedling', 'sprout', 'sapling', 'young tree', 'full bloom'];
// Growth is counted in "water days" — days with at least one watering — for the current plant.
// A missed day pauses growth; it never undoes it.
export const STAGE_DAYS = [0, 2, 5, 9, 14];

export const PLANT_NAME_IDEAS = ['sprout', 'fern', 'pip', 'moss', 'bean', 'clover', 'juniper', 'basil'];

export const ENCOURAGEMENTS = [
  'that was a brave choice.',
  'one drop at a time.',
  'you picked discomfort over the cycle.',
  'the urge asked. you didn’t answer.',
  'hard thing. right thing.',
  'that’s what practice looks like.',
  'uncomfortable, and you did it anyway.',
  'your roots just got a little deeper.',
  'another drop. it adds up.',
  'you let the uncertainty be there.',
  'future you felt that one.',
];

export const PARTIAL_PRAISE = {
  delay: 'you waited it out. waiting is resisting too.',
  shrink: 'a smaller ritual is real progress.',
};

// Shown during the urge timer. These are uncertainty-tolerance and urge-surfing prompts,
// deliberately NOT calming reassurance.
export const SURF_PROMPTS = [
  'maybe, maybe not. you can let it stay uncertain.',
  'you don’t have to make this feeling go away.',
  'notice where you feel the urge in your body.',
  'the thought can be here without you answering it.',
  'you can be unsure and still not do the compulsion.',
  'urges rise, peak and fall when you leave them alone.',
  'no need to argue with the thought. just let it sit there.',
  'this is uncomfortable. uncomfortable is allowed.',
  'doing the ritual buys a little relief and a bigger urge next time.',
  'you’re practising, not trying to feel certain.',
];

export const STRUGGLE_MESSAGES = [
  'the urge is here. you don’t have to obey it.',
  'you can feel all of this and still not do the compulsion.',
  'you don’t need to be sure. you can carry not knowing.',
  'urges are loud, but they pass on their own when left alone.',
  'nothing to solve right now. just ride it.',
];

export const SLIP_MESSAGES = [
  'that’s okay. noticing it is part of the practice.',
  'slips happen to everyone doing this work. your plant is still here.',
  'no harm in starting again next time. you noticed, and that counts for learning.',
];

export const EXPOSURE_LEAN_IN = [
  'let the feeling be as big as it wants to be.',
  'no neutralizing, no reviewing. just stay.',
  'you’re teaching your brain something by staying.',
  'you don’t need the anxiety to drop to succeed.',
  'notice the thought. don’t argue with it.',
  'if you want to make it harder, lean in a little more.',
];

export const GROUNDING_STEPS = [
  { n: 5, text: 'things you can see' },
  { n: 4, text: 'things you can feel or touch' },
  { n: 3, text: 'things you can hear' },
  { n: 2, text: 'things you can smell' },
  { n: 1, text: 'thing you can taste' },
];

export const REMINDER_LINES = [
  'your plant’s here whenever you are.',
  'a little water today? no pressure.',
  'if an urge showed up today, you can log how you handled it.',
];

export const DISCLAIMER =
  'abloom is a self-help tool, not a medical device or a replacement for treatment. it doesn’t diagnose or treat ocd. if ocd is getting in the way of your life, an ERP-trained therapist can help.';

export const IOCDF_DIRECTORY = 'https://iocdf.org/find-help/';
// TODO before launch: host PRIVACY.md somewhere public (e.g. GitHub Pages) and put the URL here.
export const PRIVACY_URL = 'https://github.com/maramreddyajit-commits/abloom/blob/main/PRIVACY.md';
// TODO before launch: replace with a real support inbox (both stores require a contact).
export const SUPPORT_EMAIL = 'support@abloom.app';
