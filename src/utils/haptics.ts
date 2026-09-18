export function triggerHaptic(type: 'tap' | 'success' | 'error' | 'win', enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(15);
        break;
      case 'success':
        navigator.vibrate([25, 40, 35]);
        break;
      case 'error':
        navigator.vibrate([60, 40, 60]);
        break;
      case 'win':
        navigator.vibrate([40, 60, 40, 60, 80]);
        break;
    }
  } catch {
    // Ignore unsupported device contexts
  }
}
