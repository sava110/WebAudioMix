// ==========================================
// 設定：内部ファイルパス・定数
// ==========================================
const NOISE_FILE_PATH = 'assets/noise/fan.mp3';
const TARGET_FREQ = 2000;
const TARGET_TYPE = 'sine';
const SOUND_DURATION = 0.5;
const RESPONSE_WINDOW = 2000;

// dB計算用の定数
const REF_DB = 60;       // 基準（最大）となるdB
const START_OFFSET = 20; // 閾値から何dB上で始めるか
const STEP_DB = 5;       // 成功時に下げるdB

let soundStartTime = 0;      // 音が鳴り始めた時刻
let latestReactionTime = 0;  // 直近の反応時間（ms）
let reactionTimes = [];      // 全正解試行の反応時間リスト

// 単語リスト
// ==========================================
// 単語リスト（全60単語）
// ==========================================
const WORD_LIST = [
    // --- 既存の10単語 ---
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

    // --- 追加の短い単語（初動やリハビリの基礎用） ---
    { romaji: 'madowoakeru', jp: '窓を開ける' },
    { romaji: 'honworemu', jp: '本を読む' },
    { romaji: 'pashiwouta', jp: '歌をうたう' },
    { romaji: 'teaworau', jp: '手を洗う' },
    { romaji: 'kutsuwohaku', jp: '靴を履く' },
    { romaji: 'kaimononiiku', jp: '買い物に行く' },
    { romaji: 'hasshiruaruku', jp: '走って歩く' },
    { romaji: 'shinbwnwomu', jp: '新聞を読む' },
    { romaji: 'tegamiwokaku', jp: '手紙を書く' },
    { romaji: 'gohanwotaberu', jp: 'ご飯を食べる' },
    { romaji: 'mizuwonomu', jp: '水を飲む' },
    { romaji: 'ofuroniaru', jp: 'お風呂に入る' },
    { romaji: 'heyawoasoji', jp: '部屋を掃除する' },
    { romaji: 'denkiwokesu', jp: '電気を消す' },
    { romaji: 'kagiwosimeru', jp: '鍵を閉める' },

    // --- 追加の中くらいの単語（日常生活の連想） ---
    { romaji: 'oishiiasagohan', jp: '美味しい朝ごはん' },
    { romaji: 'terebiwomiru', jp: 'テレビを見る' },
    { romaji: 'ongakuwokiku', jp: '音楽を聴く' },
    { romaji: 'inunosanpowosur', jp: '犬の散歩をする' },
    { romaji: 'tomodachitohanasu', jp: '友達と話す' },
    { romaji: 'denshaniandoru', jp: '電車に乗る' },
    { romaji: 'jitenshaniandoru', jp: '自転車に乗る' },
    { romaji: 'pasokonwotsukau', jp: 'パソコンを使う' },
    { romaji: 'shukudaigaowaru', jp: '宿題が終わる' },
    { romaji: 'shashinwotoru', jp: '写真を撮る' },
    { romaji: 'yasaiwokaumise', jp: '野菜を買う店' },
    { romaji: 'koutsuushigou', jp: '交通信号' },
    { romaji: 'koenndeasobu', jp: '公園で遊ぶ' },
    { romaji: 'fukuwokiandora', jp: '服を着替える' },
    { romaji: 'sumahowomiruhito', jp: 'スマホを見る人' },

    // --- 追加の長い単語（高い視覚負荷をかける用） ---
    { romaji: 'renjidegohanwoatatameru', jp: 'レンジでご飯を温める' },
    { romaji: 'intahiandogarantadonaru', jp: 'インターホンが何度も鳴る' },
    { romaji: 'kankisangamaasuteiruheya', jp: '換気扇が回っている部屋' },
    { romaji: 'sentakukigaugoitedasuru', jp: '洗濯機が動いて音がする' },
    { romaji: 'nichiyoubiandonoasanebou', jp: '日曜日のお寝坊' },
    { romaji: 'coffeeandowoirenagarahoreru', jp: 'コーヒーを淹れながら待つ' },
    { romaji: 'soujikiandodeheyaandowohaku', jp: '掃除機で部屋をきれいにする' },
    { romaji: 'omoshiriandogadongawomiru', jp: '面白い動画を見る' },
    { romaji: 'shizukaniandootowokiku', jp: '静かに音を聴く' },
    { romaji: 'asanoisogiandodeisogu', jp: '朝の準備で急ぐ' },

    // --- さらに追加（バリエーション拡充） ---
    { romaji: 'amegofuriandodasu', jp: '雨が降り出す' },
    { romaji: 'kazegafwiandoteiru', jp: '風が吹いている' },
    { romaji: 'reizoukonoandooto', jp: '冷蔵庫の音' },
    { romaji: 'ginkouandoniiku', jp: '銀行に行く' },
    { romaji: 'hasshirumichiwosagasu', jp: '走る道を探す' },
    { romaji: 'soraandowomiandogemiru', jp: '空を見上げる' },
    { romaji: 'kireinaandohanagasaku', jp: 'きれいな花が咲く' },
    { romaji: 'niwaniandotorigakuru', jp: '庭に鳥が来る' },
    { romaji: 'tanoshiiandodokushonoandorikan', jp: '楽しい読書の時間' },
    { romaji: 'kyouandounotengkiandowasuru', jp: '今日の天気を調べる' }
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

let trialHistory = []; // 各試行の全データを保存する配列

// DOM要素
const els = {
    setupPanel: document.getElementById('setupPanel'),
    gamePanel: document.getElementById('gamePanel'),
    resultPanel: document.getElementById('resultPanel'),
    loadStatus: document.getElementById('loadStatus'),
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),
    btnDownloadCsv: document.getElementById('btnDownloadCsv'),
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
        els.dispBaseThreshold.textContent = `${baseThresholdDB} dB`;
    } else {
        baseThresholdDB = 20;
        els.dispBaseThreshold.textContent = `${baseThresholdDB} dB`;
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

    // 初期レベル：タイピングゲームは 70dB から開始
    currentDB = 70;

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

    // 3,000ms（3秒）〜 10,000ms（10秒）の間でランダムな待機時間を計算
    // 式：Math.random() * (最大値 - 最小値) + 最小値
    const minDelay = 3000;
    const maxDelay = 10000;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    hearingTimer = setTimeout(playSoundEffect, delay);
    
    // デバッグ用（必要に応じて）：次の音までの時間をコンソールに表示
    console.log(`Next sound in: ${(delay / 1000).toFixed(1)} seconds`);
}

