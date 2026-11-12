'use strict';

/* =========================================================
   設定：Supabase の接続情報
   ・空欄のままでも動きます（その場合は「この端末だけ」に保存）
   ・Supabase の「Project Settings → API」にある
     Project URL と anon（または publishable）キーを入れてください
   ========================================================= */
const CONFIG = {
  SUPABASE_URL: 'https://dclgrltqcukguaovtydd.supabase.co',        // 例：'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: 'sb_publishable_6gorTI5LY52v0X6PfM3iJQ_O3tuMv4z',   // 例：'eyJhbGciOi...' または 'sb_publishable_...'
  TABLE: 'meal_evaluations',
};

/* =========================================================
   評価項目の定義
   type:
     scale    … 点数つきの単一選択
     single   … 単一選択
     multi    … 複数選択（exclusive は他と同時に選べない選択肢）
     text / date / textarea … 入力欄
     timer    … 開始・終了時刻の記録
   optional: true … 任意項目（それ以外は必須）
   showIf   … 条件を満たすときだけ表示
   otherText: true …「その他」を選ぶと記述欄を表示
   ========================================================= */
const SECTIONS = [
  {
    id: 'info',
    title: '基本情報',
    items: [
      { id: 'subject_id', type: 'text', label: '対象者ID', placeholder: '例：S001',
        hint: '氏名は入力せず、IDで記録してください' },
      { id: 'evaluator', type: 'text', label: '評価者ID', placeholder: '例：D001' },
      { id: 'eval_date', type: 'date', label: '評価日' },
      { id: 'meal', type: 'single', label: '食事', compact: true,
        options: ['朝食', '昼食', '夕食', 'その他'] },
    ],
  },
  {
    id: 'A',
    title: 'A：食事動作全体の自立度',
    desc: 'FIMを参考にした7段階評価。食事全体を通して、どの程度自分で食べられるかを評価する。',
    items: [
      { id: 'A', type: 'scale', label: '自立度', options: [
        [7, '声かけも手助けもなく、普通の食器で、普通の時間内に食べる'],
        [6, '自助具や食事形態の調整、または普通より長い時間が必要だが、声かけ・手助けなしで食べる'],
        [5, '自分で食べるが、声かけ・見守り・準備（切る、ほぐすなど）が必要。体には触れない'],
        [4, '職員が手を添えたのは、食事中のごく一部（1〜2回）。あとは自分で食べる'],
        [3, '手を添える手助けが3回以上あるが、自分で食べる部分のほうが多い'],
        [2, '手を添える手助けが最初から最後まで必要。自分で食べる部分は半分未満'],
        [1, '職員が食べさせる。自分では食具を動かさない、または食べない'],
      ] },
    ],
  },
  {
    id: 'B',
    title: 'B：食事動作の観察',
    items: [
      { id: 'B1', type: 'scale', label: 'B1：座位姿勢', options: [
        [5, '支えも声かけもなく、食事中ずっと座位を保てる'],
        [4, '支えは不要だが、声かけで姿勢を直す場面がある'],
        [3, '背もたれ・クッションなど物の支えが必要'],
        [2, '人が手で支える、または姿勢を直す必要がある'],
        [1, '人が支えても座位を保つことが難しい'],
      ] },
      { id: 'B1_collapse', type: 'multi', label: 'B1：崩れ方（複数選択可）',
        exclusive: ['崩れなし'],
        options: ['骨盤が後ろに倒れる', '右に傾く', '左に傾く', '前かがみ', '崩れなし'] },

      { id: 'B2', type: 'scale', label: 'B2：食具の把持・すくい動作', options: [
        [3, 'ほぼ毎回、1回でつかむ・すくうことができる'],
        [2, '動作に時間がかかる、何度か試す、食べ物を落とすなどの問題はあるが、自分で行える'],
        [1, '自分ではできず、職員の介助が必要'],
      ] },
      { id: 'B2_tools', type: 'multi', label: 'B2：使用した道具（複数選択可）',
        exclusive: ['該当なし'], otherText: true,
        options: ['箸', 'スプーン', 'フォーク', '手づかみ', 'その他',
                  ['該当なし', '該当なし（本人が道具を使用しない場合）']] },

      { id: 'B3', type: 'scale', label: 'B3：食物を口元まで運ぶ動作', options: [
        [4, 'ほぼ毎回、スムーズに口元まで運べる'],
        [3, '途中で止まる・やり直すことがあるが、自分で運べる'],
        [2, '口元まで運ぶことが難しい場面が多い'],
        [1, '自分では口元まで運べず、職員の介助が必要'],
      ] },
      { id: 'B3_comp', type: 'multi', label: 'B3：補う動き（複数選択可）',
        exclusive: ['特になし'], otherText: true,
        options: ['上体を前に倒して口を近づける', '頭を前に倒して口を近づける',
                  '反対の手で食具を持つ手や腕を支える', '肘や腕をテーブルについて運ぶ',
                  'その他', '特になし'] },

      { id: 'B4', type: 'scale', label: 'B4：食べこぼし・口の状態・一口量', options: [
        [5, '食物を適切に口に運び、食べこぼしや口の状態、一口量に明らかな問題はない'],
        [4, 'ときどき少量の食べこぼしなどがあるが、食事動作はおおむね円滑である'],
        [3, '食べこぼしや口の状態、一口量に繰り返し問題がみられる'],
        [2, '多量の食べこぼしや、一口量・口の状態の明らかな問題がみられ、食事動作に支障がある'],
        [1, '食物を口に運ぶ・口の中で処理する動作に著しい問題があり、頻繁な介助などが必要である'],
      ] },

      { id: 'B5', type: 'scale', label: 'B5：見守り・身体的介助', options: [
        [4, '支援なしで食事を進められる'],
        [3, '見守り・声かけがあれば食事を進められる'],
        [2, '一部の身体介助が必要である'],
        [1, '多くの身体介助が必要である'],
      ] },

      { id: 'B6', type: 'single', label: 'B6：食事の中断・注意がそれた回数', compact: true,
        options: ['なし', '1〜2回', '3回以上'] },
      { id: 'B6_how', type: 'multi', label: 'B6：止まり方（複数選択可）', otherText: true,
        showIf: a => hasValue(a.B6) && a.B6 !== 'なし',
        options: ['食具を持ったまま止まる', '食具を置いて止まる', '周囲を見る・話しかける',
                  '目を閉じる・眠そうな様子', '席を立とうとする', 'その他'] },

      { id: 'B7_time', type: 'timer', label: 'B7：食事時間の計測',
        hint: '「今」を押すと現在時刻が入り、所要時間を自動で選びます' },
      { id: 'B7', type: 'single', label: 'B7：食事所要時間', compact: true,
        options: ['15分未満', '15〜30分', '30〜45分', '45分以上'] },
      { id: 'B7_factor', type: 'multi', label: 'B7：中断要因（複数選択可）', compact: true,
        exclusive: ['特になし'], otherText: true,
        options: ['服薬', '会話', 'その他', '特になし'] },
    ],
  },
  {
    id: 'D',
    title: 'D：むせ・摂取量・義歯',
    items: [
      { id: 'D1', type: 'single', label: 'D1：むせ・えずきの回数',
        options: [['なし', 'なし（観察中に発生しなかった）'], '1〜2回', '3回以上'] },
      { id: 'D1_scene', type: 'multi', label: 'D1：場面（複数選択可）',
        showIf: a => hasValue(a.D1) && a.D1 !== 'なし',
        options: ['食べ物を口に入れた直後', '噛んでいる間', '飲み込んだ直後',
                  '飲み物・汁物を口にしたとき', '食事の後半', 'その他・不明'] },

      { id: 'D2', type: 'single', label: 'D2：食事全体の摂取量',
        options: [['全量', '全量（ほぼ10割）'], '約3/4', '約1/2', '約1/4',
                  ['ほとんど食べない', 'ほとんど食べない（1割以下）']] },

      { id: 'D3_use', type: 'single', label: 'D3：義歯の使用状況',
        options: ['使用している', '使用していない', '不明・確認できない'] },
      { id: 'D3_wear', type: 'single', label: 'D3：食事中の装着状況',
        showIf: a => a.D3_use === '使用している',
        options: ['装着している', '一部のみ装着している',
                  '義歯を使用しているが食事中は外している', '不明・確認できない'] },
      { id: 'D3_pain', type: 'single', label: 'D3：装着時の痛み・違和感',
        showIf: a => a.D3_use === '使用している',
        options: ['なし', 'あり', '不明・本人に確認できない'] },
    ],
  },
  {
    id: 'C',
    title: 'C：食事環境',
    items: [
      { id: 'C1', type: 'single', label: 'C1：机・椅子の高さ・配置',
        options: ['適切な高さ・配置', '調整有', '評価困難'] },
      { id: 'C2', type: 'text', label: 'C2：食形態',
        hint: '施設で使用している食形態区分を記述（分からない場合は「不明」）',
        placeholder: '例：きざみ食' },
      { id: 'C3', type: 'single', label: 'C3：座席の種類', compact: true, otherText: true,
        options: ['車いす', '椅子', 'その他'] },
    ],
  },
  {
    id: 'note',
    title: '備考',
    items: [
      { id: 'note', type: 'textarea', label: '気づいたこと', optional: true },
    ],
  },
];

