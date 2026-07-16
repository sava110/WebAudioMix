// ==========================================
// 設定：内部ファイルパス・定数
// ==========================================
const NOISE_FILE_PATH = 'assets/noise/kankisen.mp3';
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
    { romaji: 'ginkoudeteikiyokinwosuru', jp: '銀行で定期預金をする' },
    { romaji: 'purintakarainsatusuru', jp: 'プリンタから印刷する' },
    { romaji: 'who-kinguwohazimemasita', jp: 'ウォーキングを始めました' },
    { romaji: 'hatumeikahaidaideatta', jp: '発明家は偉大であった' },
    { romaji: 'asukarasingakkidesu', jp: '明日から新学期です' },
    { romaji: 'rekisinobenkyouwosuru', jp: '歴史の勉強をする' },
    { romaji: 'yakeinokireinaoka', jp: '夜景のきれいな丘' },
    { romaji: 'taikendanwoosietekudasai', jp: '体験談を教えてください' },
    { romaji: 'tameninaruhanasiwokiku', jp: 'ためになる話を聞く' },
    { romaji: 'kyuusyuunihtabinidemasu', jp: '九州に旅に出ます' },
    { romaji: 'karori-ganainomimonodesu', jp: 'カロリーがない飲み物です' },
    { romaji: 'kyouhahisasiburinoyasumidesu', jp: '今日は久しぶりの休みです' },
    { romaji: 'sodaigominohiwokakuninsuru', jp: '粗大ごみの日を確認する' },
    { romaji: 'kendouwonaratteimasita', jp: '剣道を習っていました' },
    { romaji: 'anihayuumeidaigakuniitta', jp: '兄は有名大学に行った' },
    { romaji: 'keikangausinawaretutuaru', jp: '景観が失われつつある' },
    { romaji: 'isshuukanhananokakandesu', jp: '一週間は七日間です' },
    { romaji: 'sanheihounoteiri', jp: '三平方の定理' },
    { romaji: 'mo-ta-bo-toninoritai', jp: 'モーターボートに乗りたい' },
    { romaji: 'chokore-towopurezentosita', jp: 'チョコレートをプレゼントした' },
    { romaji: 'pa-thi-nidekaketeitta', jp: 'パーティーに出かけて行った' },
    { romaji: 'sinrinnnohogokatudouwosuru', jp: '森林の保護活動をする' },
    { romaji: 'hoterunorobi-dematteimasu', jp: 'ホテルのロビーで待っています' },
    { romaji: 'goruhusuku-runikayotteiru', jp: 'ゴルフスクールに通っている' },
    { romaji: 'haruyasumihaokinawaheikou', jp: '春休みは沖縄へ行こう' },
    { romaji: 'koshouwotottekudasai', jp: 'コショウを取ってください' },
    { romaji: 'keisankihakonpyu-tadesu', jp: '計算機はコンピュータです' },
    { romaji: 'harugamatidoosii', jp: '春が待ち遠しい' },
    { romaji: 'bunkasainidekakemasu', jp: '文化祭に出かけます' },
    { romaji: 'natuhauminidekaketai', jp: '夏は海に出かけたい' },
    { romaji: 'taikendanwohirousita', jp: '体験談を披露した' },
    { romaji: 'asitahaasitanokazegahuku', jp: '明日は明日の風が吹く' },
    { romaji: 'sizimihakanzouniyoitoiu', jp: 'シジミは肝臓の良いと言う' },
    { romaji: 'mirainotameniimadekirukoto', jp: '未来のために今できる事' },
    { romaji: 'kitainikotaeru', jp: '期待に応える' },
    { romaji: 'sennnyuukanwoataeru', jp: '先入観をあたえる' },
    { romaji: 'kyabetunosyuukakuzikida', jp: 'キャベツの収穫時期だ' },
    { romaji: 'ongakukanshougasukidesu', jp: '音楽鑑賞が好きです' },
    { romaji: 'keikenwotumukotomodaizidesu', jp: '経験を積む事も大事です' },
    { romaji: 'inhuruenzaninarimasita', jp: 'インフルエンザになりました' },
    { romaji: 'nihonnnosikiwotanosimu', jp: '日本の式を楽しむ' },
    { romaji: 'nihonhagiinnnaikakuseida', jp: '日本は議員内閣制だ' },
    { romaji: 'enkanatoriumutoiubussitu', jp: '塩化ナトリウムという物質' },
    { romaji: 'kissatendematiawasewosita', jp: '喫茶店で待ち合わせをした' },
    { romaji: 'itigoitiewotaisetunisuru', jp: '一期一会を大切にする' },
    { romaji: 'pariniryourishugyouniiku', jp: 'パリに料理修行に行く' },
    { romaji: 'okurerutokihadenwawokudasai', jp: '遅れるときは電話をください' },
    { romaji: 'doubutuennnikazokudeiku', jp: '動物園に家族で行く' }
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
    
    // ★ mp3自体の最大振幅を考慮し、デジタル出力を0.1〜0.2程度に一律で下げる
    // これにより、背景ノイズ単体でのクリッピングを完全に防ぐ
    noiseGain.gain.value = 0.15; 

    // 直接 destination に繋ぐ（コンプレッサーは通さない）
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
    
    // 基準となるGainの変換
    currentLevelVol = dbToGain(currentDB); 
    
    // ★ 電子音側にも一律でアッテネーション（減衰：例として0.1倍）をかける
    // これにより、合算値が1.0を超えるのを未然に防ぎ、5dB刻みの「相対関係」は100%維持する
    const attenVal = 0.1; 
    gain.gain.value = currentLevelVol * attenVal;

    // 直接 destination に繋ぐ
    osc.connect(gain).connect(audioCtx.destination);
    
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