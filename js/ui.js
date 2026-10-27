// ==========================================
// 画面共通の図版と進行バー
// 色は CSS 変数で持つ。ライト／ダークの切り替えは配色だけで済ませる。
// ==========================================
const LINE = 'var(--art-line)';
const FILL = 'var(--art-fill)';
const SOFT = 'var(--art-soft)';
const ACC  = 'var(--art-accent)';
const MUT  = 'var(--art-muted)';
const FIG  = 'var(--art-figure)';

// 人物はピクトグラム（表情なし）で描く。
function figure(cx, headY, r, baseY, w) {
    return `
        <circle cx="${cx}" cy="${headY}" r="${r}" fill="${FIG}"/>
        <path d="M${cx - w} ${baseY} Q${cx - w} ${baseY - r * 1.55} ${cx} ${baseY - r * 1.55}
                 Q${cx + w} ${baseY - r * 1.55} ${cx + w} ${baseY} Z" fill="${FIG}"/>`;
}

// 右向きに広がる音。scale で大きさを変える。
function waves(x, y, color = ACC, scale = 1) {
    const arc = (dx, dy, bulge) => {
        const x1 = x + dx * scale;
        const y1 = y - dy * scale;
        const y2 = y + dy * scale;
        const cx = x + bulge * scale;
        return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${y} ${x1.toFixed(1)} ${y2.toFixed(1)}"/>`;
    };
    return `
        <g fill="none" stroke="${color}" stroke-width="${(2.4 * scale).toFixed(1)}" stroke-linecap="round">
            <g class="wave">${arc(0, 7, 6)}</g>
            <g class="wave wave-2">${arc(6, 13, 16)}</g>
            <g class="wave wave-3">${arc(12, 19, 26)}</g>
        </g>`;
}

