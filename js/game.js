// ==========================================
// 本番セッション
// 前：文字2分 → 音2分 → 本番20音×3（あいだに休憩）→ 後：文字2分 → 音2分
// ==========================================
const NOISE_FILE_PATH = 'assets/noise/kankisen.mp3';
const NOISE_GAIN = 0.15;
const RESPONSE_WINDOW = 2000;
const BLOCK_MS = 2 * 60 * 1000;
const DUAL_TRIALS = 20;
const START_DB = 70;
const MAX_DB = 80;
const MIN_DB = 0;
const STEP_DOWN = 5;
const STEP_UP = 10;
const MIN_DELAY = 3000;
const MAX_DELAY = 10000;

const PHASES = [
    { id: 'pre_typing', kind: 'typing', title: '本番前：文字だけ（2分）' },
    { id: 'pre_sound', kind: 'sound', title: '本番前：音だけ（2分）' },
    { id: 'dual_1', kind: 'dual', title: '本番 1回目（音20回）' },
    { id: 'break_1', kind: 'break', title: '休憩' },
    { id: 'dual_2', kind: 'dual', title: '本番 2回目（音20回）' },
    { id: 'break_2', kind: 'break', title: '休憩' },
    { id: 'dual_3', kind: 'dual', title: '本番 3回目（音20回）' },
    { id: 'break_3', kind: 'break', title: '休憩' },
    { id: 'post_typing', kind: 'typing', title: '本番後：文字だけ（2分）' },
    { id: 'post_sound', kind: 'sound', title: '本番後：音だけ（2分）' }
];

const INTRO = {
    typing: '音は鳴りません。画面の文字を、2分間打ってください。速さは1分間の打鍵数（KPM）で記録します。',
    sound: '文字は打ちません。換気扇の音の中で「ピー」が鳴ったら、スペースキーを押してください。2分で終わります。ミスしても続き、次の音は10 dB大きくなります。',
    dual: '換気扇の音の中で文字を打ちながら、鳴った音にスペースキーで答えてください。音は20回鳴ったら終わります。2回ミスでは終わりません。ミスすると次の音は10 dB大きくなります。'
};

