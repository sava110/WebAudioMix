// ==========================================
// 設定
// ==========================================
const WORD_LIST = [
    "kitchen", "cooking", "knife", "onion", "carrot",
    "potato", "boil", "fry", "pan", "dish", "plate",
    "water", "salt", "sugar", "pepper", "meat", "fish",
    "oven", "grill", "spoon", "fork", "salad", "soup",
    "lunch", "dinner", "breakfast", "bread", "rice"
];

const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';
const SOUND_DURATION = 0.5;
const RESPONSE_WINDOW = 2000;

// ==========================================
// 変数
// ==========================================
let audioCtx;
let noiseBuffer = null;
let noiseSource = null;

// ゲーム状態
let currentLevelVol = 0.5; // 聴覚難易度 (音量)
let hearingStreak = 0;     // 聴覚連続正解
let typingScore = 0;

// タイピング状態
let currentWord = "";
let charIndex = 0; // 今何文字目を打っているか

// 制御フラグ
let isGameRunning = false;
let isWaitingForHearingResponse = false;
let hearingTimer = null; // 次の音が鳴るまでのタイマー
let reactionTimeout = null; // 反応待ち時間のタイマー

// DOM要素
const els = {
    setupPanel: document.getElementById('setupPanel'),
    gamePanel: document.getElementById('gamePanel'),
    noiseInput: document.getElementById('noiseInput'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    volDisplay: document.getElementById('volDisplay'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    wordDisplay: document.getElementById('wordDisplay'),
    hearingFeedback: document.getElementById('hearingFeedback')
};

// ==========================================
// 音声エンジン & 準備
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
    els.startBtn.textContent = "ゲームスタート";
    els.startBtn.disabled = false;
});

// ==========================================
// ゲーム開始・終了
// ==========================================
els.startBtn.addEventListener('click', () => {
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
    startDualTask();
});

els.stopBtn.addEventListener('click', () => {
    stopDualTask();
    els.setupPanel.classList.remove('hidden');
    els.gamePanel.classList.add('hidden');
});

function startDualTask() {
    isGameRunning = true;
    currentLevelVol = 0.5;
    hearingStreak = 0;
    typingScore = 0;
    updateStats();

    // ノイズ再生
    playNoiseLoop();

    // タイピング問題作成
    nextWord();

    // 聴覚刺激スケジュール開始
    scheduleNextSound();
}

function stopDualTask() {
    isGameRunning = false;
    clearTimeout(hearingTimer);
    clearTimeout(reactionTimeout);
    if (noiseSource) noiseSource.stop();
}

function playNoiseLoop() {
    if(noiseSource) try{noiseSource.stop()}catch(e){}
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.5; // ノイズ音量
    noiseSource.connect(gain).connect(audioCtx.destination);
    noiseSource.start();
}

// ==========================================
// タイピング機能
// ==========================================
function nextWord() {
    // ランダムに単語を選ぶ
    currentWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    charIndex = 0;
    renderWord();
}

function renderWord() {
    // HTML生成: <span class="typed">coo</span><span class="untyped">king</span>
    const typedPart = currentWord.substring(0, charIndex);
    const untypedPart = currentWord.substring(charIndex);

    els.wordDisplay.innerHTML =
        `<span class="typed-char">${typedPart}</span>` +
        `<span class="untyped-char">${untypedPart}</span>`;
}

function checkTyping(key) {
    if (!isGameRunning) return;

    // 次に打つべき文字（小文字変換）
    const targetChar = currentWord[charIndex].toLowerCase();

    if (key.toLowerCase() === targetChar) {
        // 正解
        charIndex++;
        typingScore += 10; // スコア加算
        renderWord();
        updateStats();

        // 単語完成？
        if (charIndex >= currentWord.length) {
            typingScore += 50; // ボーナス
            setTimeout(nextWord, 200); // 少し待って次の単語
        }
    }
}

// ==========================================
// 聴覚トレーニング機能
// ==========================================
function scheduleNextSound() {
    if (!isGameRunning) return;

    // 3〜8秒後に音が鳴る
    const delay = Math.random() * 5000 + 3000;

    hearingTimer = setTimeout(() => {
        playSoundEffect();
    }, delay);
}

function playSoundEffect() {
    if (!isGameRunning) return;

    // 音作成
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = TARGET_TYPE;
    osc.frequency.value = TARGET_FREQ;
    gain.gain.value = currentLevelVol;

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + SOUND_DURATION);

    // 反応待ち状態へ
    isWaitingForHearingResponse = true;

    // タイムアウト判定
    reactionTimeout = setTimeout(() => {
        if (isWaitingForHearingResponse) {
            handleHearingResult(false); // 時間切れ
        }
    }, RESPONSE_WINDOW);
}

function handleHearingResult(success) {
    isWaitingForHearingResponse = false;
    clearTimeout(reactionTimeout);

    const fb = els.hearingFeedback;
    fb.className = "feedback-visible"; // アニメーション用クラスリセット

    if (success) {
        fb.textContent = "HEARING OK!";
        fb.classList.add("fb-good");
        hearingStreak++;

        // 難易度調整（音を小さく）
        if (hearingStreak >= 2) { // 2回連続正解でレベルアップ
            currentLevelVol -= 0.05;
            if (currentLevelVol < 0.01) currentLevelVol = 0.01;
            hearingStreak = 0;
        }
    } else {
        fb.textContent = "HEARING MISS...";
        fb.classList.add("fb-miss");
        hearingStreak = 0;

        // 難易度調整（音を大きく）
        currentLevelVol += 0.05;
        if (currentLevelVol > 1.0) currentLevelVol = 1.0;
    }

    updateStats();

    // フィードバックを1秒後に消す
    setTimeout(() => {
        fb.classList.remove("feedback-visible", "fb-good", "fb-miss");
    }, 1000);

    // 次のスケジュール
    scheduleNextSound();
}

// ==========================================
// キー入力ハンドリング（全体）
// ==========================================
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;

    // スペースキー -> 聴覚反応
    if (e.code === 'Space') {
        e.preventDefault(); // スクロール防止
        if (isWaitingForHearingResponse) {
            handleHearingResult(true);
        } else {
            // お手つき（音が鳴ってないのに押した）
            // ここでは特に罰則なし、またはログ出力のみ
            console.log("Empty Space Push");
        }
        return;
    }

    // A-Zキー -> タイピング
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        checkTyping(e.key);
    }
});

function updateStats() {
    els.volDisplay.textContent = currentLevelVol.toFixed(2);
    els.scoreDisplay.textContent = typingScore;
}
