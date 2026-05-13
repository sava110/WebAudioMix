let audioCtx;
let osc = null;
let isPlaying = false;

const btn = document.getElementById('btnToggleRef');
const status = document.getElementById('statusBox');

btn.addEventListener('click', () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    if (isPlaying) {
        stopTone();
    } else {
        startTone();
    }
});

function startTone() {
    osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth'; // 測定やゲームと同じタイプ
    osc.frequency.value = 500;
    gain.gain.value = 1.0; // これを 60dB の基準とする

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();

    isPlaying = true;
    btn.textContent = "停止";
    status.textContent = "再生中：60dBに調整してください";
    status.style.background = "#fff3cd";
}

function stopTone() {
    if (osc) {
        osc.stop();
        osc = null;
    }
    isPlaying = false;
    btn.textContent = "基準音を再生";
    status.textContent = "停止中";
    status.style.background = "#22303f";
}