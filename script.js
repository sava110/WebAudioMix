// --- 設定値 ---
const FREQUENCIES = [1000, 4000]; // 測定する周波数セット (Hz)
const RAMP_SPEED = 0.0005;        // 音量が上がる速さ (小さいほどゆっくり)
const RAMP_INTERVAL = 20;         // 更新間隔 (ms)

// --- グローバル変数 ---
let audioCtx;
let bgmBuffer = null;
let noiseBuffer = null;

let bgmSource = null;
let noiseSource = null;
let signalOscillator = null;
let signalGain = null;

// 実験ステート管理
let currentPhase = 'QUIET'; // 'QUIET' or 'NOISE'
let freqIndex = 0;          // 現在何番目の周波数をテスト中か
let results = {             // 結果保存用
    quiet: {},
    noise: {}
};

let waitTimer = null;
let rampTimer = null;
let currentVol = 0;
let isMeasuring = false;

// --- DOM要素の取得 ---
const els = {
    step0: document.getElementById('step0'),
    step1: document.getElementById('step1'),
    expStep: document.getElementById('experimentStep'),
    step4: document.getElementById('step4'),

    bgmInput: document.getElementById('bgmInput'),
    noiseInput: document.getElementById('noiseInput'),
    step0Btn: document.getElementById('step0Btn'),

    playBgmBtn: document.getElementById('playBgmBtn'),
    step1NextBtn: document.getElementById('step1NextBtn'),

    expTitle: document.getElementById('expTitle'),
    expInstruction: document.getElementById('expInstruction'),
    statusBox: document.getElementById('statusBox'),
    currentFreqDisplay: document.getElementById('currentFreqDisplay'),
    progressDisplay: document.getElementById('progressDisplay'),
    startTestBtn: document.getElementById('startTestBtn'),
    reactionBtn: document.getElementById('reactionBtn'),

    resultArea: document.getElementById('resultArea'),
    downloadBtn: document.getElementById('downloadBtn')
};

