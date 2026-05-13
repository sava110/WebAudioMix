// ==========================================
// 設定：内部ファイルパス
// ==========================================
const NOISE_FILE_PATH = 'assets/noise/fan.mp3';
const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';
const SOUND_DURATION = 0.5;
const RESPONSE_WINDOW = 2000;

// 単語リスト (省略せずそのまま使用してください)
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
    // ... 必要に応じて追加
];

// 変数
let audioCtx;
let noiseBuffer = null;
let noiseSource = null;
let noiseGain = null;
let baseThreshold = 0.05; // デフォルト値

// ゲーム状態
let currentLevelVol = 0.5;
let hearingStreak = 0;
let typingScore = 0;
let isGameRunning = false;
let isWaitingForResponse = false;
let startTime = 0;

// 結果記録用
let minSuccessfulVol = null;
let totalHits = 0;

// タイマー
let hearingTimer = null;
let reactionTimeout = null;

// タイピング
let currentWordObj = null;
let charIndex = 0;

// DOM要素
const els = {
    setupPanel: document.getElementById('setupPanel'),
    gamePanel: document.getElementById('gamePanel'),
    resultPanel: document.getElementById('resultPanel'),
    loadStatus: document.getElementById('loadStatus'), // ★htmlに追加した要素
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
// 初期化：環境音の自動ロード
// ==========================================
window.onload = async () => {
    // 1. LocalStorageから閾値を読み込み
    const saved = localStorage.getItem('userBaseThresholdGain');
    if (saved) {
        baseThreshold = parseFloat(saved);
        els.limitDisplay.textContent = baseThreshold.toFixed(4);
        els.dispBaseThreshold.textContent = baseThreshold.toFixed(4);
    } else {
        els.limitDisplay.textContent = "未測定 (デフォルト: 0.05)";
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
        console.error(err);
    }
};

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

async function loadAudioFromPath(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`File not found: ${path}`);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
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

    // 初期音量は測定値の3倍
    currentLevelVol = baseThreshold * 3;
    if (currentLevelVol > 1.0) currentLevelVol = 1.0;

    hearingStreak = 0;
    typingScore = 0;
    totalHits = 0;
    minSuccessfulVol = null;

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
    noiseGain.gain.value = 0.5; // 環境音の音量

    noiseSource.connect(noiseGain).connect(audioCtx.destination);
    noiseSource.start();
}

function scheduleNextSound() {
    if (!isGameRunning) return;
    const delay = Math.random() * 4000 + 3000; // 3~7秒後
    hearingTimer = setTimeout(playSoundEffect, delay);
}

function playSoundEffect() {
    if (!isGameRunning) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = TARGET_TYPE;
    osc.frequency.value = TARGET_FREQ;
    gain.gain.value = currentLevelVol;

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + SOUND_DURATION);

    isWaitingForResponse = true;

    reactionTimeout = setTimeout(() => {
        if (isWaitingForResponse) {
            handleHearingResult(false); // 聞き逃し判定
        }
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
        hearingStreak++;

        if (minSuccessfulVol === null || currentLevelVol < minSuccessfulVol) {
            minSuccessfulVol = currentLevelVol;
        }

        // 成功するたびに少しずつ音を下げる（難易度アップ）
        currentLevelVol *= 0.9; 
        if (currentLevelVol < baseThreshold * 0.5) currentLevelVol = baseThreshold * 0.5;

        updateStats();
        setTimeout(() => {
            fb.classList.remove("feedback-visible", "fb-good");
        }, 1000);
        scheduleNextSound();
    } else {
        fb.textContent = "GAME OVER...";
        fb.classList.add("fb-miss");
        setTimeout(() => finishGame(true), 1500);
    }
}

// ==========================================
// ゲーム終了 & 結果計算
// ==========================================
function finishGame(isGameOver) {
    isGameRunning = false;
    clearTimeout(hearingTimer);
    clearTimeout(reactionTimeout);
    if (noiseSource) noiseSource.stop();

    els.gamePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');

    const finalTrainVol = (minSuccessfulVol !== null) ? minSuccessfulVol : currentLevelVol;
    const rawDiff = finalTrainVol - baseThreshold;

    els.resBase.textContent = baseThreshold.toFixed(4);
    els.resTrain.textContent = finalTrainVol.toFixed(4);
    els.resDiff.textContent = rawDiff.toFixed(4);
    els.resScore.textContent = typingScore;
    els.resHits.textContent = totalHits;

    setupCsvDownload(finalTrainVol, rawDiff.toFixed(4));
}

// (CSV保存、タイピングロジック等は変更なしのため省略可能ですが、一貫性のために含めます)
function setupCsvDownload(trainVol, diff) {
    els.btnDownloadCsv.onclick = () => {
        const timestamp = new Date().toLocaleString();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Timestamp,Base_Threshold,Training_Threshold,Diff,Typing_Score,Total_Hits,Duration(sec)\n";
        csvContent += `${timestamp},${baseThreshold},${trainVol},${diff},${typingScore},${totalHits},${duration}\n`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "training_result.csv");
        document.body.appendChild(link);
        link.click();
    };
}

// タイピング関連
function nextWord() {
    currentWordObj = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    charIndex = 0;
    renderWord();
}

function renderWord() {
    const romaji = currentWordObj.romaji;
    const typedPart = romaji.substring(0, charIndex);
    const untypedPart = romaji.substring(charIndex);
    els.romajiDisplay.innerHTML = `<span class="typed-char">${typedPart}</span><span class="untyped-char">${untypedPart}</span>`;
    els.japaneseDisplay.textContent = currentWordObj.jp;
}

function checkTyping(key) {
    if (!isGameRunning) return;
    const targetChar = currentWordObj.romaji[charIndex];
    if (key.toLowerCase() === targetChar) {
        charIndex++;
        typingScore += 10;
        renderWord();
        if (charIndex >= currentWordObj.romaji.length) {
            typingScore += 50;
            setTimeout(nextWord, 100);
        }
    }
    updateStats();
}

function updateStats() {
    els.dispCurrentVol.textContent = currentLevelVol.toFixed(4);
    els.dispScore.textContent = typingScore;
}

document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    if (e.code === 'Space') {
        e.preventDefault();
        // 待機中なら成功、そうでなければお手つき（即終了）
        handleHearingResult(isWaitingForResponse);
        return;
    }
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        checkTyping(e.key);
    }
});