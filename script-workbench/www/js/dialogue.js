// 台词工坊：按人物卡 + 赛道规则生成、改写、审校台词。输出固定为结构化 JSON，再由本机排版，避免格式混乱。
// 提示词用中文写（规则库也是中文），台词按台词本设定的语言输出。
import { chatJson } from "./ai.js";
import { rulesFor, findTrack, CHANNELS } from "./skill.js";
import { aiLangName, isZh, t } from "./i18n.js";

export const GENRES = {
  script: { name: "短剧 / 影视剧本" },
  novel: { name: "网文小说" },
};

// 值本身写进提示词，界面显示走翻译（goal.打脸 等）
export const GOALS = ["打脸", "身份揭晓", "反转", "对峙撕扯", "虐心", "甜宠暧昧", "立人设", "悬念钩子", "过渡日常"];
export const LENGTHS = [8, 15, 25, 40];

const SYS = (lang) => `你是一位资深的短剧编剧兼网文作者，专门负责写台词。
工作原则：
1. 只写台词和必要的动作/叙述，不写分析、不写解释、不加旁白式总结。
2. 每个角色的说话方式必须贴合人物卡（身份、性格、口头禅、对其他人的态度），换掉名字也能听出是谁在说话；不同角色语气要拉开。
3. 口语化，短句为主；有潜台词，不直接念出情绪（不写"我很生气""我好难过"）；不说教，不复述观众已知的剧情。
4. 冲突要有来回：每句话要么推进局势、要么暴露人物、要么埋钩子，没有用的寒暄删掉。
5. 禁止：AI 腔和翻译腔（"我们之间的羁绊""这一刻我明白了"）、油腻语录、空喊口号、所有人一个腔调、反派无脑送人头、人物突然大段独白。
6. 严格遵守给出的赛道规则（铁律、反面清单）；规则与用户的具体要求冲突时，以用户要求为准。
7. 输出语言：${aiLangName(lang)}。JSON 里所有给读者看的文字（标题、台词、动作、节拍、钩子）都用这种语言写，要像该语言的母语编剧写的，符合当地口语习惯和文化，不要逐字翻译中文腔。${isZh(lang) ? "" : "下面的规则摘录是中文参考资料，只借鉴其中的结构与节奏原则。"}
8. 只输出要求的 JSON，不要输出任何其他文字。`;

const FORMAT = (genre, lang) => genre === "novel"
  ? `格式（网文小说）：
- 台词条目 {"t":"line","who":"角色名","cue":"${isZh(lang) ? "说话提示语，如 冷笑一声、压低声音，≤12字，可为空" : "放在台词后面的说话动词短语，如英语 said coldly、法语 murmura、日语 冷たく言った，可为空"}","text":"台词正文，不带引号"}
- 叙述条目 {"t":"act","text":"叙述段落：动作、神态、环境或心理，30–120字（其他语言按相当篇幅），节奏要快"}
- 台词与叙述交替，不要连续堆三段以上叙述。`
  : `格式（剧本）：
- 台词条目 {"t":"line","who":"角色名","cue":"神态/语气/动作，简短，可为空","text":"台词正文，不带引号"}
- 动作条目 {"t":"act","text":"画面/动作描写，一句一条，写看得见的东西"}
- 台词单句要短（中文一般不超过 30 字）；需要更长就拆成两条。`;

function castBlock(book) {
  const cs = (book.chars || []).filter((c) => c.name);
  if (!cs.length) return "（未提供人物卡，请根据情境合理安排人物，名字保持前后一致）";
  return cs.map((c) => `- ${c.name}：${c.role || "未写身份"}${c.voice ? `；说话方式：${c.voice}` : ""}`).join("\n");
}

function trackLine(book) {
  const f = findTrack(book.channel, book.track);
  if (f) return `${f.ch.name} · ${f.type.name} · ${f.track.id}赛道（${f.track.desc}）`;
  if (CHANNELS[book.channel]) return `${CHANNELS[book.channel].name} · 未指定赛道`;
  return "不套短剧赛道规则";
}

export function passageText(items, genre) {
  return items.map((it, i) => `[${i + 1}] ` + (it.t === "line" ? `${it.who}${it.cue ? `（${it.cue}）` : ""}：${it.text}` : `（${genre === "novel" ? "叙述" : "动作"}）${it.text}`)).join("\n");
}

