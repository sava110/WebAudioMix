// 校正・静寂測定・音だけ・本番で共通の純音
const TONE = {
    FREQ: 1000,
    TYPE: 'sine',
    REF_DB: 60,
    // ノイズと足したときの割れを防ぐ減衰。全画面で同じ式にする。
    // 0.07 なら純音 80 dB でピークが 0.70 に収まり、雑音を足しても 1.0 を超えない。
    ATTEN: 0.07,
    DURATION_SEC: 0.5,
    // 換気扇音ファイルの RMS。ffmpeg の volumedetect による実測値。
    NOISE_FILE_RMS_DBFS: -21.9,
    dbToGain(db) {
        return Math.pow(10, (db - this.REF_DB) / 20) * this.ATTEN;
    },
    // 雑音を純音と同じ dB スケールに載せる。同じ dB の正弦波と RMS をそろえる。
    noiseDbToGain(db) {
        const rms = this.dbToGain(db) * Math.SQRT1_2;
        return rms / Math.pow(10, this.NOISE_FILE_RMS_DBFS / 20);
    }
};
