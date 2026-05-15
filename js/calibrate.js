let audioCtx;
let osc = null;
let gainNode = null;

const REF_DB = 60; // 基準となるdB (Gain 1.0)

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

    osc.type = 'sawtooth';
    osc.frequency.value = 1000;

    // dBからGainへの計算
    // 60dB = 1.0
    // 50dB = 10^((50-60)/20) ≒ 0.3162
    const targetGain = Math.pow(10, (targetDB - REF_DB) / 20);
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