const ITEMS = SECTIONS.flatMap(s => s.items);
const ITEM_MAP = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const BASE_KEYS = ['subject_id', 'evaluator', 'eval_date', 'meal'];
const TIMER_KEYS = ['B7_start', 'B7_end', 'B7_minutes'];

const LS = {
  draft: 'mealEval.draft',
  records: 'mealEval.records',
  evaluator: 'mealEval.evaluator',
  font: 'mealEval.font',
};

const FONT_LEVELS = [
  { cls: 'font-1', label: '文字：標準' },
  { cls: 'font-2', label: '文字：大' },
  { cls: 'font-3', label: '文字：特大' },
];

let ans = {};   // 現在の回答

/* ---------- 小さな道具 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children) node.append(c);
  return node;
}

function normOpt(o) {
  return Array.isArray(o) ? { v: o[0], t: o[1] } : { v: o, t: o };
}

function hasValue(v) {
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && String(v).trim() !== '';
}

function includesOther(v) {
  return Array.isArray(v) ? v.includes('その他') : v === 'その他';
}

function isVisible(item) { return !item.showIf || item.showIf(ans); }
function isRequired(item) { return !item.optional && item.type !== 'timer'; }

function loadJSON(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function toMin(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* ---------- 画面の組み立て ---------- */
function renderForm() {
  const form = $('#evalForm');
  form.innerHTML = '';
  for (const sec of SECTIONS) {
    const card = el('section', { class: 'card', id: 'sec-' + sec.id });
    card.append(el('h2', { class: 'sec-title' }, sec.title));
    if (sec.desc) card.append(el('p', { class: 'sec-desc' }, sec.desc));
    for (const item of sec.items) card.append(renderItem(item));
    form.append(card);
  }
}