// ハイフン入りの語は打てないので除く（40語）
const WORD_LIST = [
    { romaji: 'ginkoudeteikiyokinwosuru', jp: '銀行で定期預金をする' },
    { romaji: 'purintakarainsatusuru', jp: 'プリンタから印刷する' },
    { romaji: 'hatumeikahaidaideatta', jp: '発明家は偉大であった' },
    { romaji: 'asukarasingakkidesu', jp: '明日から新学期です' },
    { romaji: 'rekisinobenkyouwosuru', jp: '歴史の勉強をする' },
    { romaji: 'yakeinokireinaoka', jp: '夜景のきれいな丘' },
    { romaji: 'taikendanwoosietekudasai', jp: '体験談を教えてください' },
    { romaji: 'tameninaruhanasiwokiku', jp: 'ためになる話を聞く' },
    { romaji: 'kyuusyuunihtabinidemasu', jp: '九州に旅に出ます' },
    { romaji: 'kyouhahisasiburinoyasumidesu', jp: '今日は久しぶりの休みです' },
    { romaji: 'sodaigominohiwokakuninsuru', jp: '粗大ごみの日を確認する' },
    { romaji: 'kendouwonaratteimasita', jp: '剣道を習っていました' },
    { romaji: 'anihayuumeidaigakuniitta', jp: '兄は有名大学に行った' },
    { romaji: 'keikangausinawaretutuaru', jp: '景観が失われつつある' },
    { romaji: 'isshuukanhananokakandesu', jp: '一週間は七日間です' },
    { romaji: 'sanheihounoteiri', jp: '三平方の定理' },
    { romaji: 'sinrinnnohogokatudouwosuru', jp: '森林の保護活動をする' },
    { romaji: 'haruyasumihaokinawaheikou', jp: '春休みは沖縄へ行こう' },
    { romaji: 'koshouwotottekudasai', jp: 'コショウを取ってください' },
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

let audioCtx;
let noiseBuffer = null;
let noiseSource = null;
let baseThresholdDB = null;

let phaseIndex = -1;
let blockActive = false;
let isWaitingForResponse = false;
let inputLock = false;
let stopAfterCurrent = false;

let currentDB = START_DB;
let soundsPlayed = 0;
let keystrokes = 0;
let blockStart = 0;
let blockDeadline = 0;
let soundStartTime = 0;
let lastSuccessDB = null;
let hitCount = 0;
let hitRtSum = 0;

let hearingTimer = null;
let reactionTimeout = null;
let blockTimer = null;
let uiTimer = null;
let breakTimer = null;

let currentWordObj = null;
let charIndex = 0;
let trialHistory = [];
const sessionPhases = [];

const els = {
    setupPanel: document.getElementById('setupPanel'),
    introPanel: document.getElementById('introPanel'),
    gamePanel: document.getElementById('gamePanel'),
    breakPanel: document.getElementById('breakPanel'),
    breakStep: document.getElementById('breakStep'),
    breakNext: document.getElementById('breakNext'),
    breakClock: document.getElementById('breakClock'),
    resultPanel: document.getElementById('resultPanel'),
    donePanel: document.getElementById('donePanel'),
    loadStatus: document.getElementById('loadStatus'),
    btnStart: document.getElementById('btnStart'),
    btnPhaseStart: document.getElementById('btnPhaseStart'),
    btnStop: document.getElementById('btnStop'),
    btnBreakDone: document.getElementById('btnBreakDone'),
    btnNext: document.getElementById('btnNext'),
    btnDownloadCsv: document.getElementById('btnDownloadCsv'),
    btnDownloadFinal: document.getElementById('btnDownloadFinal'),
    introTitle: document.getElementById('introTitle'),
    introStep: document.getElementById('introStep'),
    introText: document.getElementById('introText'),
    phaseTitle: document.getElementById('phaseTitle'),
    phaseStep: document.getElementById('phaseStep'),
    progressLabel: document.getElementById('progressLabel'),
    dispProgress: document.getElementById('dispProgress'),
    dispCurrentVol: document.getElementById('dispCurrentVol'),
    dispKpm: document.getElementById('dispKpm'),
    typingArea: document.getElementById('typingArea'),
    listenMessage: document.getElementById('listenMessage'),
    romajiDisplay: document.getElementById('romajiDisplay'),
    japaneseDisplay: document.getElementById('japaneseDisplay'),
    hearingFeedback: document.getElementById('hearingFeedback'),
    resultTitle: document.getElementById('resultTitle'),
    resKpm: document.getElementById('resKpm'),
    resHits: document.getElementById('resHits'),
    resRt: document.getElementById('resRt'),
    resLastDb: document.getElementById('resLastDb'),
    doneSummary: document.getElementById('doneSummary')
};

window.onload = async () => {
    try {
        initAudio();
        els.loadStatus.textContent = '環境音を読み込み中...';
        noiseBuffer = await loadAudioFromPath(NOISE_FILE_PATH);
        els.loadStatus.textContent = '環境音の準備完了';
        els.loadStatus.style.color = '#2ecc71';
        els.btnStart.disabled = false;
    } catch (err) {
        els.loadStatus.textContent = '環境音の読み込みに失敗しました。';
        els.loadStatus.style.color = '#e74c3c';
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

function currentPhase() {
    return PHASES[phaseIndex];
}

function taskStepLabel(phase) {
    const tasks = PHASES.filter((p) => p.kind !== 'break');
    const index = tasks.findIndex((p) => p.id === phase.id);
    return `段階 ${index + 1} / ${tasks.length}`;
}

function showBreak() {
    clearInterval(breakTimer);
    const next = PHASES[phaseIndex + 1];
    els.breakStep.textContent = '休憩';
    els.breakNext.textContent = next ? `このあとは「${next.title}」です。` : '';
    els.breakPanel.classList.remove('hidden');
    const endsAt = performance.now() + 3 * 60 * 1000;
    const paint = () => {
        const left = Math.max(0, endsAt - performance.now());
        const sec = Math.ceil(left / 1000);
        els.breakClock.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
        if (left <= 0) clearInterval(breakTimer);
    };
    paint();
    breakTimer = setInterval(paint, 250);
}

function hideAll() {
    [els.setupPanel, els.introPanel, els.gamePanel, els.breakPanel, els.resultPanel, els.donePanel]
        .forEach((el) => el.classList.add('hidden'));
}

els.btnStart.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    phaseIndex = -1;
    advance();
});
els.btnPhaseStart.addEventListener('click', startBlock);
els.btnStop.addEventListener('click', () => endBlock(true));
els.btnBreakDone.addEventListener('click', () => {
    clearInterval(breakTimer);
    advance();
});
els.btnNext.addEventListener('click', advance);
els.btnDownloadCsv.addEventListener('click', () => downloadCsv(false));
els.btnDownloadFinal.addEventListener('click', () => downloadCsv(true));

function advance() {
    phaseIndex += 1;
    if (phaseIndex >= PHASES.length) {
        showDone();
        return;
    }
    const phase = currentPhase();
    hideAll();
    if (phase.kind === 'break') {
        showBreak();
        return;
    }
    els.introStep.textContent = taskStepLabel(phase);
    els.introTitle.textContent = phase.title;
    els.introText.textContent = INTRO[phase.kind];
    els.introPanel.classList.remove('hidden');
}

function startBlock() {
    const phase = currentPhase();
    blockActive = true;
    isWaitingForResponse = false;
    inputLock = false;
    stopAfterCurrent = false;
    soundsPlayed = 0;
    keystrokes = 0;
    lastSuccessDB = null;
    hitCount = 0;
    hitRtSum = 0;
    trialHistory = [];
    currentDB = START_DB;
    blockStart = performance.now();
    blockDeadline = blockStart + BLOCK_MS;

    hideAll();
    els.gamePanel.classList.remove('hidden');
    els.phaseStep.textContent = taskStepLabel(phase);
    els.phaseTitle.textContent = phase.title;
    const typingOn = phase.kind !== 'sound';
    els.typingArea.classList.toggle('hidden', !typingOn);
    els.listenMessage.classList.toggle('hidden', phase.kind !== 'sound');
    els.progressLabel.textContent = phase.kind === 'dual' ? '鳴った音' : '残り時間';
    if (typingOn) nextWord();
    if (phase.kind !== 'typing') playNoiseLoop();
    updateHud();
    uiTimer = setInterval(updateHud, 250);

    if (phase.kind === 'typing') {
        blockTimer = setTimeout(() => endBlock(false), BLOCK_MS);
    } else if (phase.kind === 'sound') {
        blockTimer = setTimeout(() => {
            stopAfterCurrent = true;
            if (!isWaitingForResponse) {
                clearScheduledSound();
                endBlock(false);
            }
        }, BLOCK_MS);
        scheduleNextSound();
    } else {
        scheduleNextSound();
    }
    if (document.activeElement) document.activeElement.blur();
}

function playNoiseLoop() {
    stopNoise();
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = NOISE_GAIN;
    noiseSource.connect(gain).connect(audioCtx.destination);
    noiseSource.start();
}

function stopNoise() {
    if (!noiseSource) return;
    try { noiseSource.stop(); } catch (e) { /* already stopped */ }
    noiseSource = null;
}

function clearScheduledSound() {
    clearTimeout(hearingTimer);
    hearingTimer = null;
}

function scheduleNextSound() {
    if (!blockActive) return;
    const phase = currentPhase();
    if (phase.kind === 'dual' && soundsPlayed >= DUAL_TRIALS) {
        endBlock(false);
        return;
    }
    if (phase.kind === 'sound' && (stopAfterCurrent || performance.now() >= blockDeadline)) {
        endBlock(false);
        return;
    }
    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    hearingTimer = setTimeout(playSoundEffect, delay);
}

function playSoundEffect() {
    if (!blockActive) return;
    hearingTimer = null;
    const phase = currentPhase();
    if (phase.kind === 'sound' && performance.now() >= blockDeadline) {
        endBlock(false);
        return;
    }
    if (phase.kind === 'dual' && soundsPlayed >= DUAL_TRIALS) {
        endBlock(false);
        return;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = TONE.TYPE;
    osc.frequency.value = TONE.FREQ;
    gain.gain.value = TONE.dbToGain(currentDB);
    osc.connect(gain).connect(audioCtx.destination);
    soundStartTime = performance.now();
    osc.start();
    osc.stop(audioCtx.currentTime + TONE.DURATION_SEC);
    soundsPlayed += 1;
    isWaitingForResponse = true;
    updateHud();

    reactionTimeout = setTimeout(() => {
        if (isWaitingForResponse) handleHearingResult('timeout', null);
    }, RESPONSE_WINDOW);
}

function handleHearingResult(outcome, reactionTime) {
    if (!blockActive) return;
    isWaitingForResponse = false;
    clearTimeout(reactionTimeout);
    if (outcome === 'false_alarm') clearScheduledSound();

    const presentedDb = currentDB;
    trialHistory.push({
        trialNumber: trialHistory.length + 1,
        targetDB: outcome === 'false_alarm' ? '' : presentedDb,
        outcome,
        reactionTime: outcome === 'success' ? reactionTime.toFixed(2) : '',
        elapsedMs: Math.round(performance.now() - blockStart),
        keystrokes
    });

    if (outcome === 'success') {
        hitCount += 1;
        hitRtSum += reactionTime;
        lastSuccessDB = presentedDb;
        currentDB = Math.max(MIN_DB, currentDB - STEP_DOWN);
        showFeedback(`音に気づけた<br><span style="font-size:0.6em;">${Math.round(reactionTime)} ms</span>`, true, 1000, afterFeedback);
        return;
    }

    currentDB = Math.min(MAX_DB, currentDB + STEP_UP);
    const label = outcome === 'false_alarm' ? 'お手つき（+10 dB）' : '聞き逃し（+10 dB）';
    showFeedback(label, false, 2000, afterFeedback);
}

function afterFeedback() {
    if (!blockActive) return;
    const phase = currentPhase();
    if (phase.kind === 'dual' && soundsPlayed >= DUAL_TRIALS) {
        endBlock(false);
        return;
    }
    if (phase.kind === 'sound' && (stopAfterCurrent || performance.now() >= blockDeadline)) {
        endBlock(false);
        return;
    }
    scheduleNextSound();
}

function showFeedback(html, good, ms, thenFn) {
    inputLock = true;
    const fb = els.hearingFeedback;
    fb.innerHTML = html;
    fb.className = 'feedback-visible ' + (good ? 'fb-good' : 'fb-miss');
    setTimeout(() => {
        fb.className = 'feedback-hidden';
        inputLock = false;
        thenFn();
    }, ms);
}

function endBlock(aborted) {
    if (!blockActive) return;
    blockActive = false;
    isWaitingForResponse = false;
    inputLock = true;
    clearScheduledSound();
    clearTimeout(reactionTimeout);
    clearTimeout(blockTimer);
    clearInterval(uiTimer);
    stopNoise();

    const phase = currentPhase();
    const durationMs = performance.now() - blockStart;
    const minutes = Math.max(durationMs / 60000, 1 / 60);
    const kpm = keystrokes / minutes;
    const summary = {
        id: phase.id,
        title: phase.title,
        kind: phase.kind,
        aborted,
        kpm,
        keystrokes,
        durationMs,
        soundsPlayed,
        hitCount,
        meanRt: hitCount ? hitRtSum / hitCount : null,
        lastSuccessDB,
        trials: trialHistory.slice()
    };
    sessionPhases.push(summary);
    showBlockResult(summary);
}

function showBlockResult(summary) {
    hideAll();
    els.resultPanel.classList.remove('hidden');
    els.resultTitle.textContent = summary.aborted ? summary.title + '（中断）' : summary.title;
    els.resKpm.textContent = summary.kind === 'sound' ? '—（文字なし）' : summary.kpm.toFixed(1);
    if (summary.kind === 'typing') {
        els.resHits.textContent = '—';
        els.resRt.textContent = '—';
        els.resLastDb.textContent = '—';
    } else {
        els.resHits.textContent = `${summary.hitCount} / ${summary.soundsPlayed}`;
        els.resRt.textContent = summary.meanRt == null ? '—' : `${Math.round(summary.meanRt)} ms`;
        els.resLastDb.textContent = summary.lastSuccessDB == null ? '—' : `${summary.lastSuccessDB} dB`;
    }
}

function showDone() {
    hideAll();
    els.donePanel.classList.remove('hidden');
    els.doneSummary.innerHTML = sessionPhases.map((p) => {
        const kpmText = p.kind === 'sound' ? '文字なし' : `KPM ${p.kpm.toFixed(1)}`;
        const hitText = p.kind === 'typing' ? '' : ` / 正解 ${p.hitCount}/${p.soundsPlayed}`;
        return `<p>${p.title}：${kpmText}${hitText}</p>`;
    }).join('');
}

function nextWord() {
    currentWordObj = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    charIndex = 0;
    renderWord();
}

function renderWord() {
    const romaji = currentWordObj.romaji;
    const typed = romaji.slice(0, charIndex);
    const current = romaji.charAt(charIndex);
    const rest = romaji.slice(charIndex + 1);
    els.romajiDisplay.innerHTML =
        `<span class="typed-char">${typed}</span>` +
        `<span class="current-char">${current}</span>` +
        `<span class="untyped-char">${rest}</span>`;
    els.japaneseDisplay.textContent = currentWordObj.jp;
}

function checkTyping(key) {
    if (!blockActive || inputLock) return;
    const phase = currentPhase();
    if (phase.kind === 'sound') return;
    if (key.toLowerCase() !== currentWordObj.romaji[charIndex]) return;
    charIndex += 1;
    keystrokes += 1;
    if (charIndex >= currentWordObj.romaji.length) nextWord();
    else renderWord();
    updateHud();
}

function updateHud() {
    if (!blockActive) return;
    const phase = currentPhase();
    const elapsedMin = Math.max((performance.now() - blockStart) / 60000, 1 / 60);
    els.dispKpm.textContent = phase.kind === 'sound' ? '—' : (keystrokes / elapsedMin).toFixed(1);
    els.dispCurrentVol.textContent = phase.kind === 'typing' ? '—' : `${currentDB} dB`;
    if (phase.kind === 'dual') {
        els.dispProgress.textContent = `${soundsPlayed} / ${DUAL_TRIALS}`;
    } else {
        const left = Math.max(0, blockDeadline - performance.now());
        const sec = Math.ceil(left / 1000);
        els.dispProgress.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    }
}

document.addEventListener('keydown', (e) => {
    if (!blockActive || e.code !== 'Space') return;
    e.preventDefault();
}, true);

document.addEventListener('keydown', (e) => {
    if (!blockActive) return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (inputLock) return;
        const phase = currentPhase();
        if (phase.kind === 'typing') return;
        if (isWaitingForResponse) {
            const rt = performance.now() - soundStartTime;
            handleHearingResult('success', rt);
        } else {
            handleHearingResult('false_alarm', null);
        }
        return;
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) checkTyping(e.key);
});

function downloadCsv() {
    const summaryHeader = 'Phase,Kind,Aborted,KPM,Keystrokes,Duration_ms,Sounds,Hits,Mean_RT_ms,Last_Success_dB_reference';
    const summaryRows = sessionPhases.map((p) => [
        p.id, p.kind, p.aborted, p.kpm.toFixed(2), p.keystrokes, Math.round(p.durationMs),
        p.soundsPlayed, p.hitCount,
        p.meanRt == null ? '' : p.meanRt.toFixed(2),
        p.lastSuccessDB == null ? '' : p.lastSuccessDB
    ].join(','));
    const trialHeader = 'Phase,Trial,Target_dB,Result,Reaction_Time_ms,Elapsed_ms,Keystrokes';
    const trialRows = [];
    sessionPhases.forEach((p) => {
        p.trials.forEach((t) => {
            const result = t.outcome === 'success' ? 'Success' : (t.outcome === 'timeout' ? 'Timeout' : 'FalseAlarm');
            trialRows.push([p.id, t.trialNumber, t.targetDB, result, t.reactionTime, t.elapsedMs, t.keystrokes].join(','));
        });
    });
    const csv = ['--- Summary ---', summaryHeader, ...summaryRows, '', '--- Trials ---', trialHeader, ...trialRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    link.href = URL.createObjectURL(blob);
    link.download = `session_${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
