/**
 * 应用主入口
 * ---------------------------------------------------------------------------
 * 顶部导航在四个页面间切换：智能问诊 / 药物百科 / 用药自查 / 我的记录。
 * 问诊页装配数据层、引擎层与渲染器，串起问诊 → 推荐 → 渲染闭环；其余页面
 * 由各自的 UI 模块（Encyclopedia / Checker / Records）渲染到同一容器。
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  function init() {
    const root = document.getElementById("app");
    if (!root) return;

    // 引擎与渲染器
    const safetyEngine = new SafetyEngine(ALLERGY_MAP, DRUG_INTERACTIONS, RED_FLAGS);
    const recommendEngine = new RecommendEngine(MEDICINES, safetyEngine);
    const dialog = new DialogEngine(CATEGORIES);
    const renderer = new Renderer(root, Components);

    let currentPage = "consult";
    // 缓存最近一次问诊结果，供"保存/复制"使用
    let last = { result: null, diagnosis: null, conditionName: "" };

    // ---------- 问诊流程 ----------
    function advanceConsult() {
      const step = dialog.current();
      if (step.phase === "result") {
        const treats = dialog.resolvedTreats();
        const result = recommendEngine.recommend(treats, dialog.answers.safety, dialog.answers.redFlags);
        const dxTag = dialog.resolveDiagnosis();
        const diagnosis = (typeof DIAGNOSES !== "undefined" && DIAGNOSES[dxTag]) || null;
        const name = dialog.selectedCondition ? dialog.selectedCondition.name : "你的症状";
        last = { result, diagnosis, conditionName: name };
        renderer.renderResult(result, diagnosis, name);
      } else {
        renderer.renderStep(step, dialog.progress());
      }
    }

    renderer.on("answer", (ids) => { dialog.answer(ids); advanceConsult(); });
    renderer.on("restart", () => { dialog.reset(); advanceConsult(); });
    renderer.on("save", () => saveCurrent());
    renderer.on("copy", () => copyCurrent());

    function planMedNames(result) {
      if (!result) return [];
      const t = result.tiers;
      return [...t.primary, ...t.secondary, ...t.caution].map((x) => x.med.name);
    }

    function saveCurrent() {
      if (!last.result) return;
      Store.addRecord({
        conditionName: last.conditionName,
        diagnosisName: last.diagnosis ? last.diagnosis.name : "",
        advice: last.diagnosis ? last.diagnosis.advice : "",
        meds: planMedNames(last.result),
      });
      toast("已保存到我的记录");
    }

    function buildPlanText() {
      const r = last.result;
      const lines = [];
      lines.push(`【用药参考方案】`);
      if (last.diagnosis) {
        lines.push(`初步判断：${last.diagnosis.name}`);
        lines.push(`说明：${last.diagnosis.summary}`);
        lines.push(`护理建议：${last.diagnosis.advice}`);
        lines.push(`何时就医：${last.diagnosis.seeDoctor}`);
      } else {
        lines.push(`主诉：${last.conditionName}`);
      }
      if (r) {
        const tierTxt = (arr, label) => arr.forEach((x) => lines.push(`${label}：${x.med.name}（${x.med.dosage}）`));
        tierTxt(r.tiers.primary, "首选");
        tierTxt(r.tiers.secondary, "次选");
        tierTxt(r.tiers.caution, "慎用");
        if (r.interactions.length) {
          lines.push(`— 配伍提醒 —`);
          r.interactions.forEach((w) => lines.push(w.text));
        }
        if (r.redFlags.length) {
          lines.push(`— 就医预警 —`);
          r.redFlags.forEach((f) => lines.push(f.text));
        }
      }
      lines.push(`（仅供 OTC 用药参考，不替代医生/药师诊断）`);
      return lines.join("\n");
    }

    function copyCurrent() {
      if (!last.result) { toast("暂无可复制的方案"); return; }
      const text = buildPlanText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => toast("方案已复制到剪贴板")).catch(() => toast("复制失败，请手动选择文本"));
      } else {
        toast("当前环境不支持自动复制");
      }
    }

    // ---------- 页面切换 ----------
    function switchPage(page) {
      currentPage = page;
      document.querySelectorAll(".nav-tab-top").forEach((b) =>
        b.classList.toggle("active", b.dataset.page === page)
      );
      if (page === "consult") advanceConsult();
      else if (page === "encyclopedia") Encyclopedia.mount(root);
      else if (page === "checker") Checker.mount(root);
      else if (page === "records") Records.mount(root);
    }

    document.querySelectorAll(".nav-tab-top").forEach((b) =>
      b.addEventListener("click", () => switchPage(b.dataset.page))
    );

    // ---------- 提示气泡 ----------
    function toast(msg) {
      let t = document.getElementById("toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(() => t.classList.remove("show"), 2400);
    }

    // 启动：默认问诊页
    advanceConsult();

    // PWA 离线
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
