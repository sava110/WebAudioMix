// ==========================================
// 画面共通のイラストと進行バー
// 文章を読まなくても何をするか分かるように、各画面に同じ絵を使い回す。
// ==========================================
const INK = '#2b3a46';
const SKIN = '#ffe0c8';
const HAIR = '#3c4a55';
const BLUE = '#00a0e9';
const PALE = '#eaf7fe';

// 顔（向きは正面だけ）。y は頭の中心。
function face(cx, cy, r) {
    return `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
        <path d="M${cx - r} ${cy - 4} Q${cx - r + 2} ${cy - r - 10} ${cx} ${cy - r - 9}
                 Q${cx + r - 2} ${cy - r - 10} ${cx + r} ${cy - 4}
                 Q${cx + r * 0.5} ${cy - r * 0.75} ${cx} ${cy - r * 0.6}
                 Q${cx - r * 0.5} ${cy - r * 0.75} ${cx - r} ${cy - 4} Z" fill="${HAIR}"/>
        <circle cx="${cx - r * 0.35}" cy="${cy + 1}" r="2.8" fill="${INK}"/>
        <circle cx="${cx + r * 0.35}" cy="${cy + 1}" r="2.8" fill="${INK}"/>
        <path d="M${cx - 6} ${cy + 9} Q${cx} ${cy + 15} ${cx + 6} ${cy + 9}"
              fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
}

// 肩から下。色はシャツの色。
function body(cx, baseY, w, color) {
    return `<path d="M${cx - w} ${baseY} Q${cx - w} ${baseY - 34} ${cx} ${baseY - 34}
                     Q${cx + w} ${baseY - 34} ${cx + w} ${baseY} Z"
                  fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
}

// 音が広がる弧。右向き3本。
function waves(x, y, color = BLUE) {
    return `
        <g fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round">
            <path class="wave" d="M${x} ${y - 9} Q${x + 7} ${y} ${x} ${y + 9}"/>
            <path class="wave wave-2" d="M${x + 7} ${y - 15} Q${x + 18} ${y} ${x + 7} ${y + 15}"/>
            <path class="wave wave-3" d="M${x + 14} ${y - 21} Q${x + 29} ${y} ${x + 14} ${y + 21}"/>
        </g>`;
}

