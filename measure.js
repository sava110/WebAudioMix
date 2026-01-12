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
    resultValue: document.getElementById('resultValue')
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

function startMeasurement() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isMeasuring = true;
    els.btnStartMeasure.disabled = true;
    els.statusBox.textContent = "シーン... (まもなく検査音が鳴ります)";

    // 2秒待機後に開始
    setTimeout(() => {
        if(!isMeasuring) return;

        els.statusBox.textContent = "測定中... 聞こえたらSPACE!";
        els.statusBox.style.background = "#fff3cd";
        els.statusBox.style.color = "#333";

        measureOsc = audioCtx.createOscillator();
        measureGain = audioCtx.createGain();

        measureOsc.type = TARGET_TYPE;
        measureOsc.frequency.value = TARGET_FREQ;

        currentVol = 0;
        measureGain.gain.value = 0;

        measureOsc.connect(measureGain).connect(audioCtx.destination);
        measureOsc.start();

        // 音量上昇 (0.0005ずつ)
        rampTimer = setInterval(() => {
            currentVol += 0.0005;
            if (currentVol > 1.0) currentVol = 1.0;
            measureGain.gain.value = currentVol;
        }, 20);

    }, 2000);
}

function finishMeasurement() {
    isMeasuring = false;
    clearInterval(rampTimer);
    if(measureOsc) measureOsc.stop();

    const threshold = currentVol;

    // 結果を保存
    localStorage.setItem('userBaseThreshold', threshold);

    // 結果表示
    els.statusBox.textContent = "測定終了";
    els.statusBox.style.background = "#22303f";
    els.statusBox.style.color = "#ecf0f1";

    els.resultValue.textContent = threshold.toFixed(4);
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
