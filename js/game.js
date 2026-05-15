// ==========================================
// 設定：内部ファイルパス・定数
// ==========================================
const NOISE_FILE_PATH = 'assets/noise/fan.mp3';
const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';
const SOUND_DURATION = 0.5;
const RESPONSE_WINDOW = 2000;

// dB計算用の定数
const REF_DB = 60;       // 基準（最大）となるdB
const START_OFFSET = 15; // 閾値から何dB上で始めるか
const STEP_DB = 5;       // 成功時に下げるdB

// 単語リスト
const WORD_LIST = [
    { romaji: 'atatakaiharunohi', jp: 'あたたかい春の日' },
    { romaji: 'kireinaumiwomiru', jp: 'きれいな海を見る' },
    { romaji: 'midorinokiwoueru', jp: '緑の木を植える' },
    { romaji: 'takaiyamaninoboru', jp: '高い山に登る' },
    { romaji: 'hiroisorawotobu', jp: '広い空を飛ぶ' },
    { romaji: 'amaikudamonowokau', jp: '甘い果物を買う' },
    { romaji: 'kodomogawarau', jp: '子供が笑う' },
    { romaji: 'akaruiasagakuru', jp: '明るい朝が来る' },
    { romaji: 'yumenonakadeasobu', jp: '夢の中で遊ぶ' },
    { romaji: 'tokeiwomiru', jp: '時計を見る' }
];

// 変数
let audioCtx;
let noiseBuffer = null;
let noiseSource = null;
let noiseGain = null;

// dBベースの変数
let baseThresholdDB = 0; // Step 1で保存したdB値
let currentDB = 0;       // 現在のdBレベル

// ゲーム状態
let currentLevelVol = 0.05; // 最終的にOscillatorに渡すGain値
let typingScore = 0;
let isGameRunning = false;
let isWaitingForResponse = false;
let startTime = 0;

// 結果記録用
let minSuccessfulDB = null;
let totalHits = 0;

// タイマー・タイピング変数
let hearingTimer = null;
let reactionTimeout = null;
let currentWordObj = null;
let charIndex = 0;

// DOM要素
const els = {
    setupPanel: document.getElementById('setupPanel'),
    gamePanel: document.getElementById('gamePanel'),
    resultPanel: document.getElementById('resultPanel'),
    loadStatus: document.getElementById('loadStatus'),
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),
    btnDownloadCsv: document.getElementById('btnDownloadCsv'),
    limitDisplay: document.getElementById('limitDisplay'),
    dispBaseThreshold: document.getElementById('dispBaseThreshold'),
    dispCurrentVol: document.getElementById('dispCurrentVol'),
    dispScore: document.getElementById('dispScore'),
    romajiDisplay: document.getElementById('romajiDisplay'),
    japaneseDisplay: document.getElementById('japaneseDisplay'),
    hearingFeedback: document.getElementById('hearingFeedback'),
    resBase: document.getElementById('resBase'),
    resTrain: document.getElementById('resTrain'),
    resDiff: document.getElementById('resDiff'),
    resScore: document.getElementById('resScore'),
    resHits: document.getElementById('resHits')
};

// ==========================================
// 初期化：環境音ロードとdBの取得
// ==========================================
window.onload = async () => {
    // 1. LocalStorageからdB値を読み込み
    const savedDB = localStorage.getItem('userBaseThresholdDB');
    if (savedDB) {
        baseThresholdDB = parseFloat(savedDB);
        els.limitDisplay.textContent = `${baseThresholdDB} dB`;
        els.dispBaseThreshold.textContent = `${baseThresholdDB} dB`;
    } else {
        els.limitDisplay.textContent = "未測定 (初期値: 20dB)";
        baseThresholdDB = 20;
    }

    // 2. 音声ファイルのロード
    try {
        initAudio();
        els.loadStatus.textContent = "環境音を読み込み中...";
        noiseBuffer = await loadAudioFromPath(NOISE_FILE_PATH);
        els.loadStatus.textContent = "環境音の準備完了 ✅";
        els.loadStatus.style.color = "#2ecc71";
        els.btnStart.disabled = false;
    } catch (err) {
        els.loadStatus.textContent = "環境音の読み込みに失敗しました。";
        els.loadStatus.style.color = "#e74c3c";
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

// dBをGain（0.0-1.0）に変換する関数
function dbToGain(db) {
    // 60dB = 1.0 (REF_DB)
    return Math.pow(10, (db - REF_DB) / 20);
}

// ==========================================
// ゲームロジック
// ==========================================
els.btnStart.addEventListener('click', startGame);
els.btnStop.addEventListener('click', () => finishGame(false));

function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');

    isGameRunning = true;
    startTime = Date.now();

    // 初期レベル：測定閾値 + 15dB
    currentDB = baseThresholdDB + START_OFFSET;
    if (currentDB > REF_DB) currentDB = REF_DB;

    typingScore = 0;
    totalHits = 0;
    minSuccessfulDB = null;

    updateStats();
    playNoiseLoop();
    nextWord();
    scheduleNextSound();
}

function playNoiseLoop() {
    if (noiseSource) try { noiseSource.stop(); } catch (e) { }
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 3.0; // 固定ノイズレベル
    noiseSource.connect(noiseGain).connect(audioCtx.destination);
    noiseSource.start();
}

function scheduleNextSound() {
    if (!isGameRunning) return;
    const delay = Math.random() * 4000 + 3000;
    hearingTimer = setTimeout(playSoundEffect, delay);
}

function playSoundEffect() {
    if (!isGameRunning) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = TARGET_TYPE;
    osc.frequency.value = TARGET_FREQ;
    
    // 現在のdBをGainに変換してセット
    currentLevelVol = dbToGain(currentDB);
    gain.gain.value = currentLevelVol;

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + SOUND_DURATION);

    isWaitingForResponse = true;
    reactionTimeout = setTimeout(() => {
        if (isWaitingForResponse) handleHearingResult(false);
    }, RESPONSE_WINDOW);
}