const ART = {
    // ホームの主役。ヘッドホンをつけて音を聴いている人。
    hero: () => `
<svg viewBox="0 0 230 165" role="img" aria-label="ヘッドホンをつけた人">
    <ellipse cx="115" cy="150" rx="74" ry="9" fill="${PALE}"/>
    <circle cx="115" cy="80" r="62" fill="${PALE}"/>
    ${body(115, 148, 36, BLUE)}
    ${face(115, 62, 27)}
    <path d="M86 58 Q115 22 144 58" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <rect x="76" y="52" width="18" height="30" rx="9" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
    <rect x="136" y="52" width="18" height="30" rx="9" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
    ${waves(170, 70)}
    <g fill="${BLUE}">
        <g class="rise"><circle cx="48" cy="72" r="5"/><rect x="51" y="54" width="3" height="20" rx="1.5"/></g>
        <g class="rise rise-2"><circle cx="34" cy="92" r="4"/><rect x="36.5" y="78" width="2.6" height="16" rx="1.3"/></g>
    </g>
</svg>`,

    // スマホの騒音計アプリ。針が 60 まで動く。
    phoneMeter: () => `
<svg viewBox="0 0 120 110" role="img" aria-label="騒音計アプリを開いたスマートフォン">
    <rect x="26" y="8" width="68" height="96" rx="13" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <rect x="34" y="18" width="52" height="60" rx="8" fill="${PALE}"/>
    <path d="M40 64 A20 20 0 0 1 80 64" fill="none" stroke="#c8e2f0" stroke-width="6" stroke-linecap="round"/>
    <path class="needle" d="M60 64 L60 44" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="60" cy="64" r="4" fill="${INK}"/>
    <text x="60" y="94" text-anchor="middle" font-size="15" font-weight="700" fill="${BLUE}" font-family="sans-serif">dB</text>
    <rect x="50" y="11.5" width="20" height="3.4" rx="1.7" fill="#cddbe5"/>
</svg>`,

    // PC のスピーカーから音が出ている。
    speaker: () => `
<svg viewBox="0 0 130 110" role="img" aria-label="音が出ているスピーカー">
    <path d="M22 44 H40 L62 24 V86 L40 66 H22 Z" fill="#ffffff" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>
    ${waves(74, 55)}
</svg>`,

    // パソコンの音量つまみを合わせる。
    volumeSlider: () => `
<svg viewBox="0 0 130 110" role="img" aria-label="パソコンの音量つまみ">
    <rect x="14" y="24" width="102" height="60" rx="8" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <rect x="22" y="32" width="86" height="44" rx="5" fill="${PALE}"/>
    <rect x="8" y="88" width="114" height="8" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="3"/>
    <rect x="32" y="50" width="66" height="8" rx="4" fill="#d3e7f3"/>
    <rect x="32" y="50" width="38" height="8" rx="4" fill="${BLUE}"/>
    <circle class="bob" cx="70" cy="54" r="11" fill="#ffffff" stroke="${BLUE}" stroke-width="4"/>
</svg>`,

    // 換気扇の雑音。ずっと鳴り続ける。
    fan: () => `
<svg viewBox="0 0 130 110" role="img" aria-label="回っている換気扇">
    <rect x="16" y="16" width="78" height="78" rx="14" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <circle cx="55" cy="55" r="30" fill="${PALE}"/>
    <g class="spin" style="transform-origin:55px 55px">
        <path d="M55 55 Q46 30 61 27 Q70 38 55 55" fill="#bfe3f6" stroke="${INK}" stroke-width="2.6"/>
        <path d="M55 55 Q80 46 83 61 Q72 70 55 55" fill="#bfe3f6" stroke="${INK}" stroke-width="2.6"/>
        <path d="M55 55 Q64 80 49 83 Q40 72 55 55" fill="#bfe3f6" stroke="${INK}" stroke-width="2.6"/>
        <path d="M55 55 Q30 64 27 49 Q38 40 55 55" fill="#bfe3f6" stroke="${INK}" stroke-width="2.6"/>
    </g>
    <circle cx="55" cy="55" r="6" fill="${INK}"/>
    ${waves(104, 55, '#9bb6c6')}
</svg>`,

    // 雑音の中で鳴る「ピー」。
    beep: () => `
<svg viewBox="0 0 170 110" role="img" aria-label="ピーという音">
    <circle class="wave wave-3" cx="52" cy="55" r="44" fill="none" stroke="${BLUE}" stroke-width="3"/>
    <circle class="wave wave-2" cx="52" cy="55" r="33" fill="none" stroke="${BLUE}" stroke-width="3"/>
    <circle class="wave" cx="52" cy="55" r="22" fill="none" stroke="${BLUE}" stroke-width="3"/>
    <circle cx="52" cy="55" r="14" fill="${BLUE}"/>
    <path d="M46 55 h12" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>
    <text x="116" y="46" text-anchor="middle" font-size="21" font-weight="800" fill="${BLUE}"
          font-family="sans-serif" class="blink">ピー</text>
</svg>`,

    // スペースキーを押す。指が降りてくる。
    spacebar: () => `
<svg viewBox="0 0 190 100" role="img" aria-label="スペースキーを押す">
    <rect x="12" y="18" width="166" height="62" rx="12" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <g fill="${PALE}" stroke="${INK}" stroke-width="2.2">
        <rect x="24" y="28" width="18" height="14" rx="4"/>
        <rect x="48" y="28" width="18" height="14" rx="4"/>
        <rect x="72" y="28" width="18" height="14" rx="4"/>
        <rect x="96" y="28" width="18" height="14" rx="4"/>
        <rect x="120" y="28" width="18" height="14" rx="4"/>
        <rect x="144" y="28" width="22" height="14" rx="4"/>
    </g>
    <g class="press">
        <rect x="42" y="50" width="106" height="20" rx="7" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
        <text x="95" y="65" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff"
              font-family="sans-serif" letter-spacing="2">SPACE</text>
        <path d="M95 96 q-13 -8 -13 -20 a13 13 0 0 1 26 0 q0 12 -13 20 Z"
              fill="${SKIN}" stroke="${INK}" stroke-width="3" transform="translate(0,16)"/>
    </g>
</svg>`,

    // 文字を打つ課題。
    typing: () => `
<svg viewBox="0 0 200 150" role="img" aria-label="キーボードで文字を打つ人">
    <ellipse cx="100" cy="142" rx="76" ry="8" fill="${PALE}"/>
    ${body(100, 112, 32, BLUE)}
    ${face(100, 52, 25)}
    <rect x="48" y="116" width="104" height="22" rx="7" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <g fill="${PALE}" stroke="${INK}" stroke-width="1.8">
        <rect x="56" y="121" width="14" height="5" rx="2"/>
        <rect x="74" y="121" width="14" height="5" rx="2"/>
        <rect x="92" y="121" width="14" height="5" rx="2"/>
        <rect x="110" y="121" width="14" height="5" rx="2"/>
        <rect x="128" y="121" width="16" height="5" rx="2"/>
        <rect x="70" y="129" width="60" height="5" rx="2" fill="#bfe3f6"/>
    </g>
    <g class="type-hand"><circle cx="66" cy="114" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/></g>
    <g class="type-hand" style="animation-delay:.45s"><circle cx="134" cy="114" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/></g>
    <g fill="${BLUE}" font-family="sans-serif" font-size="17" font-weight="800">
        <text class="rise" x="160" y="74">A</text>
        <text class="rise rise-2" x="26" y="66">K</text>
        <text class="rise rise-3" x="172" y="50">I</text>
    </g>
</svg>`,

    // 音だけを聴く課題。
    listening: () => `
<svg viewBox="0 0 200 150" role="img" aria-label="耳をすまして音を待つ人">
    <ellipse cx="100" cy="142" rx="76" ry="8" fill="${PALE}"/>
    ${body(100, 136, 34, BLUE)}
    ${face(100, 60, 26)}
    <path d="M126 58 q12 -4 12 8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="140" cy="70" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
    ${waves(158, 62)}
    <circle class="wave" cx="40" cy="62" r="7" fill="${BLUE}"/>
    <text x="34" y="106" font-size="15" font-weight="800" fill="${BLUE}" font-family="sans-serif" class="blink">ピー</text>
</svg>`,

    // 本番。文字を打ちながら音にも答える。
    dual: () => `
<svg viewBox="0 0 230 150" role="img" aria-label="文字を打ちながら音を聞く人">
    <ellipse cx="112" cy="142" rx="88" ry="8" fill="${PALE}"/>
    ${body(112, 112, 32, BLUE)}
    ${face(112, 52, 25)}
    <rect x="60" y="116" width="104" height="22" rx="7" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <g fill="${PALE}" stroke="${INK}" stroke-width="1.8">
        <rect x="68" y="121" width="14" height="5" rx="2"/>
        <rect x="86" y="121" width="14" height="5" rx="2"/>
        <rect x="104" y="121" width="14" height="5" rx="2"/>
        <rect x="122" y="121" width="14" height="5" rx="2"/>
        <rect x="140" y="121" width="16" height="5" rx="2"/>
    </g>
    <rect x="82" y="129" width="60" height="5" rx="2" fill="#bfe3f6"/>
    <g class="type-hand"><circle cx="78" cy="114" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/></g>
    <g class="type-hand" style="animation-delay:.45s"><circle cx="146" cy="114" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/></g>
    <g fill="${BLUE}" font-family="sans-serif" font-size="16" font-weight="800">
        <text class="rise" x="170" y="100">A</text>
        <text class="rise rise-2" x="48" y="96">K</text>
    </g>
    <circle class="wave" cx="30" cy="48" r="9" fill="#9bb6c6"/>
    <circle class="wave wave-2" cx="30" cy="48" r="16" fill="none" stroke="#9bb6c6" stroke-width="3"/>
    <circle class="wave" cx="200" cy="44" r="9" fill="${BLUE}"/>
    <circle class="wave wave-2" cx="200" cy="44" r="16" fill="none" stroke="${BLUE}" stroke-width="3"/>
    <text x="200" y="22" text-anchor="middle" font-size="14" font-weight="800" fill="${BLUE}"
          font-family="sans-serif" class="blink">ピー</text>
    <text x="30" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="#9bb6c6" font-family="sans-serif">ゴー</text>
</svg>`,

    // 休憩。
    breakTea: () => `
<svg viewBox="0 0 130 110" role="img" aria-label="湯気の立つカップ">
    <g stroke="#bcd4e2" stroke-width="4" stroke-linecap="round" fill="none">
        <path class="steam" d="M52 40 q7 -8 0 -16"/>
        <path class="steam steam-2" d="M70 40 q7 -8 0 -16"/>
    </g>
    <path d="M34 50 h56 v22 a28 28 0 0 1 -56 0 Z" fill="#ffffff" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M90 56 q18 0 18 12 t-18 10" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M34 50 h56" stroke="${BLUE}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="62" cy="98" rx="38" ry="6" fill="${PALE}"/>
</svg>`,

    // 完了のチェック。
    check: () => `
<svg viewBox="0 0 120 110" role="img" aria-label="完了">
    <circle class="pop" cx="60" cy="55" r="40" fill="#35c47a"/>
    <path class="pop" d="M42 56 l13 13 l24 -27" fill="none" stroke="#ffffff" stroke-width="8"
          stroke-linecap="round" stroke-linejoin="round" style="animation-delay:.12s"/>
</svg>`,

    // ミスすると音が大きくなる。
    louder: () => `
<svg viewBox="0 0 130 110" role="img" aria-label="音が10デシベル大きくなる">
    <path d="M18 44 H34 L54 26 V84 L34 66 H18 Z" fill="#ffffff" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>
    <path class="rise" d="M74 72 V40 m0 0 l-9 10 m9 -10 l9 10" fill="none" stroke="#ff6b6b"
          stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="104" y="62" text-anchor="middle" font-size="16" font-weight="800" fill="#ff6b6b" font-family="sans-serif">+10</text>
</svg>`,

    // 全部おわった。
    celebrate: () => `
<svg viewBox="0 0 220 160" role="img" aria-label="セッション完了">
    <ellipse cx="110" cy="150" rx="70" ry="8" fill="${PALE}"/>
    ${body(110, 148, 34, BLUE)}
    ${face(110, 66, 26)}
    <path d="M80 112 L54 78" stroke="${INK}" stroke-width="7" stroke-linecap="round" class="bob"/>
    <path d="M140 112 L166 78" stroke="${INK}" stroke-width="7" stroke-linecap="round" class="bob"/>
    <g>
        <rect class="rise" x="36" y="50" width="9" height="9" rx="2" fill="${BLUE}"/>
        <rect class="rise rise-2" x="178" y="58" width="9" height="9" rx="2" fill="#ffc93c"/>
        <rect class="rise rise-3" x="60" y="34" width="9" height="9" rx="2" fill="#35c47a"/>
        <rect class="rise rise-2" x="152" y="30" width="9" height="9" rx="2" fill="#ff6b6b"/>
    </g>
</svg>`,

    // 画面のどこを見るか（ホームの説明用）。
    screenGuide: () => `
<svg viewBox="0 0 230 150" role="img" aria-label="画面の見かた">
    <rect x="16" y="14" width="198" height="112" rx="12" fill="#ffffff" stroke="${INK}" stroke-width="3.4"/>
    <rect x="30" y="26" width="52" height="18" rx="9" fill="#bfe3f6"/>
    <rect x="94" y="26" width="52" height="18" rx="9" fill="#bfe3f6"/>
    <rect x="158" y="26" width="42" height="18" rx="9" fill="#bfe3f6"/>
    <rect x="30" y="56" width="170" height="40" rx="9" fill="${PALE}" stroke="#bfe3f6" stroke-width="2.6"/>
    <text x="115" y="82" text-anchor="middle" font-size="18" font-weight="800" fill="${BLUE}" font-family="monospace">ka n ji</text>
    <rect x="76" y="104" width="78" height="12" rx="6" fill="${BLUE}" class="blink"/>
    <ellipse cx="115" cy="136" rx="66" ry="6" fill="${PALE}"/>
</svg>`
};