function renderItem(item) {
  const wrap = el('fieldset', { class: 'q', 'data-id': item.id });
  const legend = el('legend', { class: 'q-label' }, item.label);
  if (isRequired(item)) legend.append(el('span', { class: 'req' }, '必須'));
  else if (item.type !== 'timer') legend.append(el('span', { class: 'opt' }, '任意'));
  wrap.append(legend);
  if (item.hint) wrap.append(el('p', { class: 'q-hint' }, item.hint));

  switch (item.type) {
    case 'scale':
    case 'single':
      wrap.append(renderChoices(item, 'radio'));
      break;
    case 'multi':
      wrap.append(renderChoices(item, 'checkbox'));
      break;
    case 'text':
    case 'date':
      wrap.append(el('input', {
        type: item.type, class: 'text-input', name: item.id,
        placeholder: item.placeholder || '', autocomplete: 'off',
        'aria-label': item.label,
      }));
      break;
    case 'textarea':
      wrap.append(el('textarea', { class: 'text-input', name: item.id, 'aria-label': item.label }));
      break;
    case 'timer':
      wrap.append(renderTimer());
      break;
  }

  if (item.otherText) {
    wrap.append(el('input', {
      type: 'text', class: 'text-input other-input', name: item.id + '_other',
      placeholder: '「その他」の内容（任意）', autocomplete: 'off', hidden: true,
      'aria-label': item.label + ' その他の内容',
    }));
  }
  wrap.append(el('p', { class: 'q-error' }, '⚠ この項目が未回答です'));
  return wrap;
}

