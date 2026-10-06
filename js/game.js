// ==========================================
// 本番セッション
// 前：文字1分 → 音1分 → 本番20音×3（あいだに休憩）→ 後：文字1分 → 音1分
// ==========================================
const NOISE_FILE_PATH = 'assets/noise/kankisen.mp3';
const NOISE_GAIN = 0.15;
const RESPONSE_WINDOW = 2000;
const BLOCK_MS = 60 * 1000;
const DUAL_TRIALS = 20;
const START_DB = 70;
const MAX_DB = 80;
const MIN_DB = 0;
const STEP_DOWN = 5;
const STEP_UP = 10;
const MIN_DELAY = 3000;
const MAX_DELAY = 10000;

const PHASES = [
    { id: 'pre_typing', kind: 'typing', title: '本番前：文字だけ（1分）' },
    { id: 'pre_sound', kind: 'sound', title: '本番前：音だけ（1分）' },
    { id: 'dual_1', kind: 'dual', title: '本番 1回目（音20回）' },
    { id: 'break_1', kind: 'break', title: '休憩' },
    { id: 'dual_2', kind: 'dual', title: '本番 2回目（音20回）' },
    { id: 'break_2', kind: 'break', title: '休憩' },
    { id: 'dual_3', kind: 'dual', title: '本番 3回目（音20回）' },
    { id: 'break_3', kind: 'break', title: '休憩' },
    { id: 'post_typing', kind: 'typing', title: '本番後：文字だけ（1分）' },
    { id: 'post_sound', kind: 'sound', title: '本番後：音だけ（1分）' }
];

const INTRO = {
    typing: '音は鳴りません。画面の文字を、1分間打ってください。si と shi のように、同じ音なら別の打ち方でも進めます。速さは1分間の打鍵数（KPM）で記録します。',
    sound: '文字は打ちません。換気扇の音の中で「ピー」が鳴ったら、スペースキーを押してください。1分で終わります。ミスしても続き、次の音は10 dB大きくなります。',
    dual: '換気扇の音の中で文字を打ちながら、鳴った音にスペースキーで答えてください。音は20回鳴ったら終わります。2回ミスでは終わりません。ミスすると次の音は10 dB大きくなります。'
};

