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

// 変数
let audioCtx;
let noiseBuffer = null;
let noiseSource = null;

let baseThreshold = 0.05;

// ゲーム状態
let currentLevelVol = 0.5;
let hearingStreak = 0;
let typingScore = 0;
let isGameRunning = false;
let isWaitingForResponse = false;
let startTime = 0; // ゲーム開始時刻

// 結果記録用
let minSuccessfulVol = null; // 聞き取れた最小の音量
let totalHits = 0;           // 正解数

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

    noiseInput: document.getElementById('noiseInput'),
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

    // 結果表示用
    resBase: document.getElementById('resBase'),
    resTrain: document.getElementById('resTrain'),
    resDiff: document.getElementById('resDiff'),
    resScore: document.getElementById('resScore'),
    resHits: document.getElementById('resHits')
};

// ==========================================
// 初期化
// ==========================================
window.onload = () => {
    const saved = localStorage.getItem('userBaseThreshold');
    if (saved) {
        baseThreshold = parseFloat(saved);
        els.limitDisplay.textContent = baseThreshold.toFixed(4);
        els.dispBaseThreshold.textContent = baseThreshold.toFixed(4);
    } else {
        els.limitDisplay.textContent = "未測定 (デフォルト: 0.05)";
    }
};

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

els.btnStart.addEventListener('click', startGame);
els.btnStop.addEventListener('click', () => finishGame(false)); // 中断は失敗扱いではないが、ゲームオーバー処理へ

// ==========================================
// ゲームロジック
// ==========================================
function startGame() {
    els.setupPanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
    els.resultPanel.classList.add('hidden');

    isGameRunning = true;
    startTime = Date.now();

    // ---------------------------------------------
    // 【修正】初期値は Limit の 3倍
    // ---------------------------------------------
    currentLevelVol = baseThreshold * 3;
    if (currentLevelVol > 1.0) currentLevelVol = 1.0;
    if (currentLevelVol <= 0) currentLevelVol = 0.01;

    // 変数リセット
    hearingStreak = 0;
    typingScore = 0;
    totalHits = 0;
    minSuccessfulVol = null; // まだ成功していない

    updateStats();
    playNoiseLoop();
    nextWord();
    scheduleNextSound();
}

function playNoiseLoop() {
    if(noiseSource) try{noiseSource.stop()}catch(e){}
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.5;
    noiseSource.connect(gain).connect(audioCtx.destination);
    noiseSource.start();
}

function scheduleNextSound() {
    if (!isGameRunning) return;
    const delay = Math.random() * 4000 + 2000; // 2~6秒後
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

    // タイムアウト設定（聞き逃し判定）
    reactionTimeout = setTimeout(() => {
        if (isWaitingForResponse) {
            handleHearingResult(false); // タイムアウト＝聞き逃し
        }
    }, RESPONSE_WINDOW);
}

// ---------------------------------------------
// 【重要】判定ロジック（サドンデス）
// ---------------------------------------------
function handleHearingResult(success) {
    isWaitingForResponse = false;
    clearTimeout(reactionTimeout);

    const fb = els.hearingFeedback;
    fb.className = "feedback-visible";

    if (success) {
        // --- 正解時 ---
        fb.textContent = "HEARING OK!";
        fb.classList.add("fb-good");

        totalHits++;
        hearingStreak++;

        // 成功した最小音量を記録
        if (minSuccessfulVol === null || currentLevelVol < minSuccessfulVol) {
            minSuccessfulVol = currentLevelVol;
        }

        // 次のレベルへ（音を小さく）
        // ※BaseThresholdより下にはしない
        if (hearingStreak >= 1) { // 毎回下げる設定（必要なら2回ごとなどに変更可）
            currentLevelVol -= 0.05;
            if (currentLevelVol < baseThreshold) currentLevelVol = baseThreshold;
        }

        updateStats();

        // フィードバック消去 & 次の音へ
        setTimeout(() => {
            fb.classList.remove("feedback-visible", "fb-good");
        }, 1000);
        scheduleNextSound();

    } else {
        // --- 失敗時（即終了） ---
        fb.textContent = "GAME OVER...";
        fb.classList.add("fb-miss");

        // 少し待ってから結果画面へ
        setTimeout(() => {
            finishGame(true);
        }, 1500);
    }
}

// ==========================================
// ゲーム終了 & 結果計算
// ==========================================
function finishGame(isGameOver) {
    isGameRunning = false;
    clearTimeout(hearingTimer);
    clearTimeout(reactionTimeout);
    if(noiseSource) noiseSource.stop();

    els.gamePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');

    // --- 結果算出 ---
    const finalTrainVol = (minSuccessfulVol !== null) ? minSuccessfulVol : "記録なし";

    // 差分計算 (記録がある場合のみ)
    let diff = "---";
    if (typeof finalTrainVol === 'number') {
        // 小数点計算の誤差を避けるため少し丸める
        const rawDiff = finalTrainVol - baseThreshold;
        diff = rawDiff.toFixed(4);
    }

    // 画面表示
    els.resBase.textContent = baseThreshold.toFixed(4);
    els.resTrain.textContent = (typeof finalTrainVol === 'number') ? finalTrainVol.toFixed(4) : finalTrainVol;
    els.resDiff.textContent = (diff > 0) ? `+${diff}` : diff;
    els.resScore.textContent = typingScore;
    els.resHits.textContent = totalHits;

    // CSVダウンロード準備
    setupCsvDownload(finalTrainVol, diff);
}

function setupCsvDownload(trainVol, diff) {
    els.btnDownloadCsv.onclick = () => {
        const timestamp = new Date().toLocaleString();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        // CSVヘッダーとデータ
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Timestamp,Base_Threshold,Training_Threshold,Masking_Amount(Diff),Typing_Score,Total_Hits,Duration(sec)\n";
        csvContent += `${timestamp},${baseThreshold},${trainVol},${diff},${typingScore},${totalHits},${duration}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "training_result_suddendeath.csv");
        document.body.appendChild(link);
        link.click();
    };
}

// ==========================================
// タイピング (既存のまま)
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

// ==========================================
// イベントハンドラ
// ==========================================
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (isWaitingForResponse) {
            handleHearingResult(true);
        } else {
            // お手つき -> サドンデスなので即終了
            console.log("お手つき (即終了)");
            handleHearingResult(false);
        }
        return;
    }

    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        checkTyping(e.key);
    }
});
