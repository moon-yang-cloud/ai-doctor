/**
 * 界面渲染器
 * ---------------------------------------------------------------------------
 * 把对话引擎的当前状态、推荐结果渲染到页面，并把用户交互（点击选项、下一步、
 * 重新开始）通过回调交还给 app.js 处理。Render 不持有业务状态。
 * ---------------------------------------------------------------------------
 */

class Renderer {
  constructor(rootEl, components) {
    this.root = rootEl;
    this.C = components;
    this.selected = new Set(); // 多选时暂存
    this.handlers = {};
  }

  /** 注册事件回调：on('answer', fn) / on('restart', fn) */
  on(event, fn) {
    this.handlers[event] = fn;
  }
  _emit(event, payload) {
    if (this.handlers[event]) this.handlers[event](payload);
  }

  /** 渲染一个问诊步骤 */
  renderStep(step, progress) {
    this.selected.clear();
    this.root.innerHTML = `
      ${this.C.progressBar(progress)}
      ${this.C.questionCard(step)}
    `;
    this._bindStepEvents(step);
    this._scrollTop();
  }

  _bindStepEvents(step) {
    const optionEls = this.root.querySelectorAll(".option");
    optionEls.forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        if (step.multi) {
          this._toggleMulti(el, id, step);
        } else {
          // 单选立即提交
          this._emit("answer", [id]);
        }
      });
    });

    const nextBtn = this.root.querySelector('[data-action="next"]');
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const ids = Array.from(this.selected);
        if (ids.length === 0) {
          this._shake(nextBtn);
          return;
        }
        this._emit("answer", ids);
      });
    }
    const skipBtn = this.root.querySelector('[data-action="skip"]');
    if (skipBtn) {
      skipBtn.addEventListener("click", () => this._emit("answer", ["none"]));
    }
  }

  /** 多选切换，处理互斥项（如"无"） */
  _toggleMulti(el, id, step) {
    const opt = step.options.find((o) => o.id === id);
    const exclusive = opt && opt.exclusive;

    if (exclusive) {
      // 选中互斥项 → 清空其它
      this.selected.clear();
      this.selected.add(id);
      this.root.querySelectorAll(".option").forEach((e) => e.classList.remove("selected"));
      el.classList.add("selected");
      return;
    }

    // 选普通项 → 取消互斥项
    const exclusiveIds = step.options.filter((o) => o.exclusive).map((o) => o.id);
    for (const exId of exclusiveIds) {
      this.selected.delete(exId);
      const exEl = this.root.querySelector(`.option[data-id="${exId}"]`);
      if (exEl) exEl.classList.remove("selected");
    }

    if (this.selected.has(id)) {
      this.selected.delete(id);
      el.classList.remove("selected");
    } else {
      this.selected.add(id);
      el.classList.add("selected");
    }
  }

  /** 渲染最终结果 */
  renderResult(result, diagnosis, conditionName) {
    const C = this.C;
    let html = `<div class="result">`;
    html += `<h2 class="result-title">用药参考方案</h2>`;
    html += `<div class="result-sub">根据你描述的「${C.esc(conditionName)}」及个人情况整理</div>`;

    // 红旗预警最优先
    if (result.redFlags.length) {
      html += `<div class="redflag-zone">`;
      for (const rf of result.redFlags) {
        html += C.alertBanner(rf.level, rf.text);
      }
      html += `</div>`;
    }

    // 先给出"是什么病"的初步判断
    html += C.diagnosisCard(diagnosis);

    if (!result.hasCandidates) {
      html += `<div class="empty-result">暂未匹配到合适的家庭常备药，建议咨询医生或药师。</div>`;
    } else {
      const t = result.tiers;
      const allEmpty = !t.primary.length && !t.secondary.length && !t.caution.length;
      if (allEmpty) {
        html += `<div class="empty-result">根据你的安全情况（过敏/孕期/慢病等），常见药物均不适合自行使用，请就医。</div>`;
      } else {
        html += `<h3 class="meds-title">建议用药（按推荐程度排序）</h3>`;
        for (const item of t.primary) html += C.medCard(item, "首选", "tier-primary");
        for (const item of t.secondary) html += C.medCard(item, "次选", "tier-secondary");
        for (const item of t.caution) html += C.medCard(item, "慎用", "tier-caution");
      }
    }

    // 配伍 / 相互作用警告
    if (result.interactions.length) {
      html += `<div class="interaction-zone"><h3>配伍与相互作用提醒</h3>`;
      for (const w of result.interactions) html += C.alertBanner(w.level, w.text);
      html += `</div>`;
    }

    // 被排除的药
    html += C.blockedList(result.blocked);

    html += C.disclaimer();
    html += `<div class="result-actions">
      <button class="btn-save" data-action="save">保存到我的记录</button>
      <button class="btn-copy" data-action="copy">复制方案</button>
    </div>`;
    html += `<button class="btn-restart" data-action="restart">重新问诊</button>`;
    html += `</div>`;

    this.root.innerHTML = `${this.C.progressBar(1)}${html}`;
    const rb = this.root.querySelector('[data-action="restart"]');
    if (rb) rb.addEventListener("click", () => this._emit("restart"));
    const sb = this.root.querySelector('[data-action="save"]');
    if (sb) sb.addEventListener("click", () => this._emit("save"));
    const cb = this.root.querySelector('[data-action="copy"]');
    if (cb) cb.addEventListener("click", () => this._emit("copy"));
    this._scrollTop();
  }

  _shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth; // 触发重排以重启动画
    el.classList.add("shake");
  }

  _scrollTop() {
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

if (typeof window !== "undefined") {
  window.Renderer = Renderer;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Renderer };
}