// ==========================================
// 進行バー
// ==========================================
const ICON = {
    key: `<svg viewBox="0 0 28 20"><rect x="1.5" y="2.5" width="25" height="15" rx="4" fill="#ffffff" stroke="currentColor" stroke-width="2"/><g fill="currentColor"><rect x="5" y="6" width="4" height="3" rx="1"/><rect x="12" y="6" width="4" height="3" rx="1"/><rect x="19" y="6" width="4" height="3" rx="1"/><rect x="8" y="12" width="12" height="3" rx="1.5"/></g></svg>`,
    sound: `<svg viewBox="0 0 28 20"><path d="M4 8h4l6-5v14l-6-5H4Z" fill="currentColor"/><path d="M19 6q3 4 0 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M23 3q5 7 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    rest: `<svg viewBox="0 0 28 20"><path d="M6 6h13v6a6.5 6.5 0 0 1-13 0Z" fill="#ffffff" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M19 8q4 0 4 3t-4 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 3q1.5-2 0-3M15 3q1.5-2 0-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" transform="translate(0,2)"/></svg>`,
    done: `<svg viewBox="0 0 28 20"><path d="M7 11l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

const UI_STEPS = [
    { key: 'howto',     mark: '▶', label: 'やり方をみる',   href: 'howto.html' },
    { key: 'calibrate', mark: '1', label: '音量を合わせる', href: 'calibrate.html' },
    { key: 'measure',   mark: '2', label: '聞こえ方をはかる', href: 'measure.html' },
    { key: 'game',      mark: '3', label: '本番セッション',  href: 'game.html' }
];

const UI = {
    ART,
    ICON,

    // 終わった段階を覚えておき、ホームと進行バーに印を出す。
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

    // #stepper に進行バーを描く。current は UI_STEPS の key。
    stepper(current) {
        const host = document.getElementById('stepper');
        if (!host) return;
        const currentIndex = UI_STEPS.findIndex((s) => s.key === current);
        const html = UI_STEPS.map((step, i) => {
            const done = UI.isDone(step.key) && i !== currentIndex;
            const state = i === currentIndex ? 'current' : (done ? 'done' : '');
            const mark = done ? '✓' : step.mark;
            const item = `
                <a class="stepper-item ${state}" href="${step.href}">
                    <span class="stepper-dot">${mark}</span>
                    <span>${step.label}</span>
                </a>`;
            const line = i < UI_STEPS.length - 1
                ? `<span class="stepper-line ${i < currentIndex ? 'done' : ''}"></span>`
                : '';
            return item + line;
        }).join('');
        host.innerHTML = html;
    },

    // data-art="hero" の要素にイラストを流し込む。
    paintArt(root = document) {
        root.querySelectorAll('[data-art]').forEach((el) => {
            const name = el.dataset.art;
            if (ART[name]) el.innerHTML = ART[name]();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.paintArt();
    const host = document.getElementById('stepper');
    if (host && host.dataset.current) UI.stepper(host.dataset.current);
});
