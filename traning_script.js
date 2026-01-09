// --- 設定 ---
const TARGET_FREQ = 1000;    // トレーニングする音の周波数 (UD音なら1000Hz)
const TARGET_TYPE = 'sawtooth'; // 音色 ('sine' or 'sawtooth')
const SOUND_DURATION = 0.5;  // 音が鳴る長さ (秒)
const RESPONSE_WINDOW = 2000; // 音が鳴ってから反応を受け付ける時間 (ms)

// --- 変数 ---
let audioCtx;
let noiseBuffer = null;
let noiseSource = null;

// ゲーム状態
let currentLevelVol = 0.5; // 現在の音量 (0.0 ~ 1.0)
let streak = 0;            // 連続正解数
let isGameRunning = false;
let isWaitingForResponse = false; // 今、反応を受け付けているか
let feedbackTimer = null;
let gameLoopTimer = null;
let visualDistractionTimer = null;

// DOM要素
const els = {
    setupPanel: document.getElementById('setupPanel'),
    gamePanel: document.getElementById('gamePanel'),
    noiseInput: document.getElementById('noiseInput'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    volDisplay: document.getElementById('volDisplay'),
    streakDisplay: document.getElementById('streakDisplay'),
    feedbackMsg: document.getElementById('feedbackMsg'),
    randomNumber: document.getElementById('randomNumber')
};

// ==========================================
// 1. 初期化 & 準備
// ==========================================
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

els.noiseInput.addEventListener('change', async (e) => {
    initAudio();
    const file = e.target.files[0];
    if (!file) return;

    els.startBtn.textContent = "読み込み中...";
    const arrayBuffer = await file.arrayBuffer();
    noiseBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    els.startBtn.textContent = "トレーニング開始";
    els.startBtn.disabled = false;
});

// ==========================================
// 2. ゲーム開始処理
// ==========================================
els.startBtn.addEventListener('click', () => {
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');

    startTraining();
});

els.stopBtn.addEventListener('click', () => {
    stopTraining();
    els.setupPanel.classList.remove('hidden');
    els.gamePanel.classList.add('hidden');
});

function startTraining() {
    isGameRunning = true;
    currentLevelVol = 0.5; // 初期音量
    streak = 0;
    updateStatus();

    // ノイズ再生
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const nGain = audioCtx.createGain();
    nGain.gain.value = 0.5; // 背景ノイズ音量は固定
    noiseSource.connect(nGain).connect(audioCtx.destination);
    noiseSource.start();

    // 視覚的な妨害を開始
    startVisualDistraction();

    // ゲームループ開始
    scheduleNextSound();
}

function stopTraining() {
    isGameRunning = false;
    clearTimeout(gameLoopTimer);
    clearInterval(visualDistractionTimer);
    if (noiseSource) noiseSource.stop();
}

// ==========================================
// 3. ゲームループ (音出し -> 判定)
// ==========================================
function scheduleNextSound() {
    if (!isGameRunning) return;

    // メッセージリセット
    els.feedbackMsg.textContent = "---";
    els.feedbackMsg.className = "feedback-area";

    // 3秒 〜 7秒 のランダムな待機時間
    const delay = Math.random() * 4000 + 3000;

    gameLoopTimer = setTimeout(() => {
        playTargetSound();
    }, delay);
}

function playTargetSound() {
    if (!isGameRunning) return;

    // 音を生成
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = TARGET_TYPE;
    osc.frequency.value = TARGET_FREQ;

    gain.gain.value = currentLevelVol;

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + SOUND_DURATION); // 0.5秒で止める

    // 反応受付開始
    isWaitingForResponse = true;

    // 一定時間反応がなければ「聞き逃し」と判定
    // (SOUND_DURATION + 少し余裕を持たせる)
    setTimeout(() => {
        if (isWaitingForResponse) {
            // まだ反応フラグが立っている ＝ 押さなかった
            handleResult(false);
        }
    }, RESPONSE_WINDOW);
}

// ==========================================
// 4. ユーザーアクション & 結果判定
// ==========================================
document.body.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isWaitingForResponse) {
            handleResult(true);
        } else {
            // 音が鳴っていないのに押した (お手つき)
            // 今回はペナルティなしにするが、本来はここで減点しても良い
            console.log("Too early!");
        }
    }
});

function handleResult(isSuccess) {
    isWaitingForResponse = false; // 受付終了

    if (isSuccess) {
        // --- 正解 ---
        streak++;
        showFeedback("Good! 聞こえました", "feedback-good");

        // 3回連続正解したら、難易度アップ（音を小さく）
        if (streak >= 3) {
            currentLevelVol -= 0.05;
            if (currentLevelVol < 0.01) currentLevelVol = 0.01; // 下限
            streak = 0; // カウンタだけリセット
        }
    } else {
        // --- 聞き逃し ---
        streak = 0;
        showFeedback("Miss... 聞き逃しました", "feedback-miss");

        // 即座に難易度ダウン（音を大きく）
        currentLevelVol += 0.05;
        if (currentLevelVol > 1.0) currentLevelVol = 1.0;
    }

    updateStatus();

    // 次のラウンドへ
    scheduleNextSound();
}

// ==========================================
// 5. 演出・UI更新
// ==========================================
function updateStatus() {
    els.volDisplay.textContent = currentLevelVol.toFixed(2);
    els.streakDisplay.textContent = streak;
}

function showFeedback(text, cssClass) {
    els.feedbackMsg.textContent = text;
    els.feedbackMsg.className = "feedback-area " + cssClass;
}

// 視覚的妨害（ランダムな数字をパラパラ表示）
function startVisualDistraction() {
    visualDistractionTimer = setInterval(() => {
        const num = Math.floor(Math.random() * 99);
        els.randomNumber.textContent = num.toString().padStart(2, '0');
    }, 1000); // 1秒ごとに変更
}
