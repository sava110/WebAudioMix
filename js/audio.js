// 校正・静寂測定・音だけ・本番で共通の純音
const TONE = {
    FREQ: 1000,
    TYPE: 'sine',
    REF_DB: 60,
    // ノイズと足したときの割れを防ぐ減衰。全画面で同じ式にする。
    ATTEN: 0.1,
    DURATION_SEC: 0.5,
    dbToGain(db) {
        return Math.pow(10, (db - this.REF_DB) / 20) * this.ATTEN;
    }
};
