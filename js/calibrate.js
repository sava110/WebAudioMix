let audioCtx;
let osc = null;
let gainNode = null;

const status = document.getElementById('statusBox');

// イベントリスナーの設定
document.getElementById('btn60dB').addEventListener('click', () => startRefTone(60));
document.getElementById('btn50dB').addEventListener('click', () => startRefTone(50));
document.getElementById('btnStop').addEventListener('click', stopTone);

function startRefTone(targetDB) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    stopTone(); // 既存の音を止める

    osc = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    osc.type = TONE.TYPE;
    osc.frequency.value = TONE.FREQ;

    // 本番・測定と同じ式（60dB のデジタルゲインは 0.1）
    const targetGain = TONE.dbToGain(targetDB);
    gainNode.gain.value = targetGain;

    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start();

    status.textContent = `再生中: ${targetDB}dB モード (Gain: ${targetGain.toFixed(4)})`;
    status.style.background = "#fff3cd";
    status.style.color = "#856404";
}

function stopTone() {
    if (osc) {
        osc.stop();
        osc.disconnect();
        osc = null;
    }
    status.textContent = "停止中";
    status.style.background = "#22303f";
    status.style.color = "#ecf0f1";
}