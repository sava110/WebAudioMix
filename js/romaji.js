// 同じ音のローマ字表記を受け付ける。si / shi、tu / tsu、sya / sha など。
const KANA_SPELLS = {
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
    'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'],
    'じゃ': ['zya', 'ja', 'jya'], 'じゅ': ['zyu', 'ju', 'jyu'], 'じょ': ['zyo', 'jo', 'jyo'],
    'ちゃ': ['tya', 'cha'], 'ちゅ': ['tyu', 'chu'], 'ちょ': ['tyo', 'cho'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo']
};

function readingOf(html) {
    const yomi = html.replace(/<ruby>[\s\S]*?<rt>([\s\S]*?)<\/rt><\/ruby>/g, '$1');
    const plain = yomi.replace(/<[^>]+>/g, '');
    return [...plain].map((ch) => {
        const code = ch.codePointAt(0);
        if (code >= 0x30A1 && code <= 0x30F6) return String.fromCodePoint(code - 0x60);
        return ch;
    }).join('');
}

function sokuonSpells(kana) {
    const spells = [];
    KANA_SPELLS[kana].forEach((s) => {
        if (!'aeiou'.includes(s[0])) spells.push(s[0] + s);
        spells.push('xtu' + s, 'ltu' + s);
    });
    return [...new Set(spells)];
}

function buildMoras(hira) {
    const parts = [];
    for (let i = 0; i < hira.length; i++) {
        const two = hira.slice(i, i + 2);
        if (KANA_SPELLS[two]) {
            parts.push(two);
            i += 1;
        } else {
            parts.push(hira[i]);
        }
    }
    const moras = [];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'っ') {
            const next = parts[i + 1];
            if (!next || !KANA_SPELLS[next]) throw new Error('促音の次が読めません: ' + hira);
            i += 1;
            moras.push({ kana: 'っ' + next, spells: sokuonSpells(next) });
        } else if (parts[i] === 'ん') {
            moras.push({ kana: 'ん', spells: ['nn', "n'", 'n'] });
        } else if (KANA_SPELLS[parts[i]]) {
            moras.push({ kana: parts[i], spells: KANA_SPELLS[parts[i]] });
        } else {
            throw new Error('読みに未対応の文字があります: ' + parts[i]);
        }
    }
    return moras;
}

function assignPreferred(moras, romaji) {
    let index = 0;
    const chosen = [];
    for (const mora of moras) {
        const hit = mora.spells
            .filter((s) => romaji.startsWith(s, index))
            .sort((a, b) => b.length - a.length)[0];
        if (!hit) return false;
        chosen.push(hit);
        index += hit.length;
    }
    if (index !== romaji.length) return false;
    moras.forEach((mora, i) => { mora.preferred = chosen[i]; });
    return true;
}

function fallbackPreferred(moras) {
    moras.forEach((mora, i) => {
        if (mora.kana !== 'ん') {
            mora.preferred = mora.spells[0];
            return;
        }
        const next = moras[i + 1];
        const needsBreak = next && next.spells.some((s) => /^[aiueony]/.test(s));
        mora.preferred = needsBreak ? 'nn' : 'n';
    });
}

function copyState(state) {
    return {
        moras: state.moras,
        moraIndex: state.moraIndex,
        typedBuf: state.typedBuf,
        committed: state.committed
    };
}

function commitMora(state) {
    state.committed += state.typedBuf;
    state.typedBuf = '';
    state.moraIndex += 1;
}

function advanceRomaji(state, key) {
    const mora = state.moras[state.moraIndex];
    if (!mora) return [];
    const produced = [];
    const next = state.typedBuf + key;
    const extended = mora.spells.filter((s) => s.startsWith(next));
    if (extended.length) {
        const grown = copyState(state);
        grown.typedBuf = next;
        const exact = extended.includes(next);
        const longer = extended.some((s) => s.length > next.length);
        if (exact && !longer) commitMora(grown);
        produced.push(grown);
    }
    if (mora.spells.includes(state.typedBuf) && state.moraIndex < state.moras.length - 1) {
        const holdN = mora.kana === 'ん' && state.typedBuf === 'n' && /[aiueoy]/.test(key);
        if (!holdN) {
            const flushed = copyState(state);
            commitMora(flushed);
            produced.push(...advanceRomaji(flushed, key));
        }
    }
    return produced;
}

function pickState(states) {
    const active = states.filter((s) => s.moraIndex < s.moras.length);
    const pool = active.length ? active : states;
    return pool.find((s) => {
        const mora = s.moras[s.moraIndex];
        return mora && mora.preferred.startsWith(s.typedBuf);
    }) || pool[0];
}

const RomajiInput = {
    start(word) {
        const moras = buildMoras(readingOf(word.html));
        if (!assignPreferred(moras, word.romaji)) fallbackPreferred(moras);
        return { states: [{ moras, moraIndex: 0, typedBuf: '', committed: '' }] };
    },

    type(bundle, key) {
        const seen = new Map();
        bundle.states.forEach((state) => {
            advanceRomaji(state, key).forEach((next) => {
                const id = next.moraIndex + '|' + next.typedBuf;
                if (!seen.has(id)) seen.set(id, next);
            });
        });
        if (!seen.size) return 'reject';
        bundle.states = [...seen.values()];
        return bundle.states.some((s) => s.moraIndex >= s.moras.length) ? 'done' : 'ok';
    },

    view(bundle) {
        const state = pickState(bundle.states);
        const typed = state.committed + state.typedBuf;
        if (state.moraIndex >= state.moras.length) return { typed, current: '', rest: '' };
        const mora = state.moras[state.moraIndex];
        const options = mora.spells.filter((s) => s.startsWith(state.typedBuf));
        const chosen = options.includes(mora.preferred)
            ? mora.preferred
            : options.slice().sort((a, b) => a.length - b.length)[0];
        const hint = (chosen || '').slice(state.typedBuf.length);
        const rest = state.moras.slice(state.moraIndex + 1).map((m) => m.preferred).join('');
        return { typed, current: hint.charAt(0), rest: hint.slice(1) + rest };
    }
};
