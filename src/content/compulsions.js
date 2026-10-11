// Common compulsions, grouped the way people tend to describe them.
// IDs from v1 are kept so existing data migrates cleanly.
export const CATEGORIES = [
  { id: 'Checking', label: 'checking', icon: 'lock-closed-outline' },
  { id: 'Contamination', label: 'washing & cleaning', icon: 'water-outline' },
  { id: 'Reassurance', label: 'reassurance & confessing', icon: 'chatbubbles-outline' },
  { id: 'Mental', label: 'mental rituals', icon: 'cloudy-outline' },
  { id: 'Symmetry', label: 'just right & ordering', icon: 'grid-outline' },
  { id: 'Avoidance', label: 'avoiding', icon: 'eye-off-outline' },
];

export const PRESETS = [
  { id: 'checking-locks', name: 'Checking doors or locks', cat: 'Checking' },
  { id: 'checking-stove', name: 'Checking the stove', cat: 'Checking' },
  { id: 'checking-appliances', name: 'Checking appliances or plugs', cat: 'Checking' },
  { id: 'checking-messages', name: 'Re-checking messages I sent', cat: 'Checking' },
  { id: 'body-checking', name: 'Scanning my body for symptoms', cat: 'Checking' },
  { id: 'checking-driving', name: 'Going back to check I didn’t hit someone', cat: 'Checking' },

  { id: 'hand-washing', name: 'Washing my hands again', cat: 'Contamination' },
  { id: 'showering', name: 'Long or repeated showers', cat: 'Contamination' },
  { id: 'sanitizing', name: 'Sanitizing or cleaning surfaces', cat: 'Contamination' },
  { id: 'avoiding-touch', name: 'Avoiding touching things', cat: 'Contamination' },
  { id: 'changing-clothes', name: 'Changing clothes after going out', cat: 'Contamination' },

  { id: 'reassurance', name: 'Asking someone for reassurance', cat: 'Reassurance' },
  { id: 'googling', name: 'Googling my fears or symptoms', cat: 'Reassurance' },
  { id: 'asking-ai', name: 'Asking an AI chatbot to reassure me', cat: 'Reassurance' },
  { id: 'confessing', name: 'Confessing a thought', cat: 'Reassurance' },

  { id: 'mental-review', name: 'Replaying events in my head', cat: 'Mental' },
  { id: 'ruminating', name: 'Trying to figure a thought out', cat: 'Mental' },
  { id: 'neutralizing', name: 'Cancelling a bad thought with a good one', cat: 'Mental' },
  { id: 'counting', name: 'Counting or repeating words', cat: 'Mental' },
  { id: 'praying', name: 'Praying or repeating phrases to feel safe', cat: 'Mental' },
  { id: 'testing-feelings', name: 'Testing how I feel about a thought', cat: 'Mental' },

  { id: 'arranging', name: 'Arranging things until they feel right', cat: 'Symmetry' },
  { id: 'rewriting', name: 'Re-reading or re-writing', cat: 'Symmetry' },
  { id: 'redoing', name: 'Redoing actions until they feel right', cat: 'Symmetry' },
  { id: 'evening-up', name: 'Evening things up on both sides', cat: 'Symmetry' },

  { id: 'avoiding-situations', name: 'Avoiding a place or situation', cat: 'Avoidance' },
  { id: 'avoiding-people', name: 'Avoiding certain people', cat: 'Avoidance' },
  { id: 'avoiding-objects', name: 'Hiding knives or sharp things', cat: 'Avoidance' },
  { id: 'avoiding-media', name: 'Avoiding words, shows or numbers', cat: 'Avoidance' },
];

export const CUSTOM_CAT = 'Custom';
export const GENERIC_ID = 'something-else';
export const GENERIC = { id: GENERIC_ID, name: 'Something else', cat: CUSTOM_CAT };
