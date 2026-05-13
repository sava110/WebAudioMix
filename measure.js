// ==========================================
// 設定：ファイルパス
// ※HTMLと同じ場所にある 'assets' フォルダ内を想定
// ==========================================
const AUDIO_PATHS = {
    bgm: 'assets/bgm.mp3',   // 音楽ファイル名に合わせて変更してください
    noise: 'assets/fan.mp3'  // 換気扇ファイル名（今回は測定では使いませんが読み込みます）
};

const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';

// 変数
let audioCtx;
let buffers = { bgm: null, noise: null }; // 読み込んだデータを格納
let bgmSource = null;
let bgmGain = null;

let measureOsc = null;
let measureGain = null;
let rampTimer = null;
let currentVol = 0;
let isMeasuring = false;

let currentDB = 0;       // 現在のdB
const DB_STEP = 5;       // 5dB刻み
const REF_DB = 60;       // 基準（最大）となるdB
const TONE_DURATION = 0.5;  // 音が鳴る時間（秒）
const PAUSE_DURATION = 1.0; // 休憩時間（秒）
let isInterrupted = false; // 中断フラグ

// DOM要素
const els = {
    loadingPanel: document.getElementById('loadingPanel'),
    volumePanel: document.getElementById('volumePanel'),
    measurePanel: document.getElementById('measurePanel'),
    resultPanel: document.getElementById('resultPanel'),

    bgmStatus: document.getElementById('bgmStatus'),
    btnToggleBgm: document.getElementById('btnToggleBgm'),
    btnGoToMeasure: document.getElementById('btnGoToMeasure'),

    statusBox: document.getElementById('statusBox'),
    btnStartMeasure: document.getElementById('btnStartMeasure'),
    resultValue: document.getElementById('resultValue'),
    elStepCounter: document.getElementById('stepCounter'),
    stepCounter: document.getElementById('stepCounter'),
};

// ==========================================
// 初期化 & ファイル読み込み (自動実行)
// ==========================================
window.onload = async () => {
    try {
        initAudio();
        await loadAllAudioFiles();

        // 読み込み完了 -> 音量調整画面へ
        els.loadingPanel.classList.add('hidden');
        els.volumePanel.classList.remove('hidden');
    } catch (err) {
        alert("音声ファイルの読み込みに失敗しました。\nフォルダ構成やファイル名を確認してください。\n" + err);
        console.error(err);
    }
};

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// 指定パスからファイルをfetchしてデコード
async function loadAudioFromPath(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`File not found: ${path}`);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

async function loadAllAudioFiles() {
    // 並列で読み込み
    const [bgm, noise] = await Promise.all([
        loadAudioFromPath(AUDIO_PATHS.bgm),
        loadAudioFromPath(AUDIO_PATHS.noise)
    ]);
    buffers.bgm = bgm;
    buffers.noise = noise;
}

// ==========================================
// フェーズ1: 音量調整 (BGM)
// ==========================================
let isBgmPlaying = false;

els.btnToggleBgm.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (isBgmPlaying) {
        stopBGM();
    } else {
        playBGM();
    }
});

function playBGM() {
    if (bgmSource) stopBGM();

    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = buffers.bgm;
    bgmSource.loop = true; // ループ再生

    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.5; // BGMの基準音量

    bgmSource.connect(bgmGain).connect(audioCtx.destination);
    bgmSource.start();

    isBgmPlaying = true;
    els.btnToggleBgm.textContent = "音楽を停止";
    els.bgmStatus.textContent = "再生中... 音量を調整してください";
    els.bgmStatus.style.background = "#d4edda";
    els.bgmStatus.style.color = "#333";

    // 次へ進むボタンを有効化
    els.btnGoToMeasure.disabled = false;
}

function stopBGM() {
    if (bgmSource) {
        bgmSource.stop();
        bgmSource = null;
    }
    isBgmPlaying = false;
    els.btnToggleBgm.textContent = "音楽を再生";
    els.bgmStatus.textContent = "停止中";
    els.bgmStatus.style.background = "#22303f";
    els.bgmStatus.style.color = "#ecf0f1";
}

// 「測定へ進む」ボタン
els.btnGoToMeasure.addEventListener('click', () => {
    stopBGM(); // 念のため停止
    els.volumePanel.classList.add('hidden');
    els.measurePanel.classList.remove('hidden');
});

// ==========================================
// フェーズ2: 閾値測定 (Measure)
// ==========================================
els.btnStartMeasure.addEventListener('click', startMeasurement);

async function startMeasurement() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isMeasuring = true;
    currentDB = 0; 
    els.btnStartMeasure.disabled = true;

    // 測定開始時の初期表示
    if (els.stepCounter) {
        els.stepCounter.style.display = "block";
        els.stepCounter.textContent = "1";
    }
    els.statusBox.textContent = "まもなく開始します...";

    // 準備のための2秒待機
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ステップループ開始
    while (isMeasuring && currentDB <= REF_DB) {
        const stepNumber = (currentDB / DB_STEP) + 1;
        
        // 1. 数字を更新
        if (els.stepCounter) {
            els.stepCounter.textContent = stepNumber;
        }

        // 2. 「音が鳴っています」という表示に切り替え
        els.statusBox.textContent = "♪ 再生中... (聞こえたらSPACE)";
        els.statusBox.style.background = "#fff3cd"; // 少し色を変えて視認性を上げる
        els.statusBox.style.color = "#856404";

        // dBをGainに変換
        currentVol = Math.pow(10, (currentDB - REF_DB) / 20);

        // --- 音を鳴らす (0.5秒) ---
        if (!isMeasuring) break;
        await playTone(currentVol, TONE_DURATION);

        // 3. 「休憩中」という表示に切り替え
        if (!isMeasuring) break;
        els.statusBox.textContent = "待機中...";
        els.statusBox.style.background = "#22303f";
        els.statusBox.style.color = "#ecf0f1";

        // --- 休憩 (1.0秒) ---
        await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION * 1000));

        // 次のステップへ
        currentDB += DB_STEP;
    }
}
// 指定した音量と時間で音を鳴らす関数
function playTone(volume, duration) {
    return new Promise(resolve => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = TARGET_TYPE;
        osc.frequency.value = TARGET_FREQ;
        gain.gain.value = volume;

        osc.connect(gain).connect(audioCtx.destination);

        osc.start();
        
        // 指定時間後に停止
        setTimeout(() => {
            osc.stop();
            osc.disconnect();
            resolve(); // 終わったら次に進める
        }, duration * 1000);
    });
}

function finishMeasurement() {
    isMeasuring = false;
    
    // スペースを押した瞬間の数値を保存
    localStorage.setItem('userBaseThresholdDB', currentDB);
    localStorage.setItem('userBaseThresholdGain', currentVol);

    els.statusBox.textContent = "測定終了";
    if (els.stepCounter) {
        els.stepCounter.style.display = "none";
    }

    const finalStep = (currentDB / DB_STEP) + 1;
    els.resultValue.textContent = `${currentDB} dB (Step: ${finalStep})`;
    els.measurePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');
}
// スペースキー判定
document.addEventListener('keydown', (e) => {
    // 測定中のみ反応
    if (e.code === 'Space' && isMeasuring && els.btnStartMeasure.disabled) {
        e.preventDefault();
        finishMeasurement();
    }
});
