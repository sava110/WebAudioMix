let audioCtx;
let osc = null;
let gainNode = null;

const status = document.getElementById('statusBox');

// イベントリスナーの設定
document.getElementById('btn60dB').addEventListener('click', () => startRefTone(60));
document.getElementById('btn50dB').addEventListener('click', () => startRefTone(50));
document.getElementById('btnStop').addEventListener('click', stopTone);
document.getElementById('btnNextStep').addEventListener('click', () => {
    stopTone();
    UI.markDone('calibrate');
    location.href = 'measure.html';
});

function startRefTone(targetDB) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    stopTone(); // 既存の音を止める

    osc = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    osc.type = TONE.TYPE;
    osc.frequency.value = TONE.FREQ;

    // 本番・測定と同じ式（60dB のデジタルゲインは TONE.ATTEN = 0.07）
    const targetGain = TONE.dbToGain(targetDB);
    gainNode.gain.value = targetGain;

    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start();

    status.innerHTML = `🔊 いま <b>${targetDB}dB</b> の音が鳴っています`
        + `<span class="instruction" style="display:block;font-size:0.72em;">`
        + `アプリの数字が ${targetDB} になるまで、パソコンの音量を動かしてください（gain ${targetGain.toFixed(4)}）</span>`;
    status.className = 'status-box is-playing';
}

function stopTone() {
    if (osc) {
        osc.stop();
        osc.disconnect();
        osc = null;
    }
    status.textContent = "音は止まっています";
    status.className = 'status-box';
}