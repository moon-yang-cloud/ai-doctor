/**
 * 药物百科页
 * ---------------------------------------------------------------------------
 * 提供药品库的关键词检索与详情查看，复用药物数据库（MEDICINES）与诊断库
 * （DIAGNOSES，用于把适应症标签翻译成可读病名）。采用原生 <details> 实现
 * 详情展开，输入框实时过滤列表。
 * ---------------------------------------------------------------------------
 */

const Encyclopedia = {
  root: null,
  query: "",

  mount(rootEl) {
    this.root = rootEl;
    this.query = "";
    this.root.innerHTML = `
      <div class="page">
        <h2 class="page-title">药物百科</h2>
        <p class="page-sub">查询常见非处方药（OTC）的适应症、用法用量与注意事项。仅供参考，用药请遵医嘱。</p>
        <input id="encSearch" class="enc-search" type="text" placeholder="搜索药名 / 通用名 / 分类，如 布洛芬、抗组胺" />
        <div class="enc-count" id="encCount"></div>
        <div class="enc-list" id="encList"></div>
      </div>`;
    this._renderList();
    const input = document.getElementById("encSearch");
    input.addEventListener("input", () => {
      this.query = input.value.trim();
      this._renderList();
    });
  },

  _esc(s) {
    return window.Components ? Components.esc(s) : String(s == null ? "" : s);
  },

  _label(tag) {
    if (typeof DIAGNOSES !== "undefined" && DIAGNOSES[tag]) return DIAGNOSES[tag].name;
    return tag;
  },

  _filter() {
    const all = Object.values(MEDICINES);
    const q = this.query.toLowerCase();
    if (!q) return all;
    return all.filter((m) => {
      const hay = [
        m.name, m.generic, m.category, m.note,
        (m.indications || []).map((t) => this._label(t)).join(" "),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  },

  _card(m) {
    const inds = (m.indications || []).map((t) => `<span class="enc-tag">${this._esc(this._label(t))}</span>`).join("");
    const preg = { safe: "可用", caution: "慎用", avoid: "禁用" }[m.pregnancy] || "—";
    const chronic = m.chronicWarn && Object.keys(m.chronicWarn).length
      ? Object.values(m.chronicWarn).map((t) => `<div class="enc-warn">${this._esc(t)}</div>`).join("")
      : "";
    return `
      <details class="enc-item">
        <summary>
          <span class="enc-name">${this._esc(m.name)}</span>
          <span class="enc-cat">${this._esc(m.category)}</span>
        </summary>
        <div class="enc-body">
          <div class="enc-row"><b>通用名/成分：</b>${this._esc(m.generic)}</div>
          <div class="enc-row"><b>适应症：</b>${inds || "—"}</div>
          <div class="enc-row"><b>用法用量：</b>${this._esc(m.dosage)}</div>
          <div class="enc-row"><b>不良反应：</b>${this._esc(m.sideEffects)}</div>
          <div class="enc-row"><b>孕期/哺乳：</b>${preg}　<b>是否 OTC：</b>${m.otc ? "是" : "否"}</div>
          ${m.contraAge ? `<div class="enc-row"><b>年龄限制：</b>${this._esc(m.contraAge)}</div>` : ""}
          ${chronic ? `<div class="enc-row"><b>慢性病提示：</b>${chronic}</div>` : ""}
          <div class="enc-row"><b>说明：</b>${this._esc(m.note)}</div>
        </div>
      </details>`;
  },

  _renderList() {
    const list = this._filter();
    document.getElementById("encCount").textContent = `共 ${list.length} 种药物`;
    document.getElementById("encList").innerHTML =
      list.map((m) => this._card(m)).join("") || `<div class="empty">没有匹配的药物，换个关键词试试。</div>`;
  },
};

if (typeof window !== "undefined") window.Encyclopedia = Encyclopedia;
