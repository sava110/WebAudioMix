// ==========================================
// 設定・変数
// ==========================================
const AUDIO_PATHS = {
    noise: 'assets/noise/kankisen.mp3'
};

const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sine';

let audioCtx;
let currentVol = 0;
let isMeasuring = false;

let currentDB = 0;
const DB_STEP = 5;
const REF_DB = 60;
const TONE_DURATION = 0.5;
const PAUSE_DURATION = 1.0;

// ★ベケシー法用の変数
let lastKeyPressedDB = null;

const els = {
    loadingPanel: document.getElementById('loadingPanel'),
    measurePanel: document.getElementById('measurePanel'),
    resultPanel: document.getElementById('resultPanel'),
    statusBox: document.getElementById('statusBox'),
    btnStartMeasure: document.getElementById('btnStartMeasure'),
    resultValue: document.getElementById('resultValue'),
    stepCounter: document.getElementById('stepCounter'),
    // 試行回数表示用（任意でHTMLに追加してください）
    trialInfo: document.getElementById('trialInfo') 
};

// --- 初期化ロジックは変更なし ---
window.onload = async () => {
    try {
        initAudio();
        await loadAudioFromPath(AUDIO_PATHS.noise);
        els.loadingPanel.classList.add('hidden');
        els.measurePanel.classList.remove('hidden');
    } catch (err) {
        alert("音声ファイルの読み込みに失敗しました。\n" + err);
    }
};

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

async function loadAudioFromPath(path) {
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

// ==========================================
// 閾値測定ロジック
// ==========================================
els.btnStartMeasure.addEventListener('click', startMeasurement);

async function startMeasurement() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isMeasuring = true;
    currentDB = 0;
    lastKeyPressedDB = null;
    els.btnStartMeasure.disabled = true;

    // 画面表示の更新
    if (els.stepCounter) {
        els.stepCounter.style.display = "block";
        els.stepCounter.textContent = "1";
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    while (isMeasuring && currentDB <= REF_DB) {
        const stepNumber = (currentDB / DB_STEP) + 1;
        if (els.stepCounter) els.stepCounter.textContent = stepNumber;

        els.statusBox.textContent = "再生中...";
        els.statusBox.style.background = "#fff3cd";
        els.statusBox.style.color = "#856404";

        currentVol = Math.pow(10, (currentDB - REF_DB) / 20);

        if (!isMeasuring) break;
        await playTone(currentVol, TONE_DURATION);

        if (!isMeasuring) break;
        els.statusBox.textContent = "待機中...";
        els.statusBox.style.background = "#22303f";
        els.statusBox.style.color = "#ecf0f1";

        await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION * 1000));
        currentDB += DB_STEP;
    }
}

function playTone(volume, duration) {
    return new Promise(resolve => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = TARGET_TYPE;
        osc.frequency.value = TARGET_FREQ;
        gain.gain.value = volume;
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        setTimeout(() => {
            osc.stop();
            osc.disconnect();
            resolve();
        }, duration * 1000);
    });
}

// ==========================================
// 判定・ループ処理
// ==========================================
function finishMeasurement() {
    isMeasuring = false;
    saveAndShowResult(currentDB);
}

function saveAndShowResult(db) {
    const finalGain = Math.pow(10, (db - REF_DB) / 20);

    localStorage.setItem('userBaseThresholdDB', db);
    localStorage.setItem('userBaseThresholdGain', finalGain);

    els.statusBox.textContent = "測定完了";
    if (els.stepCounter) els.stepCounter.style.display = "none";

    const finalStep = (db / DB_STEP) + 1;
    els.resultValue.innerHTML = `確定値: ${db} dB (Step: ${finalStep})`;

    els.measurePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isMeasuring && els.btnStartMeasure.disabled) {
        e.preventDefault();
        if (lastKeyPressedDB === currentDB) {
            finishMeasurement();
        } else {
            lastKeyPressedDB = currentDB;
            currentDB -= 20;
        }
    }
});