function renderChoices(item, kind) {
  const cls = ['choices'];
  if (item.compact) cls.push('choices-compact');
  if (item.type === 'scale') cls.push('choices-scale');
  const list = el('div', { class: cls.join(' ') });
  for (const o of item.options.map(normOpt)) {
    const label = el('label', { class: 'choice' });
    label.append(el('input', { type: kind, name: item.id, value: String(o.v) }));
    if (item.type === 'scale') {
      label.append(el('span', { class: 'score', 'aria-hidden': 'true' }, String(o.v)));
    } else {
      label.append(el('span', { class: 'mark ' + (kind === 'radio' ? 'mark-radio' : 'mark-check'), 'aria-hidden': 'true' }));
    }
    label.append(el('span', { class: 'choice-text' }, o.t));
    list.append(label);
  }
  return list;
}

function renderTimer() {
  const box = el('div', { class: 'timer' });
  box.innerHTML = `
    <div class="timer-row">
      <label for="B7_start">開始（食具を持った時点）</label>
      <div class="timer-inputs">
        <input type="time" id="B7_start" name="B7_start" class="text-input">
        <button type="button" class="btn-now" data-now="B7_start">今</button>
      </div>
    </div>
    <div class="timer-row">
      <label for="B7_end">終了（食具を置いた時点）</label>
      <div class="timer-inputs">
        <input type="time" id="B7_end" name="B7_end" class="text-input">
        <button type="button" class="btn-now" data-now="B7_end">今</button>
      </div>
    </div>
    <p id="timerResult" class="timer-result"></p>`;
  return box;
}

/* ---------- 回答 ⇔ 画面 ---------- */
function setDomFromAns() {
  for (const input of $$('#evalForm input, #evalForm textarea')) {
    const v = ans[input.name];
    if (input.type === 'radio') input.checked = hasValue(v) && String(v) === input.value;
    else if (input.type === 'checkbox') input.checked = Array.isArray(v) && v.includes(input.value);
    else input.value = v ?? '';
  }
  refreshAll();
}

function refreshAll() {
  syncChoiceClasses();
  updateOtherInputs();
  updateVisibility();
  updateTimer(false);
  updateProgress();
}

function syncChoiceClasses() {
  for (const label of $$('#evalForm .choice')) {
    label.classList.toggle('checked', label.querySelector('input').checked);
  }
}

function updateOtherInputs() {
  for (const item of ITEMS) {
    if (!item.otherText) continue;
    const input = $(`#evalForm input[name="${item.id}_other"]`);
    if (input) input.hidden = !includesOther(ans[item.id]);
  }
}

function updateVisibility() {
  for (const item of ITEMS) {
    const wrap = $(`#evalForm .q[data-id="${item.id}"]`);
    if (wrap) wrap.hidden = !isVisible(item);
  }
}

function missingItems() {
  return ITEMS.filter(i => isVisible(i) && isRequired(i) && !hasValue(ans[i.id]));
}