// ============================================
// 音声エンジンの初期化
// ============================================
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// ファイル読み込みヘルパー
async function loadAudioFile(file) {
    initAudio();
    const arrayBuffer = await file.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

// ============================================
// STEP 0: ファイル選択
// ============================================
// 両方のファイルが選択されたらボタン有効化
function checkFiles() {
    if (els.bgmInput.files[0] && els.noiseInput.files[0]) {
        els.step0Btn.disabled = false;
    }
}
els.bgmInput.addEventListener('change', checkFiles);
els.noiseInput.addEventListener('change', checkFiles);

els.step0Btn.addEventListener('click', async () => {
    els.step0Btn.textContent = "読み込み中...";
    try {
        bgmBuffer = await loadAudioFile(els.bgmInput.files[0]);
        noiseBuffer = await loadAudioFile(els.noiseInput.files[0]);

        // 画面遷移
        els.step0.classList.add('hidden');
        els.step1.classList.remove('hidden');
    } catch (e) {
        alert("音声ファイルの読み込みに失敗しました。ファイルを確認してください。");
        console.error(e);
    }
});

// ============================================
// STEP 1: BGM調整 (MCL)
// ============================================
let isBgmPlaying = false;

els.playBgmBtn.addEventListener('click', () => {
    initAudio();
    if (isBgmPlaying) {
        if (bgmSource) bgmSource.stop();
        isBgmPlaying = false;
        els.playBgmBtn.textContent = "音楽 再生";
    } else {
        bgmSource = audioCtx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;
        // BGM用Gain
        const gain = audioCtx.createGain();
        gain.gain.value = 0.5; // 適度な初期値

        bgmSource.connect(gain).connect(audioCtx.destination);
        bgmSource.start();
        isBgmPlaying = true;
        els.playBgmBtn.textContent = "音楽 停止";
    }
});

els.step1NextBtn.addEventListener('click', () => {
    if (isBgmPlaying) {
        bgmSource.stop();
        isBgmPlaying = false;
    }
    // 実験フェーズへ移行
    setupExperimentPhase('QUIET');
});

// ============================================
// STEP 2 & 3: 実験ループ処理
// ============================================

function setupExperimentPhase(phase) {
    currentPhase = phase;
    freqIndex = 0; // 周波数カウンタをリセット

    // 前の画面を隠して実験画面を表示
    els.step1.classList.add('hidden');
    els.expStep.classList.remove('hidden');

    // UIの表示更新
    updateUIForNextTrial();

    if (phase === 'QUIET') {
        els.expTitle.textContent = "STEP 2: 静寂時検査";
        els.expInstruction.innerHTML = "静かな状態で測定します。<br>開始ボタンを押してください。";
        // ノイズ停止（念のため）
        if (noiseSource) try{ noiseSource.stop() } catch(e){}
    } else {
        els.expTitle.textContent = "STEP 3: ノイズ下検査";
        els.expInstruction.innerHTML = "換気扇の音が流れます。<br>音が聞き取りにくくなりますが、集中してください。";
        // ノイズ再生開始
        playNoiseLoop();
    }
}

function updateUIForNextTrial() {
    els.startTestBtn.classList.remove('hidden');
    els.reactionBtn.classList.add('hidden');
    els.statusBox.textContent = "待機中";
    els.statusBox.style.backgroundColor = "#e9ecef";

    const currentHz = FREQUENCIES[freqIndex];
    els.currentFreqDisplay.textContent = currentHz;
    els.progressDisplay.textContent = `${freqIndex + 1}/${FREQUENCIES.length}`;
}

// 検査開始ボタン
els.startTestBtn.addEventListener('click', () => {
    initAudio();
    els.startTestBtn.classList.add('hidden');
    els.reactionBtn.classList.remove('hidden');

    els.statusBox.textContent = "シーン... (まもなく音が鳴ります)";
    els.statusBox.style.backgroundColor = "#fff3cd"; // 黄色っぽい色

    // ランダムな待機時間 (2000ms ~ 4000ms)
    const delay = 2000 + Math.random() * 2000;

    waitTimer = setTimeout(startSignalRamp, delay);
});

// 音を鳴らし始める処理
function startSignalRamp() {
    isMeasuring = true;
    els.statusBox.textContent = "測定中... (聞こえたらSPACE!)";
    els.statusBox.style.backgroundColor = "#d4edda"; // 緑っぽい色

    const freq = FREQUENCIES[freqIndex];

    // シグナル生成
    signalOscillator = audioCtx.createOscillator();
    signalOscillator.type = 'sine';
    signalOscillator.frequency.value = freq;

    signalGain = audioCtx.createGain();
    signalGain.gain.value = 0; // 無音からスタート
    currentVol = 0;

    signalOscillator.connect(signalGain).connect(audioCtx.destination);
    signalOscillator.start();

    // 音量上昇ループ
    rampTimer = setInterval(() => {
        currentVol += RAMP_SPEED;
        // 上限ガード
        if (currentVol > 1.0) currentVol = 1.0;
        signalGain.gain.value = currentVol;
    }, RAMP_INTERVAL);
}

// 反応があった時の処理 (ボタンクリック or Spaceキー)
function recordReaction() {
    if (!isMeasuring) return; // 測定中でなければ無視

    // 1. 停止
    isMeasuring = false;
    clearTimeout(waitTimer);
    clearInterval(rampTimer);
    if (signalOscillator) signalOscillator.stop();

    // 2. 記録
    const freq = FREQUENCIES[freqIndex];
    if (currentPhase === 'QUIET') {
        results.quiet[freq] = currentVol;
    } else {
        results.noise[freq] = currentVol;
    }

    console.log(`Phase: ${currentPhase}, Freq: ${freq}, Threshold: ${currentVol}`);

    // 3. 次へ進む判定
    freqIndex++;
    if (freqIndex < FREQUENCIES.length) {
        // まだ次の周波数がある場合
        updateUIForNextTrial();
    } else {
        // このフェーズの全周波数が終わった場合
        if (currentPhase === 'QUIET') {
            // STEP 2 終了 -> STEP 3へ
            alert("静寂時の検査が終了しました。\n次はノイズ（換気扇の音）環境下で同じ検査を行います。");
            setupExperimentPhase('NOISE');
        } else {
            // STEP 3 終了 -> 結果画面へ
            if (noiseSource) noiseSource.stop();
            finishExperiment();
        }
    }
}

// イベントリスナー: 反応ボタン
els.reactionBtn.addEventListener('click', recordReaction);

// イベントリスナー: スペースキー
document.body.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // スクロール防止
        // 実験画面が表示されており、かつ測定開始ボタンが隠れている(＝測定モード)ときのみ有効
        if (!els.expStep.classList.contains('hidden') && els.startTestBtn.classList.contains('hidden')) {
            recordReaction();
        }
    }
});

// ノイズ再生ヘルパー
function playNoiseLoop() {
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const nGain = audioCtx.createGain();
    nGain.gain.value = 0.5; // 音量 (STEP1で調整済みと仮定して固定値、あるいは微調整可)

    noiseSource.connect(nGain).connect(audioCtx.destination);
    noiseSource.start();
}


// ============================================
// STEP 4: 結果表示・CSV出力
// ============================================
function finishExperiment() {
    els.expStep.classList.add('hidden');
    els.step4.classList.remove('hidden');

    // テキストエリアに表示
    let log = "--- 実験結果 ---\n";
    log += "Frequency(Hz), Quiet_Gain, Noise_Gain, Masking_Amount\n";

    let csv = "Frequency(Hz),Quiet_Gain,Noise_Gain,Masking_Amount\n";

    FREQUENCIES.forEach(freq => {
        const qVal = results.quiet[freq] || 0;
        const nVal = results.noise[freq] || 0;
        const diff = nVal - qVal;

        const rowString = `${freq}, ${qVal.toFixed(4)}, ${nVal.toFixed(4)}, ${diff.toFixed(4)}`;
        log += rowString + "\n";
        csv += `${freq},${qVal.toFixed(4)},${nVal.toFixed(4)},${diff.toFixed(4)}\n`;
    });

    els.resultArea.value = log;

    // CSVダウンロード設定
    els.downloadBtn.onclick = () => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "experiment_result.csv";
        a.click();
    };
}
