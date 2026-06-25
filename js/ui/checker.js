/**
 * 用药安全自查页（相互作用检查器）
 * ---------------------------------------------------------------------------
 * 让用户独立勾选自己正在/打算同时服用的多种药物，并标注近期饮食因素，
 * 复用安全核查引擎检查它们之间的配伍禁忌、重复成分与药物-食物相互作用。
 * 与问诊流程相互独立。
 * ---------------------------------------------------------------------------
 */

const Checker = {
  root: null,
  selected: new Set(),
  query: "",
  safety: null,

  mount(rootEl) {
    this.root = rootEl;
    this.selected = new Set();
    this.query = "";
    if (!this.safety) {
      this.safety = new SafetyEngine(ALLERGY_MAP, DRUG_INTERACTIONS, RED_FLAGS);
    }
    this.root.innerHTML = `
      <div class="page">
        <h2 class="page-title">用药安全自查</h2>
        <p class="page-sub">勾选你正在或打算同时服用的药物，加上近期饮食情况，检查它们之间是否存在配伍禁忌或重复成分。</p>

        <div class="chk-section">
          <div class="chk-label">① 选择药物（可多选）</div>
          <input id="chkSearch" class="enc-search" type="text" placeholder="搜索药名筛选下表" />
          <div class="chk-meds" id="chkMeds"></div>
        </div>

        <div class="chk-section">
          <div class="chk-label">② 近期情况（可多选）</div>
          <div class="chk-factors" id="chkFactors">
            <label><input type="checkbox" value="alcohol"> 近期饮酒</label>
            <label><input type="checkbox" value="antibiotic"> 正在服用抗生素</label>
            <label><input type="checkbox" value="grapefruit"> 常吃西柚/柚子</label>
            <label><input type="checkbox" value="caffeine"> 常喝咖啡/浓茶</label>
            <label><input type="checkbox" value="empty-stomach"> 经常空腹服药</label>
          </div>
        </div>

        <button class="chk-run" id="chkRun">开始检查</button>
        <div class="chk-result" id="chkResult"></div>
      </div>`;

    this._renderMeds();
    const search = document.getElementById("chkSearch");
    search.addEventListener("input", () => { this.query = search.value.trim(); this._renderMeds(); });
    document.getElementById("chkRun").addEventListener("click", () => this._run());
  },

  _esc(s) {
    return window.Components ? Components.esc(s) : String(s == null ? "" : s);
  },

  _renderMeds() {
    const q = this.query.toLowerCase();
    const all = Object.values(MEDICINES).filter((m) =>
      !q || (m.name + m.generic + m.category).toLowerCase().includes(q)
    );
    const box = document.getElementById("chkMeds");
    box.innerHTML = all.map((m) => {
      const checked = this.selected.has(m.id) ? "checked" : "";
      return `<label class="chk-med"><input type="checkbox" value="${this._esc(m.id)}" ${checked}> ${this._esc(m.name)}</label>`;
    }).join("");
    box.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) this.selected.add(cb.value);
        else this.selected.delete(cb.value);
      });
    });
  },

  _factors() {
    return Array.from(
      document.querySelectorAll("#chkFactors input:checked")
    ).map((c) => c.value);
  },

  _run() {
    const meds = Array.from(this.selected).map((id) => MEDICINES[id]).filter(Boolean);
    const result = document.getElementById("chkResult");
    if (meds.length === 0) {
      result.innerHTML = `<div class="empty">请先勾选至少一种药物。</div>`;
      return;
    }
    const factors = this._factors();
    const warnings = this.safety.checkInteractions(meds, { factors });

    let html = `<div class="chk-summary">已选 ${meds.length} 种药物：${meds.map((m) => this._esc(m.name)).join("、")}</div>`;
    if (warnings.length === 0) {
      html += `<div class="alert alert-info">未发现明显的配伍禁忌或重复成分风险。但这不代表绝对安全，具体用药请咨询医生或药师，并仔细阅读说明书。</div>`;
    } else {
      // danger 在前
      warnings.sort((a, b) => (a.level === "danger" ? -1 : 1) - (b.level === "danger" ? -1 : 1));
      html += warnings.map((w) => `<div class="alert alert-${this._esc(w.level)}">${this._esc(w.text)}</div>`).join("");
    }
    html += `<div class="disclaimer">本检查基于内置规则库，覆盖常见家庭用药的典型相互作用，<b>不能穷尽所有情况</b>。请以专业药师意见与药品说明书为准。</div>`;
    result.innerHTML = html;
  },
};

if (typeof window !== "undefined") window.Checker = Checker;