const ART = {
    // 実験の全体像：雑音の中で打鍵しながら、提示音に反応する。
    // 実験の全体像：雑音の中で打鍵しながら、提示音に反応する。
    overview: () => `
<svg viewBox="0 0 300 150" role="img" aria-label="雑音の中で打鍵しながら提示音に反応する課題">
    <path d="M22 52 H36 L54 36 V84 L36 68 H22 Z" fill="${FILL}" stroke="${MUT}"
          stroke-width="2.4" stroke-linejoin="round"/>
    ${waves(64, 60, MUT, 0.85)}
    <text x="44" y="110" text-anchor="middle" font-size="11" fill="${MUT}" font-family="sans-serif">雑音</text>

    ${figure(150, 50, 17, 104, 27)}
    <rect x="112" y="108" width="76" height="16" rx="3" fill="${FILL}" stroke="${LINE}" stroke-width="2"/>
    <rect x="130" y="117" width="40" height="3" rx="1.5" fill="${SOFT}"/>
    <g class="type-hand"><circle cx="126" cy="106" r="6" fill="${FIG}"/></g>
    <g class="type-hand" style="animation-delay:.5s"><circle cx="174" cy="106" r="6" fill="${FIG}"/></g>

    <circle class="wave" cx="252" cy="60" r="9" fill="${ACC}"/>
    <circle class="wave wave-2" cx="252" cy="60" r="18" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <circle class="wave wave-3" cx="252" cy="60" r="27" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <text x="252" y="110" text-anchor="middle" font-size="11" fill="${ACC}" font-family="sans-serif">提示音</text>
</svg>`,

    // 精密騒音計。実験者が設置する。
    soundMeter: () => `
<svg viewBox="0 0 120 130" role="img" aria-label="精密騒音計">
    <path d="M60 10 v14" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="8" r="7" fill="${SOFT}" stroke="${LINE}" stroke-width="2.4"/>
    <rect x="30" y="24" width="60" height="96" rx="7" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <rect x="38" y="33" width="44" height="34" rx="3" fill="${SOFT}" stroke="${LINE}" stroke-width="1.6"/>
    <text x="60" y="55" text-anchor="middle" font-size="17" font-weight="700" fill="${ACC}"
          font-family="monospace">60.0</text>
    <text x="60" y="64" text-anchor="middle" font-size="7" fill="${MUT}" font-family="sans-serif">dB  LAeq</text>
    <rect x="38" y="72" width="44" height="5" rx="2.5" fill="${SOFT}"/>
    <rect class="meter-fill" x="38" y="72" width="44" height="5" rx="2.5" fill="${ACC}"/>
    <g fill="${SOFT}" stroke="${LINE}" stroke-width="1.4">
        <rect x="38" y="86" width="18" height="10" rx="2"/>
        <rect x="64" y="86" width="18" height="10" rx="2"/>
        <rect x="38" y="101" width="18" height="10" rx="2"/>
        <rect x="64" y="101" width="18" height="10" rx="2"/>
    </g>
</svg>`,

    // 外部スピーカー。実験者が設置する。
    extSpeaker: () => `
<svg viewBox="0 0 150 130" role="img" aria-label="外部スピーカー">
    <rect x="22" y="18" width="62" height="94" rx="5" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <circle cx="53" cy="78" r="20" fill="${SOFT}" stroke="${LINE}" stroke-width="2.2"/>
    <circle cx="53" cy="78" r="7" fill="${LINE}"/>
    <circle cx="53" cy="38" r="9" fill="${SOFT}" stroke="${LINE}" stroke-width="2.2"/>
    <circle cx="53" cy="38" r="3" fill="${LINE}"/>
    ${waves(96, 70)}
</svg>`,

    // パソコン側の出力音量。
    volumeSlider: () => `
<svg viewBox="0 0 150 120" role="img" aria-label="パソコンの出力音量">
    <rect x="16" y="18" width="118" height="72" rx="5" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <rect x="52" y="96" width="46" height="6" rx="3" fill="${SOFT}" stroke="${LINE}" stroke-width="2"/>
    <rect x="34" y="50" width="82" height="6" rx="3" fill="${SOFT}"/>
    <g class="slide-knob">
        <rect x="34" y="50" width="52" height="6" rx="3" fill="${ACC}"/>
        <circle cx="86" cy="53" r="9" fill="${FILL}" stroke="${ACC}" stroke-width="2.6"/>
    </g>
    <text x="75" y="76" text-anchor="middle" font-size="11" fill="${MUT}" font-family="sans-serif">出力音量</text>
</svg>`,

    // 換気扇の雑音。課題中ずっと流れる。
    fan: () => `
<svg viewBox="0 0 150 120" role="img" aria-label="雑音（換気扇）">
    <rect x="18" y="20" width="80" height="80" rx="6" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <circle cx="58" cy="60" r="32" fill="none" stroke="${LINE}" stroke-width="2"/>
    <g class="spin">
        <g transform="translate(58,60)">
            <g transform="rotate(0)"><path d="M0 0 L-7 -22 Q0 -27 7 -22 Z" fill="${SOFT}" stroke="${LINE}" stroke-width="2"/></g>
            <g transform="rotate(90)"><path d="M0 0 L-7 -22 Q0 -27 7 -22 Z" fill="${SOFT}" stroke="${LINE}" stroke-width="2"/></g>
            <g transform="rotate(180)"><path d="M0 0 L-7 -22 Q0 -27 7 -22 Z" fill="${SOFT}" stroke="${LINE}" stroke-width="2"/></g>
            <g transform="rotate(270)"><path d="M0 0 L-7 -22 Q0 -27 7 -22 Z" fill="${SOFT}" stroke="${LINE}" stroke-width="2"/></g>
        </g>
    </g>
    <circle cx="58" cy="60" r="5" fill="${LINE}"/>
    ${waves(110, 60, MUT)}
</svg>`,

    // 提示音。
    beep: () => `
<svg viewBox="0 0 196 120" role="img" aria-label="提示音">
    <circle class="wave wave-3" cx="62" cy="60" r="46" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <circle class="wave wave-2" cx="62" cy="60" r="34" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <circle class="wave" cx="62" cy="60" r="22" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <circle cx="62" cy="60" r="11" fill="${ACC}"/>
    <text x="152" y="52" text-anchor="middle" font-size="15" font-weight="700" fill="${ACC}"
          font-family="sans-serif" class="blink">1 kHz</text>
    <text x="152" y="70" text-anchor="middle" font-size="11" fill="${MUT}" font-family="sans-serif">0.5 秒</text>
</svg>`,

    // 回答はスペースキー。
    spacebar: () => `
<svg viewBox="0 0 200 104" role="img" aria-label="スペースキーで回答する">
    <rect x="12" y="16" width="176" height="68" rx="6" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <g fill="${SOFT}" stroke="${LINE}" stroke-width="1.6">
        <rect x="26" y="26" width="19" height="14" rx="3"/>
        <rect x="51" y="26" width="19" height="14" rx="3"/>
        <rect x="76" y="26" width="19" height="14" rx="3"/>
        <rect x="101" y="26" width="19" height="14" rx="3"/>
        <rect x="126" y="26" width="19" height="14" rx="3"/>
        <rect x="151" y="26" width="23" height="14" rx="3"/>
    </g>
    <g class="press">
        <rect x="44" y="50" width="112" height="20" rx="4" fill="${ACC}"/>
        <text x="100" y="64" text-anchor="middle" font-size="11" font-weight="700"
              fill="var(--accent-ink)" font-family="sans-serif" letter-spacing="2">SPACE</text>
        <rect x="94" y="72" width="12" height="20" rx="6" fill="${FIG}"/>
    </g>
</svg>`,

    // 打鍵課題。
    typing: () => `
<svg viewBox="0 0 220 140" role="img" aria-label="打鍵課題">
    ${figure(110, 44, 18, 100, 29)}
    <rect x="66" y="104" width="88" height="18" rx="4" fill="${FILL}" stroke="${LINE}" stroke-width="2.4"/>
    <g fill="${SOFT}" stroke="${LINE}" stroke-width="1.4">
        <rect x="74" y="109" width="12" height="4" rx="1.5"/>
        <rect x="90" y="109" width="12" height="4" rx="1.5"/>
        <rect x="106" y="109" width="12" height="4" rx="1.5"/>
        <rect x="122" y="109" width="12" height="4" rx="1.5"/>
        <rect x="88" y="116" width="44" height="4" rx="2"/>
    </g>
    <g class="type-hand"><circle cx="80" cy="102" r="7" fill="${FIG}"/></g>
    <g class="type-hand" style="animation-delay:.55s"><circle cx="140" cy="102" r="7" fill="${FIG}"/></g>
    <g fill="${ACC}" font-family="monospace" font-size="15" font-weight="700">
        <text class="rise" x="172" y="62">a</text>
        <text class="rise rise-2" x="36" y="56">k</text>
        <text class="rise rise-3" x="186" y="40">i</text>
    </g>
</svg>`,

    // 聴取課題。
    listening: () => `
<svg viewBox="0 0 220 140" role="img" aria-label="聴取課題">
    ${figure(120, 52, 19, 124, 31)}
    ${waves(154, 54)}
    <circle class="wave" cx="58" cy="54" r="7" fill="${ACC}"/>
    <circle class="wave wave-2" cx="58" cy="54" r="15" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <text x="58" y="96" text-anchor="middle" font-size="12" fill="${MUT}" font-family="sans-serif">提示音</text>
</svg>`,

    // 二重課題。
    dual: () => `
<svg viewBox="0 0 260 140" role="img" aria-label="二重課題">
    ${figure(130, 44, 18, 100, 29)}
    <rect x="86" y="104" width="88" height="18" rx="4" fill="${FILL}" stroke="${LINE}" stroke-width="2.4"/>
    <rect x="108" y="116" width="44" height="4" rx="2" fill="${SOFT}"/>
    <g fill="${SOFT}" stroke="${LINE}" stroke-width="1.4">
        <rect x="94" y="109" width="12" height="4" rx="1.5"/>
        <rect x="110" y="109" width="12" height="4" rx="1.5"/>
        <rect x="126" y="109" width="12" height="4" rx="1.5"/>
        <rect x="142" y="109" width="12" height="4" rx="1.5"/>
    </g>
    <g class="type-hand"><circle cx="100" cy="102" r="7" fill="${FIG}"/></g>
    <g class="type-hand" style="animation-delay:.55s"><circle cx="160" cy="102" r="7" fill="${FIG}"/></g>
    <circle class="wave" cx="30" cy="48" r="8" fill="${MUT}"/>
    <circle class="wave wave-2" cx="30" cy="48" r="16" fill="none" stroke="${MUT}" stroke-width="2.4"/>
    <text x="30" y="20" text-anchor="middle" font-size="11" fill="${MUT}" font-family="sans-serif">雑音</text>
    <circle class="wave" cx="230" cy="48" r="8" fill="${ACC}"/>
    <circle class="wave wave-2" cx="230" cy="48" r="16" fill="none" stroke="${ACC}" stroke-width="2.4"/>
    <text x="230" y="20" text-anchor="middle" font-size="11" fill="${ACC}" font-family="sans-serif">提示音</text>
</svg>`,

    // 休憩。
    restTimer: () => `
<svg viewBox="0 0 140 130" role="img" aria-label="休憩時間">
    <circle cx="70" cy="66" r="42" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <circle cx="70" cy="66" r="34" fill="none" stroke="${SOFT}" stroke-width="6"/>
    <path class="sweep" d="M70 66 L70 36" stroke="${ACC}" stroke-width="3" stroke-linecap="round"
          style="transform-origin:70px 66px"/>
    <circle cx="70" cy="66" r="4" fill="${LINE}"/>
    <path d="M58 20 h24" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
    <path d="M70 20 v4" stroke="${LINE}" stroke-width="3"/>
</svg>`,

    // 完了。
    check: () => `
<svg viewBox="0 0 120 120" role="img" aria-label="完了">
    <circle cx="60" cy="60" r="34" fill="none" stroke="var(--ok)" stroke-width="2.6"/>
    <path d="M45 60 l11 11 l21 -24" fill="none" stroke="var(--ok)" stroke-width="4"
          stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

    // 誤反応・聞き逃しで音圧が上がる。
    louder: () => `
<svg viewBox="0 0 150 120" role="img" aria-label="提示音が10デシベル大きくなる">
    <path d="M20 48 H36 L56 30 V90 L36 72 H20 Z" fill="${FILL}" stroke="${LINE}"
          stroke-width="2.4" stroke-linejoin="round"/>
    <path class="rise" d="M82 76 V44 m0 0 l-8 9 m8 -9 l8 9" fill="none" stroke="${ACC}"
          stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="116" y="66" text-anchor="middle" font-size="15" font-weight="700" fill="${ACC}"
          font-family="sans-serif">+10 dB</text>
</svg>`,

    // セッション完了。
    complete: () => `
<svg viewBox="0 0 200 130" role="img" aria-label="セッション完了">
    <rect x="52" y="20" width="96" height="94" rx="6" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <rect x="80" y="12" width="40" height="16" rx="4" fill="${SOFT}" stroke="${LINE}" stroke-width="2.2"/>
    <g stroke="${SOFT}" stroke-width="4" stroke-linecap="round">
        <path d="M66 50 h68"/><path d="M66 66 h68"/><path d="M66 82 h44"/>
    </g>
    <circle cx="136" cy="92" r="20" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="2.4"/>
    <path d="M127 92 l6 6 l12 -13" fill="none" stroke="var(--ok)" stroke-width="3.2"
          stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

    // 画面構成の説明。
    screenGuide: () => `
<svg viewBox="0 0 260 150" role="img" aria-label="画面の構成">
    <rect x="14" y="12" width="232" height="120" rx="6" fill="${FILL}" stroke="${LINE}" stroke-width="2.6"/>
    <g fill="${SOFT}" stroke="${LINE}" stroke-width="1.6">
        <rect x="28" y="26" width="64" height="20" rx="4"/>
        <rect x="98" y="26" width="64" height="20" rx="4"/>
        <rect x="168" y="26" width="64" height="20" rx="4"/>
    </g>
    <rect x="28" y="58" width="204" height="44" rx="5" fill="${SOFT}"/>
    <text x="130" y="86" text-anchor="middle" font-size="19" font-weight="700" fill="${ACC}"
          font-family="monospace">ka n ji</text>
    <rect x="92" y="112" width="76" height="8" rx="4" fill="${ACC}" class="blink"/>
</svg>`
};