function handleHearingResult(success) {
    isWaitingForResponse = false;
    clearTimeout(reactionTimeout);
    const fb = els.hearingFeedback;
    fb.className = "feedback-visible";

    if (success) {
        fb.textContent = "HEARING OK!";
        fb.classList.add("fb-good");
        totalHits++;

        // 成功したdB値を記録
        minSuccessfulDB = currentDB;

        // 次のレベルへ：5dB下げる
        currentDB -= STEP_DB;
        if (currentDB < 0) currentDB = 0;

        updateStats();
        setTimeout(() => fb.classList.remove("feedback-visible", "fb-good"), 1000);
        scheduleNextSound();
    } else {
        fb.textContent = "GAME OVER...";
        fb.classList.add("fb-miss");
        setTimeout(() => finishGame(true), 1500);
    }
}

// ==========================================
// ゲーム終了 & 結果表示
// ==========================================
function finishGame(isGameOver) {
    isGameRunning = false;
    clearTimeout(hearingTimer);
    clearTimeout(reactionTimeout);
    if (noiseSource) noiseSource.stop();

    els.gamePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');

    const finalTrainDB = (minSuccessfulDB !== null) ? minSuccessfulDB : currentDB;
    const dbDiff = finalTrainDB - baseThresholdDB;

    els.resBase.textContent = `${baseThresholdDB} dB`;
    els.resTrain.textContent = `${finalTrainDB} dB`;
    els.resDiff.textContent = `${dbDiff > 0 ? "+" : ""}${dbDiff} dB`;
    els.resScore.textContent = typingScore;
    els.resHits.textContent = totalHits;

    setupCsvDownload(finalTrainDB, dbDiff);
}

function setupCsvDownload(finalDB, diff) {
    els.btnDownloadCsv.onclick = () => {
        const timestamp = new Date().toLocaleString();
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Timestamp,Base_dB,Final_Training_dB,Diff_dB,Typing_Score,Total_Hits\n";
        csvContent += `${timestamp},${baseThresholdDB},${finalDB},${diff},${typingScore},${totalHits}\n`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `result_${finalDB}dB.csv`);
        document.body.appendChild(link);
        link.click();
    };
}

// --- タイピング・ユーティリティ (変更なし) ---
function nextWord() {
    currentWordObj = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    charIndex = 0;
    renderWord();
}
function renderWord() {
    const romaji = currentWordObj.romaji;
    els.romajiDisplay.innerHTML = `<span class="typed-char">${romaji.substring(0, charIndex)}</span><span class="untyped-char">${romaji.substring(charIndex)}</span>`;
    els.japaneseDisplay.textContent = currentWordObj.jp;
}
function checkTyping(key) {
    if (!isGameRunning) return;
    if (key.toLowerCase() === currentWordObj.romaji[charIndex]) {
        charIndex++;
        typingScore += 10;
        if (charIndex >= currentWordObj.romaji.length) {
            typingScore += 50;
            setTimeout(nextWord, 100);
        }
        renderWord();
    }
    updateStats();
}
function updateStats() {
    els.dispCurrentVol.textContent = `${currentDB} dB`;
    els.dispScore.textContent = typingScore;
}
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    if (e.code === 'Space') {
        e.preventDefault();
        handleHearingResult(isWaitingForResponse);
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        checkTyping(e.key);
    }
});