/**
 * 可复用 UI 组件
 * ---------------------------------------------------------------------------
 * 一组返回 HTML 字符串或 DOM 片段的纯函数，供 render.js 组装界面使用。
 * 与业务逻辑解耦，方便统一调整样式与交互。
 * ---------------------------------------------------------------------------
 */

const Components = {
  /** 转义 HTML，避免数据中的特殊字符破坏结构 */
  esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  /** 顶部进度条 */
  progressBar(ratio) {
    const pct = Math.round(ratio * 100);
    return `
      <div class="progress">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-text">问诊进度 ${pct}%</div>`;
  },

  /** 选项按钮（单选/多选样式一致，多选由交互逻辑控制） */
  optionButton(opt, multi) {
    const desc = opt.desc ? `<span class="opt-desc">${this.esc(opt.desc)}</span>` : "";
    return `
      <button class="option ${multi ? "option-multi" : ""}" data-id="${this.esc(opt.id)}">
        <span class="opt-label">${this.esc(opt.label)}</span>
        ${desc}
      </button>`;
  },

  /** 一个问题卡片（问题 + 选项 + 操作） */
  questionCard(step) {
    const opts = step.options.map((o) => this.optionButton(o, step.multi)).join("");
    const hint = step.multi
      ? `<div class="multi-hint">可多选，选完点"下一步"</div>`
      : "";
    const actions = step.multi
      ? `<div class="q-actions">
           ${step.optional ? `<button class="btn-skip" data-action="skip">跳过</button>` : ""}
           <button class="btn-next" data-action="next">下一步</button>
         </div>`
      : "";
    return `
      <div class="q-card">
        <h2 class="q-title">${this.esc(step.question)}</h2>
        ${hint}
        <div class="options">${opts}</div>
        ${actions}
      </div>`;
  },

  /** 单条药物卡片 */
  medCard(item, tierLabel, tierClass) {
    const m = item.med;
    const reasons =
      item.reasons && item.reasons.length
        ? `<div class="med-reasons">${item.reasons
            .map((r) => `<div class="reason-line">${this.esc(r)}</div>`)
            .join("")}</div>`
        : "";
    const matched = (item.matched || [])
      .map((t) => `<span class="match-tag">${this.esc(t)}</span>`)
      .join("");
    return `
      <div class="med-card ${tierClass}">
        <div class="med-head">
          <span class="tier-badge ${tierClass}">${tierLabel}</span>
          <span class="med-name">${this.esc(m.name)}</span>
        </div>
        <div class="med-generic">${this.esc(m.generic)} · ${this.esc(m.category)}</div>
        <div class="med-row"><b>用法用量：</b>${this.esc(m.dosage)}</div>
        <div class="med-row"><b>说明：</b>${this.esc(m.note)}</div>
        <div class="med-row med-side"><b>不良反应：</b>${this.esc(m.sideEffects)}</div>
        ${reasons}
        ${matched ? `<div class="match-tags">对症：${matched}</div>` : ""}
      </div>`;
  },

  /** 警告条（red flag / interaction） */
  alertBanner(level, text) {
    return `<div class="alert alert-${this.esc(level)}">${this.esc(text)}</div>`;
  },

  /** 初步判断（诊断）卡片 —— 在给药方案之前展示"是什么病" */
  diagnosisCard(dx) {
    if (!dx) return "";
    const sevText = { mild: "通常较轻微", moderate: "需要重视", attention: "需特别注意" }[dx.severity] || "";
    return `
      <div class="dx-card dx-${this.esc(dx.severity || "mild")}">
        <div class="dx-head">
          <span class="dx-tag">初步判断</span>
          <span class="dx-name">${this.esc(dx.name)}</span>
          ${sevText ? `<span class="dx-sev">${sevText}</span>` : ""}
        </div>
        <div class="dx-summary">${this.esc(dx.summary)}</div>
        <div class="dx-block"><b>护理建议：</b>${this.esc(dx.advice)}</div>
        <div class="dx-block dx-seedoctor"><b>何时就医：</b>${this.esc(dx.seeDoctor)}</div>
      </div>`;
  },

  /** 被禁用药物的折叠说明 */
  blockedList(blocked) {
    if (!blocked || !blocked.length) return "";
    const items = blocked
      .map(
        (b) =>
          `<li><b>${this.esc(b.med.name)}</b>：${this.esc(
            (b.reasons && b.reasons[0]) || "已根据你的情况排除"
          )}</li>`
      )
      .join("");
    return `
      <details class="blocked">
        <summary>已为你排除 ${blocked.length} 种不适合的药物（点击查看原因）</summary>
        <ul>${items}</ul>
      </details>`;
  },

  /** 底部免责声明 */
  disclaimer() {
    return `
      <div class="disclaimer">
        本结果由规则引擎根据你的回答生成，仅供 OTC 用药参考，<b>不能替代医生或药师的诊断</b>。
        症状严重、持续不缓解或加重时请及时就医。
      </div>`;
  },
};

if (typeof window !== "undefined") {
  window.Components = Components;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Components };
}