// セッションの流れで使う小さな記号。
const ICON = {
    key: `<svg viewBox="0 0 28 20"><rect x="1.5" y="3" width="25" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><g fill="currentColor"><rect x="5" y="6.5" width="4" height="3" rx="1"/><rect x="12" y="6.5" width="4" height="3" rx="1"/><rect x="19" y="6.5" width="4" height="3" rx="1"/><rect x="8" y="12" width="12" height="2.6" rx="1.3"/></g></svg>`,
    sound: `<svg viewBox="0 0 28 20"><path d="M5 8h4l6-5v14l-6-5H5Z" fill="currentColor"/><path d="M19 7q2.6 3 0 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M23 4q4.6 6 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    rest: `<svg viewBox="0 0 28 20"><circle cx="14" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 6v4.5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    done: `<svg viewBox="0 0 28 20"><path d="M8 10.5l4 4 9-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

// ==========================================
// 進行バー
// ==========================================
const UI_STEPS = [
    { key: 'howto',     mark: '0', label: '操作ガイド',     href: 'howto.html' },
    { key: 'calibrate', mark: '1', label: '音量校正',       href: 'calibrate.html' },
    { key: 'measure',   mark: '2', label: '聴力測定',       href: 'measure.html' },
    { key: 'game',      mark: '3', label: '本番セッション', href: 'game.html' }
];

const THEME_KEY = 'webaudiomix_theme';
const THEME_ORDER = ['auto', 'light', 'dark'];
const THEME_LABEL = { auto: '表示：自動', light: '表示：ライト', dark: '表示：ダーク' };

const UI = {
    ART,
    ICON,

    markDone(key) {
        try { localStorage.setItem(`webaudiomix_done_${key}`, '1'); } catch (e) { /* 保存できなくても進める */ }
    },

    isDone(key) {
        try {
            if (key === 'measure') return localStorage.getItem('userBaseThresholdDB') !== null;
            return localStorage.getItem(`webaudiomix_done_${key}`) === '1';
        } catch (e) {
            return false;
        }
    },

    stepper(current) {
        const host = document.getElementById('stepper');
        if (!host) return;
        const currentIndex = UI_STEPS.findIndex((s) => s.key === current);
        host.innerHTML = UI_STEPS.map((step, i) => {
            const done = UI.isDone(step.key) && i !== currentIndex;
            const state = i === currentIndex ? 'current' : (done ? 'done' : '');
            return `<a class="stepper-item ${state}" href="${step.href}">
                        <span class="stepper-dot">${done ? '✓' : step.mark}</span>
                        <span>${step.label}</span>
                    </a>`;
        }).join('');
    },

    paintArt(root = document) {
        root.querySelectorAll('[data-art]').forEach((el) => {
            const name = el.dataset.art;
            if (ART[name]) el.innerHTML = ART[name]();
        });
    },

    // 自動（OS に従う）→ ライト → ダーク の順で切り替える。
    setTheme(mode) {
        if (mode === 'auto') delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = mode;
        try { localStorage.setItem(THEME_KEY, mode); } catch (e) { /* 保存できなくても切り替わる */ }
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = THEME_LABEL[mode];
    },

    currentTheme() {
        try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; }
    },

    mountThemeToggle() {
        if (document.getElementById('themeToggle')) return;
        const btn = document.createElement('button');
        btn.id = 'themeToggle';
        btn.className = 'theme-toggle';
        btn.type = 'button';
        btn.textContent = THEME_LABEL[UI.currentTheme()];
        btn.addEventListener('click', () => {
            const next = THEME_ORDER[(THEME_ORDER.indexOf(UI.currentTheme()) + 1) % THEME_ORDER.length];
            UI.setTheme(next);
        });
        document.body.appendChild(btn);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.paintArt();
    UI.mountThemeToggle();
    const host = document.getElementById('stepper');
    if (host && host.dataset.current) UI.stepper(host.dataset.current);
});
