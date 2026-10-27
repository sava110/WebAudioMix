// ==========================================
// やり方ムービー
// 1場面 = 1メッセージ。絵が主役で、文は補助。
// ==========================================
const SCENE_MS = 8000;

const arrow = '<span class="scene-arrow">➜</span>';

const SCENES = [
    {
        chapter: 'はじめに',
        art: ['dual'],
        wide: true,
        title: '雑音の中で、文字を打ちながら音を聞きます',
        text: '換気扇のような雑音が流れる中で、キーボードで文字を打ちます。そのあいだに「ピー」という音が時々鳴るので、気づいたら知らせてください。',
        point: 'かかる時間は、ぜんぶで30分くらいです'
    },
    {
        chapter: '答えかた',
        art: ['spacebar'],
        wide: true,
        title: '音が聞こえたら、スペースキーを1回',
        text: 'この実験で音に答える方法は、これだけです。マウスは使いません。小さくても「鳴ったかな？」と思ったら押してください。',
        point: '音が鳴ってから2秒の間に押してください'
    },
    {
        chapter: 'STEP 1',
        art: ['phoneMeter', 'volumeSlider'],
        title: 'まず、パソコンの音量を合わせます',
        text: 'スマートフォンの騒音計アプリをスピーカーの前に置きます。画面の「60dB」ボタンを押したまま、パソコン側の音量つまみを動かして、アプリの数字が60になるようにします。',
        point: 'ここで合わせた音量は、最後まで変えないでください'
    },
    {
        chapter: 'STEP 2',
        art: ['beep', 'spacebar'],
        title: 'つぎに、あなたの聞こえ方をはかります',
        text: '静かな状態で「ピー」が鳴ります。最初はとても小さく、鳴るたびに少しずつ大きくなります。聞こえたらスペースキーを押してください。',
        point: '押すと音は小さく戻り、もう一度同じ大きさで聞こえたら終わりです'
    },
    {
        chapter: 'STEP 3',
        art: ['typing'],
        wide: true,
        title: '本番①　画面のお題をローマ字で打ちます',
        text: '画面に出ている言葉を、下のローマ字どおりに打ってください。打てた文字は色が変わります。打ち終わると次のお題に変わります。',
        point: '日本語入力（かな入力）はOFFのままにしてください'
    },
    {
        chapter: 'STEP 3',
        art: ['fan', 'beep'],
        title: '本番②　雑音の中で「ピー」が鳴ります',
        text: '換気扇のような音がずっと流れます。その中に「ピー」という音がまざって鳴ります。次に鳴るまでの間隔は毎回ちがいます。',
        point: '雑音はずっと鳴っています。音が止まるのを待たないでください'
    },
    {
        chapter: 'STEP 3',
        art: ['dual'],
        wide: true,
        title: '本番③　打ちながら、音にも答えます',
        text: '文字を打つ手は止めずに、「ピー」に気づいたらスペースキーを押してください。音が20回鳴ったら、1回ぶんが終わります。',
        point: 'どちらも大事です。片方だけに集中しなくて大丈夫です'
    },
    {
        chapter: 'だいじなこと',
        art: ['louder'],
        title: 'まちがえても、途中で終わりません',
        text: '聞き逃したときや、鳴っていないのに押したときは、次の音が10dB大きくなって聞き取りやすくなります。失敗しても続けてください。',
        point: '気づけたときは、次の音が少し小さくなります'
    },
    {
        chapter: 'きゅうけい',
        art: ['breakTea'],
        title: '本番は3回。あいだに休憩があります',
        text: '1回おわるごとに3分の休憩とアンケートがあります。前後には、文字だけ1分・音だけ1分の時間もあります。',
        point: '休憩中は画面から目をはなして、耳を休めてください'
    },
    {
        chapter: 'じゅんび完了',
        art: ['celebrate'],
        wide: true,
        title: 'これで説明はおわりです',
        text: '分からなくなったら、各画面の絵と番号を見れば同じ説明が出ています。それでは STEP 1 から始めましょう。',
        point: '困ったときは実験者に声をかけてください'
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
        .map((name) => `<span class="${scene.wide ? 'wide' : ''}">${UI.ART[name]()}</span>`)
        .join(scene.art.length > 1 ? arrow : '');
    return `
        <section class="scene ${i === 0 ? 'active' : ''}" data-index="${i}">
            <div class="scene-art">${art}</div>
            <h2>${scene.title}</h2>
            <p>${scene.text}</p>
            ${scene.point ? `<p class="point">${scene.point}</p>` : ''}
        </section>`;
}).join('');

dotsHost.innerHTML = SCENES.map((s, i) =>
    `<button class="dot" data-go="${i}" aria-label="${i + 1}場面目"></button>`).join('');

function show(next) {
    index = (next + SCENES.length) % SCENES.length;
    scenesHost.querySelectorAll('.scene').forEach((el) => {
        el.classList.toggle('active', Number(el.dataset.index) === index);
    });
    dotsHost.querySelectorAll('.dot').forEach((el, i) => {
        el.classList.toggle('active', i === index);
        el.classList.toggle('seen', i < index);
    });
    chapterEl.textContent = `${SCENES[index].chapter}　(${index + 1} / ${SCENES.length})`;
    btnNext.textContent = index === SCENES.length - 1 ? 'もう一度みる' : 'つぎへ ▶';
    sceneStart = performance.now();
    // 最後まで見た人は進行バーに印をつける。
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
    btnPlay.textContent = on ? '⏸ とめる' : '▶ じどうで進む';
    sceneStart = performance.now();
    if (!on) barEl.style.width = '0';
}

btnNext.addEventListener('click', () => { show(index + 1); sceneStart = performance.now(); });
btnPrev.addEventListener('click', () => { show(index - 1); sceneStart = performance.now(); });
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