async function rulesBlock(book, review) {
  const r = await rulesFor(book.channel, book.track, { review });
  return r ? `\n\n【赛道规则摘录】\n${r}` : "";
}

const normItems = (arr) => (Array.isArray(arr) ? arr : [])
  .map((x) => ({ t: x?.t === "act" ? "act" : "line", who: String(x?.who || "").trim(), cue: String(x?.cue || "").trim(), text: String(x?.text || "").trim() }))
  .filter((x) => x.text && (x.t === "act" || x.who));

const lang = (book) => book.lang || "zh-CN";

// 生成一段新台词；prev 为上一段（续写时传入）
export async function generate(cfg, book, brief, { prev = null } = {}) {
  const user = `作品：${book.title || "未命名"}（${GENRES[book.genre].name}）
赛道：${trackLine(book)}

【人物卡】
${castBlock(book)}

【前情】
${brief.before || "（无）"}

【本段要写的内容】
${brief.what}

【本段目标】${(brief.goals || []).join("、") || "按情境自然推进"}
【篇幅】约 ${brief.count} 条台词（动作/叙述另计）
${brief.style ? `【额外要求】${brief.style}\n` : ""}${prev ? `\n【紧接着下面这段往后写，不要重复已有内容】\n${passageText(prev.items, book.genre)}\n` : ""}
${FORMAT(book.genre, lang(book))}

返回 JSON：
{ "title": "本段小标题，简短", "beats": "情绪节拍，如 压抑→试探→反击→打脸", "items": [ 条目… ], "hook": "结尾钩子：本段最后留下的悬念或下一段的引子，一句话（不是台词）" }${await rulesBlock(book, false)}`;
  const r = await chatJson(cfg, [{ role: "system", content: SYS(lang(book)) }, { role: "user", content: user }], { maxTokens: 8000, temperature: 1.0 });
  const items = normItems(r.items);
  if (!items.length) throw new Error(t("err.noLines"));
  return { title: String(r.title || "").slice(0, 30), beats: String(r.beats || ""), hook: String(r.hook || ""), items };
}

// 改写某一条，返回 3 个备选
export async function rewrite(cfg, book, passage, index, ask) {
  const it = passage.items[index];
  const user = `作品：${book.title || "未命名"}（${GENRES[book.genre].name}），赛道：${trackLine(book)}

【人物卡】
${castBlock(book)}

【整段内容】
${passageText(passage.items, book.genre)}

请只改写第 [${index + 1}] 条（${it.t === "line" ? `${it.who}的台词` : "动作/叙述"}），给出 3 个明显不同的备选，都要能直接替换进原位置、和上下文接得上。
改写要求：${ask || "更有力、更像这个人会说的话、更有潜台词"}
${it.t === "line" ? "说话人不变；cue 可调整。" : ""}
返回 JSON：{ "options": [ { "cue": "…", "text": "…" }, … ] }${await rulesBlock(book, false)}`;
  const r = await chatJson(cfg, [{ role: "system", content: SYS(lang(book)) }, { role: "user", content: user }], { maxTokens: 3000, temperature: 1.0 });
  const opts = (Array.isArray(r.options) ? r.options : []).map((o) => ({ cue: String(o?.cue || "").trim(), text: String(o?.text || "").trim() })).filter((o) => o.text);
  if (!opts.length) throw new Error(t("err.noOptions"));
  return opts.slice(0, 3);
}

