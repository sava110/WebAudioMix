// ==========================================
// 単語リスト
// ==========================================
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
    { romaji: 'tokeiwomiru', jp: '時計を見る' },
    { romaji: 'asahayakuokiru', jp: '朝早く起きる' },
    { romaji: 'toriganakukoe', jp: '鳥が鳴く声' },
    { romaji: 'sakuragasaku', jp: '桜が咲く' },
    { romaji: 'hiroiumiwomiru', jp: '広い海を見る' },
    { romaji: 'yamanoueniiku', jp: '山の上に行く' },
    { romaji: 'kawanomizuwakirei', jp: '川の水はきれい' },
    { romaji: 'akaihanagasaku', jp: '赤い花が咲く' },
    { romaji: 'aoisoratokumo', jp: '青い空と雲' },
    { romaji: 'ookinakigaaru', jp: '大きな木がある' },
    { romaji: 'nikuwoyaku', jp: '肉を焼く' },
    { romaji: 'kireinamizu', jp: 'きれいな水' },
    { romaji: 'tamagowowaru', jp: '卵を割る' },
    { romaji: 'sakanagaoyogu', jp: '魚が泳ぐ' },
    { romaji: 'inuganiwaniiru', jp: '犬が庭にいる' },
    { romaji: 'nekogayaneniiru', jp: '猫が屋根にいる' },
    { romaji: 'kodomogaasobu', jp: '子供が遊ぶ' },
    { romaji: 'ewokakuhito', jp: '絵を描く人' },
    { romaji: 'utawoutau', jp: '歌を歌う' },
    { romaji: 'pianonooto', jp: 'ピアノの音' },
    { romaji: 'tegamiwokaku', jp: '手紙を書く' },
    { romaji: 'madowoakeru', jp: '窓を開ける' },
    { romaji: 'kagiwosagasu', jp: '鍵を探す' },
    { romaji: 'kaimononiiku', jp: '買い物に行く' },
    { romaji: 'okanewoharau', jp: 'お金を払う' },
    { romaji: 'kuroikamera', jp: '黒いカメラ' },
    { romaji: 'takaitokei', jp: '高い時計' },
    { romaji: 'yasuiyasai', jp: '安い野菜' },
    { romaji: 'hayakuaruku', jp: '早く歩く' },
    { romaji: 'migitewoageru', jp: '右手を上げる' },
    { romaji: 'maenisusumu', jp: '前に進む' }
];

const TARGET_FREQ = 1000;
const TARGET_TYPE = 'sawtooth';
const SOUND_DURATION = 0.5;
const RESPONSE_WINDOW = 2000;

// 変数定義
let audioCtx;
let noiseBuffer = null;
let noiseSource = null;

// 設定値（測定ページから取得）
let baseThreshold = 0.05; // デフォルト値

// ゲーム状態
let currentLevelVol = 0.5;
let hearingStreak = 0;
let typingScore = 0;
let isGameRunning = false;
let isWaitingForResponse = false;

// タイマー
let hearingTimer = null;
let reactionTimeout = null;

// タイピング状態
let currentWordObj = null;
let charIndex = 0;

// DOM要素
const els = {
    setupPanel: document.getElementById('setupPanel'),
    gamePanel: document.getElementById('gamePanel'),
    noiseInput: document.getElementById('noiseInput'),
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),

    limitDisplay: document.getElementById('limitDisplay'),
    dispBaseThreshold: document.getElementById('dispBaseThreshold'),
    dispCurrentVol: document.getElementById('dispCurrentVol'),
    dispScore: document.getElementById('dispScore'),

    romajiDisplay: document.getElementById('romajiDisplay'),
    japaneseDisplay: document.getElementById('japaneseDisplay'),
    hearingFeedback: document.getElementById('hearingFeedback')
};

// ==========================================
// 初期化プロセス
// ==========================================

// 1. 測定データのロード
window.onload = () => {
    const saved = localStorage.getItem('userBaseThreshold');
    if (saved) {
        baseThreshold = parseFloat(saved);
        els.limitDisplay.textContent = baseThreshold.toFixed(4);
        els.dispBaseThreshold.textContent = baseThreshold.toFixed(4);
    } else {
        els.limitDisplay.textContent = "未測定 (デフォルト: 0.05)";
        // 初回などでデータがない場合のアラートは鬱陶しいかもしれないので削除、または控えめに
        console.log("No measurement data found. Using default.");
    }
};

