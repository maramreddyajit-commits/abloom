import { Platform, Share } from 'react-native';

// Native: the system share sheet (save to Files, email it to a therapist, AirDrop, etc.).
// Web: download a file.
export async function shareText({ title, text, filename }) {
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([text], { type: filename?.endsWith('.json') ? 'application/json' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'abloom.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await Share.share({ title, message: text });
    return true;
  } catch {
    return false;
  }
}
