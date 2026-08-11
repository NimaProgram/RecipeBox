// beep.js — WebAudio による短いビープ音（外部ファイル不要・CSP 適合）。ミュート可。

const MUTE_KEY = 'bossAlertMuted';
let ctx = null;

export function isMuted() { return localStorage.getItem(MUTE_KEY) === '1'; }
export function setMuted(m) { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); }
export function toggleMuted() { const m = !isMuted(); setMuted(m); return m; }

/** 短いビープを鳴らす（ミュート時は無音） */
export function beep({ freq = 880, durationMs = 180, type = 'sine', volume = 0.15 } = {}) {
    if (isMuted()) return;
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!ctx) ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
        osc.start(now);
        osc.stop(now + durationMs / 1000);
    } catch { /* noop */ }
}

/** 出現通知用の二音（ピッ・ピッ） */
export function alertBeep() {
    beep({ freq: 988, durationMs: 150 });
    setTimeout(() => beep({ freq: 1319, durationMs: 200 }), 180);
}