// 2. 音声エンジン初期化 & ファイル読込
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

els.noiseInput.addEventListener('change', async (e) => {
    initAudio();
    const file = e.target.files[0];
    if (!file) return;

    els.btnStart.textContent = "読み込み中...";
    const arrayBuffer = await file.arrayBuffer();
    noiseBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    els.btnStart.textContent = "ゲームスタート";
    els.btnStart.disabled = false;
});

// 3. ゲーム開始・終了
els.btnStart.addEventListener('click', startGame);
els.btnStop.addEventListener('click', stopGame);

function startGame() {
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');

    isGameRunning = true;

    // --------------------------------------------------
    // 【修正箇所】開始音量を「Limitの2倍」に設定
    // --------------------------------------------------
    currentLevelVol = baseThreshold * 2;

    // もし2倍しても1.0を超える場合は1.0で止める
    if (currentLevelVol > 1.0) currentLevelVol = 1.0;

    // 万が一 Limit が0だった場合の安全策 (最低0.01から開始)
    if (currentLevelVol <= 0) currentLevelVol = 0.01;

    hearingStreak = 0;
    typingScore = 0;
    updateStats();

    playNoiseLoop();
    nextWord();
    scheduleNextSound();
}

function stopGame() {
    isGameRunning = false;
    clearTimeout(hearingTimer);
    clearTimeout(reactionTimeout);
    if(noiseSource) noiseSource.stop();

    els.gamePanel.classList.add('hidden');
    els.setupPanel.classList.remove('hidden');
}

function playNoiseLoop() {
    if(noiseSource) try{noiseSource.stop()}catch(e){}
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.5; // 背景ノイズ音量
    noiseSource.connect(gain).connect(audioCtx.destination);
    noiseSource.start();
}

// ==========================================
// タイピングロジック
// ==========================================
function nextWord() {
    currentWordObj = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    charIndex = 0;
    renderWord();
}

function renderWord() {
    const romaji = currentWordObj.romaji;
    const typedPart = romaji.substring(0, charIndex);
    const untypedPart = romaji.substring(charIndex);

    els.romajiDisplay.innerHTML =
        `<span class="typed-char">${typedPart}</span>` +
        `<span class="untyped-char">${untypedPart}</span>`;

    els.japaneseDisplay.textContent = currentWordObj.jp;
}

function checkTyping(key) {
    if (!isGameRunning) return;

    const targetChar = currentWordObj.romaji[charIndex];
    if (key.toLowerCase() === targetChar) {
        charIndex++;
        typingScore += 10;
        renderWord();
        updateStats();

        if (charIndex >= currentWordObj.romaji.length) {
            typingScore += 50;
            setTimeout(nextWord, 100);
        }
    }
}

// ==========================================
// 聴覚トレーニングロジック
// ==========================================
function scheduleNextSound() {
    if (!isGameRunning) return;
    const delay = Math.random() * 5000 + 3000;
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
            handleHearingResult(false);
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
        hearingStreak++;

        // 難易度調整 (BaseThreshold以下にはしない)
        if (hearingStreak >= 2) {
            currentLevelVol -= 0.05;
            if (currentLevelVol < baseThreshold) currentLevelVol = baseThreshold;
            hearingStreak = 0;
        }
    } else {
        fb.textContent = "MISS...";
        fb.classList.add("fb-miss");
        hearingStreak = 0;

        currentLevelVol += 0.05;
        if (currentLevelVol > 1.0) currentLevelVol = 1.0;
    }

    updateStats();

    setTimeout(() => {
        fb.classList.remove("feedback-visible", "fb-good", "fb-miss");
    }, 1000);

    scheduleNextSound();
}

function updateStats() {
    els.dispCurrentVol.textContent = currentLevelVol.toFixed(4);
    els.dispScore.textContent = typingScore;
}

// ==========================================
// イベントハンドラ
// ==========================================
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;

    // スペースキー (聴覚)
    if (e.code === 'Space') {
        e.preventDefault();
        if (isWaitingForResponse) {
            handleHearingResult(true);
        } else {
            console.log("お手つき");
        }
        return;
    }

    // 文字キー (タイピング)
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        checkTyping(e.key);
    }
});