// ハイフン入りの語は打てないので除く（80語）。html は漢字の上の振り仮名。
const WORD_LIST = [
    { romaji: 'ginkoudeteikiyokinwosuru', jp: '銀行で定期預金をする', html: '<ruby>銀行<rt>ぎんこう</rt></ruby>で<ruby>定期預金<rt>ていきよきん</rt></ruby>をする' },
    { romaji: 'purintakarainsatusuru', jp: 'プリンタから印刷する', html: 'プリンタから<ruby>印刷<rt>いんさつ</rt></ruby>する' },
    { romaji: 'hatumeikahaidaideatta', jp: '発明家は偉大であった', html: '<ruby>発明家<rt>はつめいか</rt></ruby>は<ruby>偉大<rt>いだい</rt></ruby>であった' },
    { romaji: 'asukarasingakkidesu', jp: '明日から新学期です', html: '<ruby>明日<rt>あす</rt></ruby>から<ruby>新学期<rt>しんがっき</rt></ruby>です' },
    { romaji: 'rekisinobenkyouwosuru', jp: '歴史の勉強をする', html: '<ruby>歴史<rt>れきし</rt></ruby>の<ruby>勉強<rt>べんきょう</rt></ruby>をする' },
    { romaji: 'yakeinokireinaoka', jp: '夜景のきれいな丘', html: '<ruby>夜景<rt>やけい</rt></ruby>のきれいな<ruby>丘<rt>おか</rt></ruby>' },
    { romaji: 'taikendanwoosietekudasai', jp: '体験談を教えてください', html: '<ruby>体験談<rt>たいけんだん</rt></ruby>を<ruby>教<rt>おし</rt></ruby>えてください' },
    { romaji: 'tameninaruhanasiwokiku', jp: 'ためになる話を聞く', html: 'ためになる<ruby>話<rt>はなし</rt></ruby>を<ruby>聞<rt>き</rt></ruby>く' },
    { romaji: 'kyuusyuunihtabinidemasu', jp: '九州に旅に出ます', html: '<ruby>九州<rt>きゅうしゅう</rt></ruby>に<ruby>旅<rt>たび</rt></ruby>に<ruby>出<rt>で</rt></ruby>ます' },
    { romaji: 'kyouhahisasiburinoyasumidesu', jp: '今日は久しぶりの休みです', html: '<ruby>今日<rt>きょう</rt></ruby>は<ruby>久<rt>ひさ</rt></ruby>しぶりの<ruby>休<rt>やす</rt></ruby>みです' },
    { romaji: 'sodaigominohiwokakuninsuru', jp: '粗大ごみの日を確認する', html: '<ruby>粗大<rt>そだい</rt></ruby>ごみの<ruby>日<rt>ひ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>する' },
    { romaji: 'kendouwonaratteimasita', jp: '剣道を習っていました', html: '<ruby>剣道<rt>けんどう</rt></ruby>を<ruby>習<rt>なら</rt></ruby>っていました' },
    { romaji: 'anihayuumeidaigakuniitta', jp: '兄は有名大学に行った', html: '<ruby>兄<rt>あに</rt></ruby>は<ruby>有名大学<rt>ゆうめいだいがく</rt></ruby>に<ruby>行<rt>い</rt></ruby>った' },
    { romaji: 'keikangausinawaretutuaru', jp: '景観が失われつつある', html: '<ruby>景観<rt>けいかん</rt></ruby>が<ruby>失<rt>うしな</rt></ruby>われつつある' },
    { romaji: 'isshuukanhananokakandesu', jp: '一週間は七日間です', html: '<ruby>一週間<rt>いっしゅうかん</rt></ruby>は<ruby>七日間<rt>なのかかん</rt></ruby>です' },
    { romaji: 'sanheihounoteiri', jp: '三平方の定理', html: '<ruby>三平方<rt>さんへいほう</rt></ruby>の<ruby>定理<rt>ていり</rt></ruby>' },
    { romaji: 'sinrinnnohogokatudouwosuru', jp: '森林の保護活動をする', html: '<ruby>森林<rt>しんりん</rt></ruby>の<ruby>保護活動<rt>ほごかつどう</rt></ruby>をする' },
    { romaji: 'haruyasumihaokinawaheikou', jp: '春休みは沖縄へ行こう', html: '<ruby>春休み<rt>はるやすみ</rt></ruby>は<ruby>沖縄<rt>おきなわ</rt></ruby>へ<ruby>行<rt>い</rt></ruby>こう' },
    { romaji: 'koshouwotottekudasai', jp: 'コショウを取ってください', html: 'コショウを<ruby>取<rt>と</rt></ruby>ってください' },
    { romaji: 'harugamatidoosii', jp: '春が待ち遠しい', html: '<ruby>春<rt>はる</rt></ruby>が<ruby>待<rt>ま</rt></ruby>ち<ruby>遠<rt>どお</rt></ruby>しい' },
    { romaji: 'bunkasainidekakemasu', jp: '文化祭に出かけます', html: '<ruby>文化祭<rt>ぶんかさい</rt></ruby>に<ruby>出<rt>で</rt></ruby>かけます' },
    { romaji: 'natuhauminidekaketai', jp: '夏は海に出かけたい', html: '<ruby>夏<rt>なつ</rt></ruby>は<ruby>海<rt>うみ</rt></ruby>に<ruby>出<rt>で</rt></ruby>かけたい' },
    { romaji: 'taikendanwohirousita', jp: '体験談を披露した', html: '<ruby>体験談<rt>たいけんだん</rt></ruby>を<ruby>披露<rt>ひろう</rt></ruby>した' },
    { romaji: 'asitahaasitanokazegahuku', jp: '明日は明日の風が吹く', html: '<ruby>明日<rt>あした</rt></ruby>は<ruby>明日<rt>あした</rt></ruby>の<ruby>風<rt>かぜ</rt></ruby>が<ruby>吹<rt>ふ</rt></ruby>く' },
    { romaji: 'sizimihakanzouniyoitoiu', jp: 'シジミは肝臓の良いと言う', html: 'シジミは<ruby>肝臓<rt>かんぞう</rt></ruby>の<ruby>良<rt>よ</rt></ruby>いと<ruby>言<rt>い</rt></ruby>う' },
    { romaji: 'mirainotameniimadekirukoto', jp: '未来のために今できる事', html: '<ruby>未来<rt>みらい</rt></ruby>のために<ruby>今<rt>いま</rt></ruby>できる<ruby>事<rt>こと</rt></ruby>' },
    { romaji: 'kitainikotaeru', jp: '期待に応える', html: '<ruby>期待<rt>きたい</rt></ruby>に<ruby>応<rt>こた</rt></ruby>える' },
    { romaji: 'sennnyuukanwoataeru', jp: '先入観をあたえる', html: '<ruby>先入観<rt>せんにゅうかん</rt></ruby>をあたえる' },
    { romaji: 'kyabetunosyuukakuzikida', jp: 'キャベツの収穫時期だ', html: 'キャベツの<ruby>収穫時期<rt>しゅうかくじき</rt></ruby>だ' },
    { romaji: 'ongakukanshougasukidesu', jp: '音楽鑑賞が好きです', html: '<ruby>音楽鑑賞<rt>おんがくかんしょう</rt></ruby>が<ruby>好<rt>す</rt></ruby>きです' },
    { romaji: 'keikenwotumukotomodaizidesu', jp: '経験を積む事も大事です', html: '<ruby>経験<rt>けいけん</rt></ruby>を<ruby>積<rt>つ</rt></ruby>む<ruby>事<rt>こと</rt></ruby>も<ruby>大事<rt>だいじ</rt></ruby>です' },
    { romaji: 'inhuruenzaninarimasita', jp: 'インフルエンザになりました', html: 'インフルエンザになりました' },
    { romaji: 'nihonnnosikiwotanosimu', jp: '日本の式を楽しむ', html: '<ruby>日本<rt>にほん</rt></ruby>の<ruby>式<rt>しき</rt></ruby>を<ruby>楽<rt>たの</rt></ruby>しむ' },
    { romaji: 'nihonhagiinnnaikakuseida', jp: '日本は議員内閣制だ', html: '<ruby>日本<rt>にほん</rt></ruby>は<ruby>議員内閣制<rt>ぎいんないかくせい</rt></ruby>だ' },
    { romaji: 'enkanatoriumutoiubussitu', jp: '塩化ナトリウムという物質', html: '<ruby>塩化<rt>えんか</rt></ruby>ナトリウムという<ruby>物質<rt>ぶっしつ</rt></ruby>' },
    { romaji: 'kissatendematiawasewosita', jp: '喫茶店で待ち合わせをした', html: '<ruby>喫茶店<rt>きっさてん</rt></ruby>で<ruby>待<rt>ま</rt></ruby>ち<ruby>合<rt>あ</rt></ruby>わせをした' },
    { romaji: 'itigoitiewotaisetunisuru', jp: '一期一会を大切にする', html: '<ruby>一期一会<rt>いちごいちえ</rt></ruby>を<ruby>大切<rt>たいせつ</rt></ruby>にする' },
    { romaji: 'pariniryourishugyouniiku', jp: 'パリに料理修行に行く', html: 'パリに<ruby>料理修行<rt>りょうりしゅぎょう</rt></ruby>に<ruby>行<rt>い</rt></ruby>く' },
    { romaji: 'okurerutokihadenwawokudasai', jp: '遅れるときは電話をください', html: '<ruby>遅<rt>おく</rt></ruby>れるときは<ruby>電話<rt>でんわ</rt></ruby>をください' },
    { romaji: 'doubutuennnikazokudeiku', jp: '動物園に家族で行く', html: '<ruby>動物園<rt>どうぶつえん</rt></ruby>に<ruby>家族<rt>かぞく</rt></ruby>で<ruby>行<rt>い</rt></ruby>く' },
    { romaji: 'asagohannnimisosiruwonomu', jp: '朝ごはんに味噌汁を飲む', html: '<ruby>朝<rt>あさ</rt></ruby>ごはんに<ruby>味噌汁<rt>みそしる</rt></ruby>を<ruby>飲<rt>の</rt></ruby>む' },
    { romaji: 'tosyokandehonwokarimasu', jp: '図書館で本を借ります', html: '<ruby>図書館<rt>としょかん</rt></ruby>で<ruby>本<rt>ほん</rt></ruby>を<ruby>借<rt>か</rt></ruby>ります' },
    { romaji: 'densyagaokuretekomarimasita', jp: '電車が遅れて困りました', html: '<ruby>電車<rt>でんしゃ</rt></ruby>が<ruby>遅<rt>おく</rt></ruby>れて<ruby>困<rt>こま</rt></ruby>りました' },
    { romaji: 'atarasiikutuwokainiiku', jp: '新しい靴を買いに行く', html: '<ruby>新<rt>あたら</rt></ruby>しい<ruby>靴<rt>くつ</rt></ruby>を<ruby>買<rt>か</rt></ruby>いに<ruby>行<rt>い</rt></ruby>く' },
    { romaji: 'madowoaketekazewoireru', jp: '窓を開けて風を入れる', html: '<ruby>窓<rt>まど</rt></ruby>を<ruby>開<rt>あ</rt></ruby>けて<ruby>風<rt>かぜ</rt></ruby>を<ruby>入<rt>い</rt></ruby>れる' },
    { romaji: 'tomodatitoeigawomiru', jp: '友達と映画を見る', html: '<ruby>友達<rt>ともだち</rt></ruby>と<ruby>映画<rt>えいが</rt></ruby>を<ruby>見<rt>み</rt></ruby>る' },
    { romaji: 'syukudaiwooetekaraasobu', jp: '宿題を終えてから遊ぶ', html: '<ruby>宿題<rt>しゅくだい</rt></ruby>を<ruby>終<rt>お</rt></ruby>えてから<ruby>遊<rt>あそ</rt></ruby>ぶ' },
    { romaji: 'amegahurisounanodekasawomotu', jp: '雨が降りそうなので傘を持つ', html: '<ruby>雨<rt>あめ</rt></ruby>が<ruby>降<rt>ふ</rt></ruby>りそうなので<ruby>傘<rt>かさ</rt></ruby>を<ruby>持<rt>も</rt></ruby>つ' },
    { romaji: 'reizoukonigyuunyuugaaru', jp: '冷蔵庫に牛乳がある', html: '<ruby>冷蔵庫<rt>れいぞうこ</rt></ruby>に<ruby>牛乳<rt>ぎゅうにゅう</rt></ruby>がある' },
    { romaji: 'ekimadezitensyadeiku', jp: '駅まで自転車で行く', html: '<ruby>駅<rt>えき</rt></ruby>まで<ruby>自転車<rt>じてんしゃ</rt></ruby>で<ruby>行<rt>い</rt></ruby>く' },
    { romaji: 'tegamiwokaiteposutonidasu', jp: '手紙を書いてポストに出す', html: '<ruby>手紙<rt>てがみ</rt></ruby>を<ruby>書<rt>か</rt></ruby>いてポストに<ruby>出<rt>だ</rt></ruby>す' },
    { romaji: 'siainikatteuresii', jp: '試合に勝って嬉しい', html: '<ruby>試合<rt>しあい</rt></ruby>に<ruby>勝<rt>か</rt></ruby>って<ruby>嬉<rt>うれ</rt></ruby>しい' },
    { romaji: 'yorunihosiwonagameru', jp: '夜に星を眺める', html: '<ruby>夜<rt>よる</rt></ruby>に<ruby>星<rt>ほし</rt></ruby>を<ruby>眺<rt>なが</rt></ruby>める' },
    { romaji: 'kaigisituwoyoyakusuru', jp: '会議室を予約する', html: '<ruby>会議室<rt>かいぎしつ</rt></ruby>を<ruby>予約<rt>よやく</rt></ruby>する' },
    { romaji: 'sobonoienitomariniiku', jp: '祖母の家に泊まりに行く', html: '<ruby>祖母<rt>そぼ</rt></ruby>の<ruby>家<rt>いえ</rt></ruby>に<ruby>泊<rt>と</rt></ruby>まりに<ruby>行<rt>い</rt></ruby>く' },
    { romaji: 'tizuwominagaraaruku', jp: '地図を見ながら歩く', html: '<ruby>地図<rt>ちず</rt></ruby>を<ruby>見<rt>み</rt></ruby>ながら<ruby>歩<rt>ある</rt></ruby>く' },
    { romaji: 'hananimizuwoyaru', jp: '花に水をやる', html: '<ruby>花<rt>はな</rt></ruby>に<ruby>水<rt>みず</rt></ruby>をやる' },
    { romaji: 'ongakusitudepianowohiku', jp: '音楽室でピアノを弾く', html: '<ruby>音楽室<rt>おんがくしつ</rt></ruby>でピアノを<ruby>弾<rt>ひ</rt></ruby>く' },
    { romaji: 'saihuwoieniwasureta', jp: '財布を家に忘れた', html: '<ruby>財布<rt>さいふ</rt></ruby>を<ruby>家<rt>いえ</rt></ruby>に<ruby>忘<rt>わす</rt></ruby>れた' },
    { romaji: 'akihakouyougakireidesu', jp: '秋は紅葉がきれいです', html: '<ruby>秋<rt>あき</rt></ruby>は<ruby>紅葉<rt>こうよう</rt></ruby>がきれいです' },
    { romaji: 'situmonsurutokihatewoageru', jp: '質問するときは手を挙げる', html: '<ruby>質問<rt>しつもん</rt></ruby>するときは<ruby>手<rt>て</rt></ruby>を<ruby>挙<rt>あ</rt></ruby>げる' },
    { romaji: 'kinzyonokouenwohasiru', jp: '近所の公園を走る', html: '<ruby>近所<rt>きんじょ</rt></ruby>の<ruby>公園<rt>こうえん</rt></ruby>を<ruby>走<rt>はし</rt></ruby>る' },
    { romaji: 'syasinwoarubamunisimau', jp: '写真をアルバムにしまう', html: '<ruby>写真<rt>しゃしん</rt></ruby>をアルバムにしまう' },
    { romaji: 'kazewohiitanodehayakuneru', jp: '風邪をひいたので早く寝る', html: '<ruby>風邪<rt>かぜ</rt></ruby>をひいたので<ruby>早<rt>はや</rt></ruby>く<ruby>寝<rt>ね</rt></ruby>る' },
    { romaji: 'tanzyoubinikasiwokau', jp: '誕生日にお菓子を買う', html: '<ruby>誕生日<rt>たんじょうび</rt></ruby>に<ruby>お菓子<rt>かし</rt></ruby>を<ruby>買<rt>か</rt></ruby>う' },
    { romaji: 'singougaaoninattekarawataru', jp: '信号が青になってから渡る', html: '<ruby>信号<rt>しんごう</rt></ruby>が<ruby>青<rt>あお</rt></ruby>になってから<ruby>渡<rt>わた</rt></ruby>る' },
    { romaji: 'souzikideheyawosouzisuru', jp: '掃除機で部屋を掃除する', html: '<ruby>掃除機<rt>そうじき</rt></ruby>で<ruby>部屋<rt>へや</rt></ruby>を<ruby>掃除<rt>そうじ</rt></ruby>する' },
    { romaji: 'raisyuunoyoteiwotetyounikaku', jp: '来週の予定を手帳に書く', html: '<ruby>来週<rt>らいしゅう</rt></ruby>の<ruby>予定<rt>よてい</rt></ruby>を<ruby>手帳<rt>てちょう</rt></ruby>に<ruby>書<rt>か</rt></ruby>く' },
    { romaji: 'onsennnihaittetukarewotoru', jp: '温泉に入って疲れを取る', html: '<ruby>温泉<rt>おんせん</rt></ruby>に<ruby>入<rt>はい</rt></ruby>って<ruby>疲<rt>つか</rt></ruby>れを<ruby>取<rt>と</rt></ruby>る' },
    { romaji: 'sinbunwoyondeyononakawosiru', jp: '新聞を読んで世の中を知る', html: '<ruby>新聞<rt>しんぶん</rt></ruby>を<ruby>読<rt>よ</rt></ruby>んで<ruby>世<rt>よ</rt></ruby>の<ruby>中<rt>なか</rt></ruby>を<ruby>知<rt>し</rt></ruby>る' },
    { romaji: 'kyoudaideyuuhanwotukuru', jp: '兄弟で夕飯を作る', html: '<ruby>兄弟<rt>きょうだい</rt></ruby>で<ruby>夕飯<rt>ゆうはん</rt></ruby>を<ruby>作<rt>つく</rt></ruby>る' },
    { romaji: 'bizyutukandeewomiru', jp: '美術館で絵を見る', html: '<ruby>美術館<rt>びじゅつかん</rt></ruby>で<ruby>絵<rt>え</rt></ruby>を<ruby>見<rt>み</rt></ruby>る' },
    { romaji: 'yukinoasahasizukadesu', jp: '雪の朝は静かです', html: '<ruby>雪<rt>ゆき</rt></ruby>の<ruby>朝<rt>あさ</rt></ruby>は<ruby>静<rt>しず</rt></ruby>かです' },
    { romaji: 'bangouwoteikitekinikaeru', jp: '番号を定期的に変える', html: '<ruby>番号<rt>ばんごう</rt></ruby>を<ruby>定期的<rt>ていきてき</rt></ruby>に<ruby>変<rt>か</rt></ruby>える' },
    { romaji: 'asanoaisatuwowasurenai', jp: '朝のあいさつを忘れない', html: '<ruby>朝<rt>あさ</rt></ruby>のあいさつを<ruby>忘<rt>わす</rt></ruby>れない' },
    { romaji: 'kyoukasyowohiraitekudasai', jp: '教科書を開いてください', html: '<ruby>教科書<rt>きょうかしょ</rt></ruby>を<ruby>開<rt>ひら</rt></ruby>いてください' },
    { romaji: 'yuuyakegasorawoakakusomeru', jp: '夕焼けが空を赤く染める', html: '<ruby>夕焼<rt>ゆうや</rt></ruby>けが<ruby>空<rt>そら</rt></ruby>を<ruby>赤<rt>あか</rt></ruby>く<ruby>染<rt>そ</rt></ruby>める' },
    { romaji: 'kekkawokazokunitutaeru', jp: '結果を家族に伝える', html: '<ruby>結果<rt>けっか</rt></ruby>を<ruby>家族<rt>かぞく</rt></ruby>に<ruby>伝<rt>つた</rt></ruby>える' },
    { romaji: 'yasaiwokittesaradawotukuru', jp: '野菜を切ってサラダを作る', html: '<ruby>野菜<rt>やさい</rt></ruby>を<ruby>切<rt>き</rt></ruby>ってサラダを<ruby>作<rt>つく</rt></ruby>る' },
    { romaji: 'asanosanpohakimotigaii', jp: '朝の散歩は気持ちがいい', html: '<ruby>朝<rt>あさ</rt></ruby>の<ruby>散歩<rt>さんぽ</rt></ruby>は<ruby>気持<rt>きも</rt></ruby>ちがいい' }
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
let typingState = null;
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
    typingState = RomajiInput.start(currentWordObj);
    renderWord();
}

function renderWord() {
    const view = RomajiInput.view(typingState);
    els.romajiDisplay.innerHTML =
        `<span class="typed-char">${view.typed}</span>` +
        `<span class="current-char">${view.current}</span>` +
        `<span class="untyped-char">${view.rest}</span>`;
    els.japaneseDisplay.innerHTML = currentWordObj.html;
}

function checkTyping(key) {
    if (!blockActive || inputLock || !typingState) return;
    const phase = currentPhase();
    if (phase.kind === 'sound') return;
    const result = RomajiInput.type(typingState, key.toLowerCase());
    if (result === 'reject') return;
    keystrokes += 1;
    if (result === 'done') nextWord();
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
    if (e.key.length === 1 && /[a-zA-Z']/.test(e.key)) checkTyping(e.key);
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