// ==========================================
// 修正：音を鳴らす関数
// ==========================================
function playSoundEffect() {
    if (!isGameRunning) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = TARGET_TYPE;
    osc.frequency.value = TARGET_FREQ;
    
    currentLevelVol = dbToGain(currentDB);
    gain.gain.value = currentLevelVol;

    osc.connect(gain).connect(audioCtx.destination);
    
    // ★ 音が鳴る直前に高精度タイムスタンプを記録
    soundStartTime = performance.now(); 
    
    osc.start();
    osc.stop(audioCtx.currentTime + SOUND_DURATION);

    isWaitingForResponse = true;
    reactionTimeout = setTimeout(() => {
        if (isWaitingForResponse) handleHearingResult(false);
    }, RESPONSE_WINDOW);
}

// ==========================================
// 変数の追加・更新
// ==========================================
let missCount = 0;           // 失敗回数をカウント
const MAX_MISSES = 2;        // 2回失敗で終了
const RECOVERY_OFFSET = 10;  // 失敗時の引き上げ幅 (+10dB)

// ==========================================
// 判定ロジックの修正
// ==========================================
function handleHearingResult(success, reactionTime = null) {
    isWaitingForResponse = false;
    clearTimeout(reactionTimeout);
    const fb = els.hearingFeedback;
    fb.className = "feedback-visible";

    // 試行データの記録
    const trialRecord = {
        trialNumber: trialHistory.length + 1,
        targetDB: currentDB,
        success: success,
        reactionTime: success ? reactionTime.toFixed(2) : "MISS",
        typingScoreAtTime: typingScore,
        timestamp: (performance.now() - startTime).toFixed(0)
    };
    trialHistory.push(trialRecord);

    if (success && reactionTime !== null) {
        // --- 成功時 ---
        fb.innerHTML = `HEARING OK!<br><span style="font-size:0.6em;">RT: ${reactionTime.toFixed(0)}ms</span>`;
        fb.classList.add("fb-good");
        
        totalHits++;
        minSuccessfulDB = currentDB;

        // 次のレベルへ：5dB下げる
        currentDB -= STEP_DB;
        if (currentDB < 0) currentDB = 0;

        updateStats();
        setTimeout(() => fb.classList.remove("feedback-visible", "fb-good"), 1000);
        scheduleNextSound();

    } else {
        // --- 失敗時 ---
        missCount++;

        if (missCount < MAX_MISSES) {
            // 1回目の失敗：音量を上げて継続
            fb.innerHTML = `MISS (+10dB)<br><span style="font-size:0.6em;">残りライフ: 1</span>`;
            fb.classList.add("fb-miss");

            currentDB += RECOVERY_OFFSET;
            if (currentDB > REF_DB) currentDB = REF_DB; // 60dB上限

            updateStats();
            
            // フィードバック表示後に次を予約
            setTimeout(() => {
                fb.classList.remove("feedback-visible", "fb-miss");
                scheduleNextSound();
            }, 2000);

        } else {
            // 2回目の失敗：ゲームオーバー
            fb.textContent = "GAME OVER (2 Misses)";
            fb.classList.add("fb-miss");
            setTimeout(() => finishGame(true), 1500);
        }
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

// ==========================================
// CSV保存機能の修正（詳細データ版）
// ==========================================
function setupCsvDownload(finalDB, diff) {
    els.btnDownloadCsv.onclick = () => {
        // ユーザーにファイル名を入力させる。空白またはキャンセルの場合は日付で保存。
        const userInput = window.prompt("保存するファイル名を入力してください（空白の場合は日付で保存されます）", "");
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const filenameBase = (userInput && userInput.trim() !== "") ? userInput.trim() : `training_${dateStr}`;

        const timestamp = new Date().toLocaleString();

        // CSVヘッダー
        let csvContent = "data:text/csv;charset=utf-8,";

        // 1. サマリー情報のセクション
        csvContent += "--- Summary ---\n";
        csvContent += "Date,Base_dB,Final_Training_dB,Diff_dB,Total_Hits,Final_Typing_Score\n";
        csvContent += `${timestamp},${baseThresholdDB},${finalDB},${diff},${totalHits},${typingScore}\n\n`;

        // 2. 試行ごとの詳細データセクション
        csvContent += "--- Trial Details ---\n";
        csvContent += "Trial_Number,Target_Volume(dB),Result,Reaction_Time(ms),Elapsed_Time(ms),Typing_Score\n";

        trialHistory.forEach(t => {
            csvContent += `${t.trialNumber},${t.targetDB},${t.success ? "Success" : "Miss"},${t.reactionTime},${t.timestamp},${t.typingScoreAtTime}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filenameBase}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

// ==========================================
// 修正：イベントハンドラ（スペースキー）
// ==========================================
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (isWaitingForResponse) {
            // ★ スペースが押された瞬間の時間を計測
            const rt = performance.now() - soundStartTime;
            handleHearingResult(true, rt);
        } else {
            handleHearingResult(false); // お手つき
        }
        return;
    }
    // タイピング処理は変更なし
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        checkTyping(e.key);
    }
});