// ==========================================
// 操作ガイド
// 1場面 = 1項目。図を左、説明を右に置く。
// ==========================================
const SCENE_MS = 9000;

const SCENES = [
    {
        chapter: '概要',
        art: ['overview'],
        solo: true,
        title: '雑音下での打鍵と、提示音への反応を同時に行います',
        text: '換気扇に似た雑音が流れる中で、画面に表示される語をローマ字で入力します。その最中に 1 kHz の短い音（提示音）が不定間隔で鳴るので、気づいたら反応してください。所要時間は全体でおよそ30分です。'
    },
    {
        chapter: '回答方法',
        art: ['spacebar'],
        solo: true,
        title: '提示音への回答はスペースキーのみです',
        text: 'マウスは使用しません。提示音が鳴ってから2秒以内にスペースキーを1回押してください。確信が持てない程度の小さな音でも、聞こえたと感じたら押して構いません。'
    },
    {
        chapter: 'STEP 1',
        art: ['soundMeter', 'extSpeaker'],
        title: '音量校正は実験者が行います',
        text: '騒音計のマイクを被験者の頭部位置に設置し、提示音が 60 dB になるよう PC 側の出力音量を調整します。被験者の操作は不要です。校正後は音量設定と着席位置を変更しないでください。'
    },
    {
        chapter: 'STEP 2',
        art: ['beep', 'spacebar'],
        title: '静寂下で、聞こえ始める音圧を測定します',
        text: '提示音が約1.5秒間隔で鳴り、1回ごとに 5 dB ずつ大きくなります。聞こえた時点でスペースキーを押してください。押すと音圧が下がり、再び上昇します。同じ音圧で2回反応できた時点で測定は終了します。'
    },
    {
        chapter: 'STEP 3',
        art: ['typing'],
        solo: true,
        title: '打鍵課題：表示された語をローマ字で入力します',
        text: '画面中央にローマ字列と読みが表示されます。入力済みの文字は色が変わり、打ち終わると次の語に切り替わります。入力速度は1分あたりの打鍵数（KPM）として記録されます。日本語入力（IME）は OFF のままにしてください。'
    },
    {
        chapter: 'STEP 3',
        art: ['fan', 'beep'],
        title: '聴取課題：雑音の中に提示音がまざります',
        text: '雑音は課題中ずっと鳴り続けます。提示音の間隔は2〜12秒の範囲で毎回変わるため、規則性はありません。雑音が止まるのを待たず、雑音の中の音に注意を向けてください。'
    },
    {
        chapter: 'STEP 3',
        art: ['dual'],
        solo: true,
        title: '本番：両方を同時に行います',
        text: '打鍵を続けながら、提示音に気づいた時点でスペースキーを押してください。提示音が20回鳴った時点で1ブロックが終了します。どちらか一方に集中する必要はありません。'
    },
    {
        chapter: '音圧の制御',
        art: ['louder'],
        solo: true,
        title: '反応できなかった場合は、次の音が大きくなります',
        text: '聞き逃した場合、および音が鳴っていないときに押した場合は、次の提示音が 10 dB 大きくなります。反応できた場合は 5 dB 小さくなります。誤反応によって課題が中断されることはありません。'
    },
    {
        chapter: '休憩',
        art: ['restTimer'],
        solo: true,
        title: '本番は3ブロック。間に休憩があります',
        text: '1ブロックごとに3分の休憩とアンケートがあります。休憩中は画面から目を離し、聴覚を休めてください。本番の前後には、打鍵のみ1分・聴取のみ1分の課題があります。'
    },
    {
        chapter: '確認',
        art: ['check'],
        solo: true,
        title: '以上で説明は終了です',
        text: '手順が分からなくなった場合は、各画面上部の図と手順表示に同じ内容が記載されています。進行に不明な点があれば実験者に申し出てください。'
    }
];

const scenesHost = document.getElementById('scenes');
const dotsHost = document.getElementById('dots');
const chapterEl = document.getElementById('chapter');
const barEl = document.getElementById('movieBar');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnPlay = document.getElementById('btnPlay');

let index = 0;
let playing = true;
let sceneStart = 0;
let raf = null;

scenesHost.innerHTML = SCENES.map((scene, i) => {
    const art = scene.art
        .map((name) => `<span class="${scene.solo ? 'solo' : ''}">${UI.ART[name]()}</span>`)
        .join(scene.art.length > 1 ? '<span class="art-arrow">→</span>' : '');
    return `
        <section class="scene ${i === 0 ? 'active' : ''}" data-index="${i}">
            <div class="scene-art">${art}</div>
            <div class="scene-text">
                <p class="eyebrow">${scene.chapter}</p>
                <h2>${scene.title}</h2>
                <p>${scene.text}</p>
            </div>
        </section>`;
}).join('');

dotsHost.innerHTML = SCENES.map((s, i) =>
    `<button class="dot" data-go="${i}" aria-label="${i + 1}項目目"></button>`).join('');

function show(next) {
    index = (next + SCENES.length) % SCENES.length;
    scenesHost.querySelectorAll('.scene').forEach((el) => {
        el.classList.toggle('active', Number(el.dataset.index) === index);
    });
    dotsHost.querySelectorAll('.dot').forEach((el, i) => {
        el.classList.toggle('active', i === index);
        el.classList.toggle('seen', i < index);
    });
    chapterEl.textContent = `${index + 1} / ${SCENES.length}`;
    btnNext.textContent = index === SCENES.length - 1 ? '最初に戻る' : '次へ';
    sceneStart = performance.now();
    if (index === SCENES.length - 1) UI.markDone('howto');
}

function tick() {
    const ratio = playing ? Math.min(1, (performance.now() - sceneStart) / SCENE_MS) : 0;
    barEl.style.width = `${ratio * 100}%`;
    if (playing && ratio >= 1) {
        if (index === SCENES.length - 1) setPlaying(false);
        else show(index + 1);
    }
    raf = requestAnimationFrame(tick);
}

function setPlaying(on) {
    playing = on;
    btnPlay.textContent = on ? '一時停止' : '自動再生';
    sceneStart = performance.now();
    if (!on) barEl.style.width = '0';
}

btnNext.addEventListener('click', () => show(index + 1));
btnPrev.addEventListener('click', () => show(index - 1));
btnPlay.addEventListener('click', () => setPlaying(!playing));
dotsHost.addEventListener('click', (e) => {
    const go = e.target.dataset.go;
    if (go !== undefined) show(Number(go));
});
document.getElementById('btnGoCalibrate').addEventListener('click', () => {
    UI.markDone('howto');
    location.href = 'calibrate.html';
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
});

show(0);
tick();
