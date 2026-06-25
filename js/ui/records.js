/**
 * 我的用药记录页
 * ---------------------------------------------------------------------------
 * 展示用户在问诊结果页保存的用药参考方案（含时间、初步判断、推荐药物），
 * 支持删除单条与清空。数据来自 Store（localStorage）。
 * ---------------------------------------------------------------------------
 */

const Records = {
  root: null,

  mount(rootEl) {
    this.root = rootEl;
    this._render();
  },

  _esc(s) {
    return window.Components ? Components.esc(s) : String(s == null ? "" : s);
  },

  _fmt(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  _render() {
    const list = Store.getRecords();
    let body;
    if (!list.length) {
      body = `<div class="empty">还没有记录。在问诊结果页点击"保存到我的记录"即可留存方案。</div>`;
    } else {
      body = list.map((r) => `
        <div class="rec-item" data-id="${this._esc(r.id)}">
          <div class="rec-head">
            <span class="rec-dx">${this._esc(r.diagnosisName || r.conditionName || "用药记录")}</span>
            <button class="rec-del" data-action="del-rec">删除</button>
          </div>
          <div class="rec-time">${this._fmt(r.time)}</div>
          ${r.conditionName ? `<div class="rec-row"><b>主诉：</b>${this._esc(r.conditionName)}</div>` : ""}
          <div class="rec-row"><b>建议用药：</b>${(r.meds && r.meds.length) ? r.meds.map((m) => this._esc(m)).join("、") : "（无）"}</div>
          ${r.advice ? `<div class="rec-row"><b>护理：</b>${this._esc(r.advice)}</div>` : ""}
        </div>`).join("");
      body += `<button class="rec-clear" data-action="clear-rec">清空全部记录</button>`;
    }
    this.root.innerHTML = `
      <div class="page">
        <h2 class="page-title">我的用药记录</h2>
        <p class="page-sub">这里保存你在问诊后留存的用药参考方案，仅存于本机浏览器。</p>
        ${body}
      </div>`;
    this._bind();
  },

  _bind() {
    this.root.querySelectorAll('[data-action="del-rec"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".rec-item");
        if (item) { Store.removeRecord(item.dataset.id); this._render(); }
      });
    });
    const clear = this.root.querySelector('[data-action="clear-rec"]');
    if (clear) clear.addEventListener("click", () => { Store.clearRecords(); this._render(); });
  },
};

if (typeof window !== "undefined") window.Records = Records;
