// ==========================================
// 設定・変数
// ==========================================
const AUDIO_PATHS = {
    noise: 'assets/noise/fan.mp3'
};

const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';

let audioCtx;
let currentVol = 0;
let isMeasuring = false;

let currentDB = 0;
const DB_STEP = 5;
const REF_DB = 60;
const TONE_DURATION = 0.5;
const PAUSE_DURATION = 1.0;

// ★履歴管理用の変数
let measurementHistory = []; 
let trialCount = 1;

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
    els.btnStartMeasure.disabled = true;

    // 画面表示の更新
    if (els.stepCounter) {
        els.stepCounter.style.display = "block";
        els.stepCounter.textContent = "1";
    }
    
    // 何回目の試行かを表示
    els.statusBox.textContent = `【第 ${trialCount} 回目】まもなく開始します...`;
    if(els.trialInfo) els.trialInfo.textContent = `試行回数: ${trialCount}`;

    await new Promise(resolve => setTimeout(resolve, 2000));

    while (isMeasuring && currentDB <= REF_DB) {
        const stepNumber = (currentDB / DB_STEP) + 1;
        if (els.stepCounter) els.stepCounter.textContent = stepNumber;

        els.statusBox.textContent = `第 ${trialCount} 回：再生中...`;
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
    
    // 今回のdBを履歴に追加
    measurementHistory.push(currentDB);
    
    // 同じ値が2回出ているかチェック
    const confirmedDB = checkConsistency(measurementHistory);

    if (confirmedDB !== null) {
        // --- 確定：結果表示へ ---
        saveAndShowResult(confirmedDB);
    } else {
        // --- 未確定：もう一度測定 ---
        trialCount++;
        prepareNextTrial();
    }
}

// 履歴の中に2回以上出現する値があるか確認する関数
function checkConsistency(history) {
    const counts = {};
    for (const db of history) {
        counts[db] = (counts[db] || 0) + 1;
        if (counts[db] >= 2) return db;
    }
    return null;
}

function prepareNextTrial() {
    els.statusBox.textContent = `${currentDB}dB で反応がありました。確認のためもう一度測定します。`;
    els.statusBox.style.background = "#d1ecf1";
    els.statusBox.style.color = "#0c5460";
    
    // ボタンを再度有効にして、ユーザーのタイミングで次へ進めるようにする
    els.btnStartMeasure.disabled = false;
    els.btnStartMeasure.textContent = `第 ${trialCount} 回目を開始`;
}

function saveAndShowResult(db) {
    // 確定したGain値も再計算
    const finalGain = Math.pow(10, (db - REF_DB) / 20);
    
    localStorage.setItem('userBaseThresholdDB', db);
    localStorage.setItem('userBaseThresholdGain', finalGain);

    els.statusBox.textContent = "測定完了";
    if (els.stepCounter) els.stepCounter.style.display = "none";

    const finalStep = (db / DB_STEP) + 1;
    els.resultValue.innerHTML = `確定値: ${db} dB (Step: ${finalStep})<br><small>全試行履歴: ${measurementHistory.join(', ')}</small>`;
    
    els.measurePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isMeasuring && els.btnStartMeasure.disabled) {
        e.preventDefault();
        finishMeasurement();
    }
});