function updateProgress() {
  const req = ITEMS.filter(i => isVisible(i) && isRequired(i));
  const done = req.filter(i => hasValue(ans[i.id])).length;
  $('#progressText').textContent = `回答済み ${done} / ${req.length}`;
  $('#progressFill').style.width = req.length ? `${(done / req.length) * 100}%` : '0';
}

function markErrors(list) {
  const ids = new Set(list.map(i => i.id));
  for (const wrap of $$('#evalForm .q')) {
    wrap.classList.toggle('has-error', ids.has(wrap.dataset.id));
  }
}

function clearError(id) {
  const wrap = $(`#evalForm .q[data-id="${id}"]`);
  if (wrap && hasValue(ans[id])) wrap.classList.remove('has-error');
}

/* ---------- 食事時間 ---------- */
function timeCategory(min) {
  if (min < 15) return '15分未満';
  if (min < 30) return '15〜30分';
  if (min < 45) return '30〜45分';
  return '45分以上';
}

function updateTimer(autoSelect) {
  const out = $('#timerResult');
  if (!out) return;
  const s = toMin(ans.B7_start);
  const e = toMin(ans.B7_end);

  if (s !== null && e !== null) {
    let diff = e - s;
    if (diff < 0) diff += 24 * 60;   // 日付をまたいだ場合
    ans.B7_minutes = diff;
    const cat = timeCategory(diff);
    out.textContent = `所要時間：${diff}分（${cat}）`;
    if (autoSelect && ans.B7 !== cat) {
      ans.B7 = cat;
      for (const r of $$('#evalForm input[name="B7"]')) r.checked = r.value === cat;
      syncChoiceClasses();
      clearError('B7');
    }
  } else if (s !== null) {
    delete ans.B7_minutes;
    let diff = toMin(nowHHMM()) - s;
    if (diff < 0) diff += 24 * 60;
    out.textContent = `開始から約${diff}分経過`;
  } else {
    delete ans.B7_minutes;
    out.textContent = '開始と終了を入れると所要時間を自動で選びます';
  }
}

/* ---------- 入力の受け取り ---------- */
function afterChange(name) {
  syncChoiceClasses();
  updateOtherInputs();
  updateVisibility();
  clearError(name);
  updateProgress();
  saveDraft();
}

function onChange(e) {
  const t = e.target;
  if (t.type !== 'radio' && t.type !== 'checkbox') return;
  const item = ITEM_MAP[t.name];
  if (!item) return;

  if (t.type === 'radio') {
    ans[t.name] = item.type === 'scale' ? Number(t.value) : t.value;
  } else {
    const ex = item.exclusive || [];
    const boxes = $$(`#evalForm input[name="${t.name}"]`);
    if (t.checked) {
      if (ex.includes(t.value)) {
        boxes.forEach(b => { if (b !== t) b.checked = false; });   // 「なし」系を選んだら他を外す
      } else {
        boxes.forEach(b => { if (ex.includes(b.value)) b.checked = false; });
      }
    }
    ans[t.name] = boxes.filter(b => b.checked).map(b => b.value);
  }
  afterChange(t.name);
}

function onInput(e) {
  const t = e.target;
  if (t.type === 'radio' || t.type === 'checkbox' || !t.name) return;
  ans[t.name] = t.value;
  if (t.name === 'B7_start' || t.name === 'B7_end') updateTimer(true);
  afterChange(t.name);
}

function onNowClick(e) {
  const btn = e.target.closest('[data-now]');
  if (!btn) return;
  const key = btn.dataset.now;
  const input = $('#' + key);
  input.value = nowHHMM();
  ans[key] = input.value;
  updateTimer(true);
  afterChange(key);
  toast(key === 'B7_start' ? '開始時刻を記録しました' : '終了時刻を記録しました');
}

