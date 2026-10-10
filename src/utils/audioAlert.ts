/**
 * Pleasant Web Audio API notification chime generator
 * Generates synthetic harmonic chimes without requiring external audio files.
 */
let audioCtx: AudioContext | null = null;

export function playNotificationChime(volume: number = 0.15) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Harmonic bell chord: F5, A5, C6 (crystal pleasant alert)
    const frequencies = [698.46, 880.0, 1046.5];

    frequencies.forEach((freq, index) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.04);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * (1 - index * 0.2), now + index * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65 + index * 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + index * 0.04);
      osc.stop(now + 0.8 + index * 0.05);
    });
  } catch (err) {
    console.debug('Audio chime unable to play (autoplay policy or audio disabled):', err);
  }
}
