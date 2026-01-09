// トレーニング用の変数
let currentTrainingVol = 0.5; // スタート時の音量
let successCount = 0;         // 連続正解数

function startTrainingRound() {
    // 1. ランダムな待ち時間を設定
    let delay = Math.random() * 5000 + 2000;

    setTimeout(() => {
        // 2. 音を一瞬だけ鳴らす（0.5秒間など）
        playSoundBriefly(currentTrainingVol);

        // 3. ユーザーの入力を待つ（受付時間 2秒）
        waitForReaction(2000).then(isReacted => {
            if (isReacted) {
                // 正解！
                showFeedback("Good!", "green");
                successCount++;

                // 3回連続正解で難易度アップ（音を小さく）
                if (successCount >= 3) {
                    currentTrainingVol -= 0.05;
                    successCount = 0;
                    showLevelUp("Level Up!");
                }
            } else {
                // 聞き逃し...
                showFeedback("Miss...", "red");
                successCount = 0;

                // 難易度ダウン（音を大きく）
                currentTrainingVol += 0.05;
            }

            // 次のラウンドへ
            startTrainingRound();
        });
    }, delay);
}