/* ---------- 下書き（入力途中の自動保存） ---------- */
function saveDraft() { saveJSON(LS.draft, ans); }
function clearDraft() { try { localStorage.removeItem(LS.draft); } catch (e) { /* 何もしない */ } }

function freshAnswers() {
  return { evaluator: loadJSON(LS.evaluator, ''), eval_date: today() };
}

/* ---------- 保存 ---------- */
function buildRecord() {
  const data = {};
  for (const item of ITEMS) {
    if (!isVisible(item) || BASE_KEYS.includes(item.id)) continue;
    if (item.type === 'timer') {
      for (const k of TIMER_KEYS) if (hasValue(ans[k])) data[k] = ans[k];
      continue;
    }
    if (hasValue(ans[item.id])) data[item.id] = ans[item.id];
    const ok = item.id + '_other';
    if (item.otherText && includesOther(ans[item.id]) && hasValue(ans[ok])) data[ok] = ans[ok].trim();
  }
  return {
    id: uuid(),
    created_at: new Date().toISOString(),
    subject_id: String(ans.subject_id).trim(),
    evaluator: String(ans.evaluator).trim(),
    eval_date: ans.eval_date,
    meal: ans.meal,
    data,
  };
}

function loadRecords() { return loadJSON(LS.records, []); }
function saveRecords(list) { return saveJSON(LS.records, list); }

function cloudEnabled() {
  return Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
}

