// ==========================================
// 設定・変数
// ==========================================
const AUDIO_PATHS = {
    noise: 'assets/noise/kankisen.mp3'
};

const TARGET_FREQ = TONE.FREQ;
const TARGET_TYPE = TONE.TYPE;

let audioCtx;
let currentVol = 0;
let isMeasuring = false;

let currentDB = 0;
const DB_STEP = 5;
const MIN_DB = 0;
const REF_DB = 60;
const TONE_DURATION = 0.5;
const PAUSE_DURATION = 1.0;
const DROP_DB = DB_STEP * 3;

// 同じ音量で2回押されたときだけ確定する
let lastKeyPressedDB = null;
let restartFrom = null;
let acceptingResponse = false;
let respondedThisTone = false;

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
    currentDB = MIN_DB;
    lastKeyPressedDB = null;
    restartFrom = null;
    acceptingResponse = false;
    respondedThisTone = false;
    els.btnStartMeasure.disabled = true;
    if (document.activeElement) document.activeElement.blur();

    if (els.stepCounter) {
        els.stepCounter.style.display = "block";
        els.stepCounter.textContent = "1";
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    if (!isMeasuring) return;

    while (isMeasuring && currentDB <= REF_DB) {
        respondedThisTone = false;
        acceptingResponse = true;
        showStep(currentDB);

        els.statusBox.textContent = "再生中...";
        els.statusBox.style.background = "#fff3cd";
        els.statusBox.style.color = "#856404";

        currentVol = TONE.dbToGain(currentDB);

        if (!isMeasuring) break;
        await playTone(currentVol, TONE_DURATION);

        if (!isMeasuring) break;
        els.statusBox.textContent = "待機中...";
        els.statusBox.style.background = "#22303f";
        els.statusBox.style.color = "#ecf0f1";

        await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION * 1000));
        acceptingResponse = false;
        if (!isMeasuring) break;

        if (restartFrom !== null) {
            currentDB = clampDb(restartFrom);
            restartFrom = null;
        } else if (currentDB >= REF_DB) {
            abortAtCeiling();
            break;
        } else {
            currentDB = clampDb(currentDB + DB_STEP);
        }
    }
    acceptingResponse = false;
}

function clampDb(db) {
    return Math.max(MIN_DB, Math.min(REF_DB, db));
}

function showStep(db) {
    if (!els.stepCounter) return;
    const step = (db / DB_STEP) + 1;
    els.stepCounter.textContent = String(Math.max(1, step));
}

function abortAtCeiling() {
    isMeasuring = false;
    acceptingResponse = false;
    restartFrom = null;
    els.statusBox.textContent = "上限の 60 dB まで大きくしても、スペースキーは押されませんでした。測定を中断しました。はじめからやり直してください。";
    els.statusBox.style.background = "#f8d7da";
    els.statusBox.style.color = "#721c24";
    if (els.stepCounter) els.stepCounter.style.display = "none";
    els.btnStartMeasure.disabled = false;
    els.btnStartMeasure.textContent = "もう一度測定する";
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
    const finalGain = TONE.dbToGain(db);

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
    if (e.code === 'Space' && isMeasuring) e.preventDefault();
}, true);

document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || !isMeasuring || !acceptingResponse || respondedThisTone) return;
    e.preventDefault();
    respondedThisTone = true;
    if (lastKeyPressedDB === currentDB) {
        finishMeasurement();
        return;
    }
    lastKeyPressedDB = currentDB;
    restartFrom = Math.max(MIN_DB, currentDB - DROP_DB);
});