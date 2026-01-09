// ==========================================
// 測定用スクリプト
// ==========================================
const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';

let audioCtx;
let osc = null;
let gain = null;
let rampTimer = null;
let currentVol = 0;
let isMeasuring = false;

const els = {
    btnStart: document.getElementById('btnStart'),
    statusBox: document.getElementById('statusBox'),
    resultPanel: document.getElementById('resultPanel'),
    resultValue: document.getElementById('resultValue')
};

// AudioContext初期化
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

els.btnStart.addEventListener('click', () => {
    initAudio();
    startMeasurement();
});

function startMeasurement() {
    isMeasuring = true;
    els.btnStart.disabled = true;
    els.statusBox.textContent = "シーン... (まもなく音が鳴ります)";

    // 2秒待機後に開始
    setTimeout(() => {
        if(!isMeasuring) return;

        els.statusBox.textContent = "測定中... 聞こえたらSPACE!";
        els.statusBox.style.background = "#fff3cd";
        els.statusBox.style.color = "#333";

        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();

        osc.type = TARGET_TYPE;
        osc.frequency.value = TARGET_FREQ;

        currentVol = 0;
        gain.gain.value = 0;

        osc.connect(gain).connect(audioCtx.destination);
        osc.start();

        // 音量上昇 (0.0005ずつ)
        rampTimer = setInterval(() => {
            currentVol += 0.0005;
            if (currentVol > 1.0) currentVol = 1.0;
            gain.gain.value = currentVol;
        }, 20);

    }, 2000);
}

function finishMeasurement() {
    isMeasuring = false;
    clearInterval(rampTimer);
    if(osc) osc.stop();

    const threshold = currentVol;

    // ■重要: 結果をブラウザに保存（ゲーム側で読み込むため）
    localStorage.setItem('userBaseThreshold', threshold);

    // 結果表示
    els.statusBox.textContent = "測定終了";
    els.statusBox.style.background = "#22303f";
    els.statusBox.style.color = "#ecf0f1";

    els.resultValue.textContent = threshold.toFixed(4);
    els.resultPanel.classList.remove('hidden');
}

// スペースキー判定
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isMeasuring && els.btnStart.disabled) {
        e.preventDefault();
        finishMeasurement();
    }
});