async function pushRecord(rec) {
  if (!cloudEnabled()) return false;
  const key = CONFIG.SUPABASE_ANON_KEY;
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  // 旧形式の anon キー（JWT）のときだけ Authorization も付ける
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  const row = {
    id: rec.id, created_at: rec.created_at, subject_id: rec.subject_id,
    evaluator: rec.evaluator, eval_date: rec.eval_date, meal: rec.meal, data: rec.data,
  };
  try {
    const url = `${CONFIG.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${CONFIG.TABLE}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(row) });
    if (res.ok || res.status === 409) return true;   // 409 = すでに送信済み
    console.warn('Supabase error', res.status, await res.text());
    return false;
  } catch (err) {
    console.warn('通信エラー', err);
    return false;
  }
}

async function onSave() {
  const missing = missingItems();
  if (missing.length) {
    markErrors(missing);
    scrollToItem(missing[0].id);
    toast(`未回答が ${missing.length} 項目あります`);
    return;
  }
  markErrors([]);

  const btn = $('#saveBtn');
  btn.disabled = true;
  btn.textContent = '保存中…';

  const rec = buildRecord();
  const list = loadRecords();
  list.unshift({ ...rec, synced: false });
  if (!saveRecords(list)) {
    btn.disabled = false;
    btn.textContent = '保存する';
    await showDialog('この端末に保存できませんでした。\n容量不足やプライベートブラウズの可能性があります。');
    return;
  }

  let msg;
  if (cloudEnabled()) {
    const ok = await pushRecord(rec);
    if (ok) markSynced([rec.id]);
    msg = ok
      ? `保存しました（送信済み）\n対象者ID：${rec.subject_id}`
      : `この端末に保存しました。\n電波が弱いなどの理由で送信できませんでした。\n「記録一覧」からあとで送信できます。`;
  } else {
    msg = `この端末に保存しました\n対象者ID：${rec.subject_id}`;
  }

  saveJSON(LS.evaluator, rec.evaluator);
  ans = freshAnswers();
  clearDraft();
  setDomFromAns();
  window.scrollTo({ top: 0 });

  btn.disabled = false;
  btn.textContent = '保存する';
  await showDialog(msg);
}

function markSynced(ids) {
  const set = new Set(ids);
  const list = loadRecords().map(r => (set.has(r.id) ? { ...r, synced: true } : r));
  saveRecords(list);
}

function scrollToItem(id) {
  const wrap = $(`#evalForm .q[data-id="${id}"]`);
  if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- 記録一覧 ---------- */
function renderHistory() {
  const list = loadRecords();
  const pending = list.filter(r => !r.synced).length;

  $('#cloudStatus').textContent = cloudEnabled()
    ? '送信先：Supabase（設定済み）'
    : '送信先：未設定（この端末だけに保存されます）';
  $('#historyCount').textContent = `この端末の記録：${list.length}件` +
    (cloudEnabled() ? `（未送信 ${pending}件）` : '');
  $('#syncBtn').hidden = !cloudEnabled();
  $('#syncBtn').disabled = pending === 0;

  const box = $('#historyList');
  box.innerHTML = '';
  if (!list.length) {
    box.append(el('p', { class: 'empty' }, 'まだ記録がありません'));
    return;
  }
  for (const r of list) {
    let badge;
    if (!cloudEnabled()) badge = el('span', { class: 'badge local' }, '端末のみ');
    else if (r.synced) badge = el('span', { class: 'badge ok' }, '✓ 送信済み');
    else badge = el('span', { class: 'badge wait' }, '未送信');

    const card = el('div', { class: 'rec' });
    card.append(el('div', { class: 'rec-top' }, el('span', { class: 'rec-id' }, r.subject_id), badge));
    card.append(el('div', { class: 'rec-meta' }, `${r.eval_date}　${r.meal}　評価者：${r.evaluator}`));
    card.append(el('div', { class: 'rec-meta' }, `A（自立度）：${r.data.A ?? '-'}　保存：${fmtDateTime(r.created_at)}`));
    box.append(card);
  }
}

async function onSync() {
  const pending = loadRecords().filter(r => !r.synced);
  if (!pending.length) return;
  const btn = $('#syncBtn');
  btn.disabled = true;
  btn.textContent = '送信中…';
  const okIds = [];
  for (const r of pending) {
    if (await pushRecord(r)) okIds.push(r.id);
  }
  markSynced(okIds);
  btn.textContent = '未送信の記録を送信する';
  renderHistory();
  const fail = pending.length - okIds.length;
  toast(fail ? `${okIds.length}件送信、${fail}件は送信できませんでした` : `${okIds.length}件を送信しました`);
}

/* ---------- CSV ---------- */
function dataColumns() {
  const cols = [];
  for (const item of ITEMS) {
    if (BASE_KEYS.includes(item.id)) continue;
    if (item.type === 'timer') { cols.push(...TIMER_KEYS); continue; }
    cols.push(item.id);
    if (item.otherText) cols.push(item.id + '_other');
  }
  return cols;
}

function csvCell(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) v = v.join('／');
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCSV() {
  const list = loadRecords();
  if (!list.length) { toast('記録がありません'); return; }
  const dcols = dataColumns();
  const header = ['id', 'created_at', ...BASE_KEYS, ...dcols, 'synced'];
  const rows = list.map(r => [
    r.id, r.created_at, ...BASE_KEYS.map(k => r[k]), ...dcols.map(c => r.data[c]), r.synced ? 1 : 0,
  ].map(csvCell).join(','));
  const csv = '﻿' + [header.join(','), ...rows].join('\r\n');   // BOM付き：Excelで文字化けしない
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `meal_eval_${today()}.csv` });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

async function onDeleteLocal() {
  const list = loadRecords();
  if (!list.length) { toast('記録がありません'); return; }
  const pending = cloudEnabled() ? list.filter(r => !r.synced).length : list.length;
  let msg = `この端末の記録 ${list.length}件を消します。`;
  if (pending) msg += `\n\n⚠ うち ${pending}件はまだ送信されていないため、消すと元に戻せません。`;
  const ok = await showDialog(msg, [
    { label: '消す', value: true, cls: 'btn-danger' },
    { label: 'やめる', value: false, cls: 'btn-secondary' },
  ]);
  if (!ok) return;
  saveRecords([]);
  renderHistory();
  toast('この端末の記録を消しました');
}

async function onClear() {
  const ok = await showDialog('入力中の内容をすべて消しますか？', [
    { label: '消す', value: true, cls: 'btn-danger' },
    { label: 'やめる', value: false, cls: 'btn-secondary' },
  ]);
  if (!ok) return;
  ans = freshAnswers();
  clearDraft();
  markErrors([]);
  setDomFromAns();
  window.scrollTo({ top: 0 });
}

/* ---------- お知らせ・確認 ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function showDialog(msg, buttons = [{ label: 'OK', value: true, cls: 'btn-primary' }]) {
  return new Promise(resolve => {
    const back = $('#dialog');
    $('#dialogMsg').textContent = msg;
    const box = $('#dialogBtns');
    box.innerHTML = '';
    for (const b of buttons) {
      const btn = el('button', { type: 'button', class: `${b.cls} btn-wide` }, b.label);
      btn.addEventListener('click', () => { back.hidden = true; resolve(b.value); });
      box.append(btn);
    }
    back.hidden = false;
    box.querySelector('button').focus();
  });
}

/* ---------- 画面切り替え・文字サイズ ---------- */
function switchView(name) {
  for (const tab of $$('.tab')) tab.classList.toggle('active', tab.dataset.view === name);
  $('#view-form').hidden = name !== 'form';
  $('#view-history').hidden = name !== 'history';
  $('#bottomBar').hidden = name !== 'form';
  $('#progress').hidden = name !== 'form';
  if (name === 'history') renderHistory();
  window.scrollTo({ top: 0 });
}

function applyFont(level) {
  const html = document.documentElement;
  FONT_LEVELS.forEach(f => html.classList.remove(f.cls));
  html.classList.add(FONT_LEVELS[level].cls);
  $('#fontBtn').textContent = FONT_LEVELS[level].label;
  saveJSON(LS.font, level);
}

/* ---------- 起動 ---------- */
function init() {
  renderForm();

  let fontLevel = loadJSON(LS.font, 1);
  if (!(fontLevel >= 0 && fontLevel < FONT_LEVELS.length)) fontLevel = 1;
  applyFont(fontLevel);
  $('#fontBtn').addEventListener('click', () => {
    fontLevel = (fontLevel + 1) % FONT_LEVELS.length;
    applyFont(fontLevel);
  });

  const form = $('#evalForm');
  form.addEventListener('change', onChange);
  form.addEventListener('input', onInput);
  form.addEventListener('click', onNowClick);
  form.addEventListener('submit', e => e.preventDefault());

  $('#saveBtn').addEventListener('click', onSave);
  $('#jumpMissingBtn').addEventListener('click', () => {
    const m = missingItems();
    if (!m.length) { toast('すべて回答済みです'); return; }
    markErrors(m);
    scrollToItem(m[0].id);
  });
  $('#clearBtn').addEventListener('click', onClear);
  $('#syncBtn').addEventListener('click', onSync);
  $('#csvBtn').addEventListener('click', exportCSV);
  $('#deleteLocalBtn').addEventListener('click', onDeleteLocal);
  for (const tab of $$('.tab')) tab.addEventListener('click', () => switchView(tab.dataset.view));

  const draft = loadJSON(LS.draft, null);
  if (draft && Object.keys(draft).length > 2) {
    ans = draft;
    toast('入力途中の内容を復元しました');
  } else {
    ans = freshAnswers();
  }
  setDomFromAns();

  // 開始だけ入っているときの経過時間表示を更新
  setInterval(() => { if (ans.B7_start && !ans.B7_end) updateTimer(false); }, 20000);

  // 電波が戻ったら未送信分を自動送信
  window.addEventListener('online', async () => {
    const pending = loadRecords().filter(r => !r.synced);
    if (!cloudEnabled() || !pending.length) return;
    const okIds = [];
    for (const r of pending) if (await pushRecord(r)) okIds.push(r.id);
    markSynced(okIds);
    if (okIds.length) toast(`未送信の ${okIds.length}件を送信しました`);
  });
}

document.addEventListener('DOMContentLoaded', init);