// 按赛道清单审校一段台词；评语用界面语言写
export async function review(cfg, book, passage, uiLang) {
  const user = `请按下面的赛道规则（通用清单、审稿口诀、反面清单、命门）审校这段${book.genre === "novel" ? "小说" : "剧本"}台词，同时检查：人物语气是否贴合人物卡、角色之间是否说话一个腔、有没有 AI 腔/翻译腔/说教、有没有无效寒暄、钩子是否成立、是否像${aiLangName(lang(book))}母语者写的。
作品：${book.title || "未命名"}，赛道：${trackLine(book)}

【人物卡】
${castBlock(book)}

【待审台词】
${passageText(passage.items, book.genre)}

返回 JSON（verdict、good、rule、problem 用${aiLangName(uiLang || lang(book))}写；fix 里若给出改后台词，用台词本身的语言）：
{ "score": 0-100 的整数, "verdict": "一句话总评", "good": ["做得好的地方"], "issues": [ { "n": 对应条目编号（整段问题填 0）, "rule": "违反的规则或问题类型，简短", "problem": "具体问题", "fix": "怎么改，可直接给出改后台词" } ] }
issues 按严重程度排序，最多 8 条；没问题就返回空数组。${await rulesBlock(book, true)}`;
  const r = await chatJson(cfg, [{ role: "system", content: "你是严格的短剧/网文台词审稿编辑。只根据给出的文本和规则判断，不编造。只输出 JSON。" }, { role: "user", content: user }], { maxTokens: 4000, effort: "high", temperature: 0.3 });
  return {
    score: Math.max(0, Math.min(100, parseInt(r.score, 10) || 0)),
    verdict: String(r.verdict || ""),
    good: (Array.isArray(r.good) ? r.good : []).map(String).filter(Boolean),
    issues: (Array.isArray(r.issues) ? r.issues : []).map((x) => ({ n: parseInt(x?.n, 10) || 0, rule: String(x?.rule || ""), problem: String(x?.problem || ""), fix: String(x?.fix || "") })).filter((x) => x.problem),
    at: Date.now(),
  };
}

// ---------- 排版 ----------
// 按台词语言的书写习惯排一条：返回 { text } 或 { parts: [[类型, 文字]...], text }
export function formatItem(it, genre, lg = "zh-CN") {
  const zh = isZh(lg);
  if (it.t === "act") {
    const text = genre === "novel" ? it.text : zh ? `△ ${it.text}` : `[${it.text}]`;
    return { text };
  }
  let parts;
  if (genre !== "novel") {
    parts = zh
      ? [["who", it.who], ...(it.cue ? [["cue", `（${it.cue}）`]] : []), ["txt", `：${it.text}`]]
      : [["who", it.who], ...(it.cue ? [["cue", ` (${it.cue})`]] : []), ["txt", `: ${it.text}`]];
  } else if (lg === "zh-TW") parts = [["who", it.who], ["cue", it.cue || "道"], ["txt", `：「${it.text}」`]];
  else if (zh) parts = [["who", it.who], ["cue", it.cue || "道"], ["txt", `：“${it.text}”`]];
  else if (lg === "ja") parts = [["txt", `「${it.text}」と`], ["who", it.who], ["cue", `は${it.cue || "言った"}`], ["txt", "。"]];
  else if (lg === "fr") parts = [["txt", `« ${it.text} », `], ["cue", it.cue || "dit"], ["txt", " "], ["who", it.who], ["txt", "."]];
  else if (lg === "es") parts = [["txt", `—${it.text} —`], ["cue", it.cue || "dijo"], ["txt", " "], ["who", it.who], ["txt", "."]];
  else if (lg === "ar") parts = [["txt", `«${it.text}» `], ["cue", it.cue || "قال"], ["txt", " "], ["who", it.who], ["txt", "."]];
  else if (lg === "ko") parts = [["txt", `"${it.text}" — `], ["who", it.who], ...(it.cue ? [["cue", ` ${it.cue}`]] : [])];
  else parts = [["txt", `“${it.text}” `], ["who", it.who], ["txt", " "], ["cue", it.cue || "said"], ["txt", "."]];
  return { parts, text: parts.map((p) => p[1]).join("") };
}

export function formatPassage(p, genre, lg) {
  const out = [];
  if (p.title) out.push(isZh(lg) ? `【${p.title}】` : `## ${p.title}`);
  for (const it of p.items) out.push(formatItem(it, genre, lg).text);
  return out.join(genre === "novel" ? "\n\n" : "\n");
}

export function formatBook(book) {
  const lg = lang(book);
  const head = [book.title || "", ""];
  const cs = (book.chars || []).filter((c) => c.name);
  if (book.genre === "script" && cs.length) head.push(...cs.map((c) => `  ${c.name}${c.role ? " — " + c.role : ""}`), "");
  return head.join("\n") + "\n" + book.passages.map((p) => formatPassage(p, book.genre, lg)).join("\n\n\n") + "\n";
}
