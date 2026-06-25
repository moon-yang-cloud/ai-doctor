/**
 * 应用主入口
 * ---------------------------------------------------------------------------
 * 装配数据层、引擎层、UI 层，串起完整的问诊 → 推荐 → 渲染闭环。
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  function init() {
    const root = document.getElementById("app");
    if (!root) return;

    // 1) 构建引擎
    const safetyEngine = new SafetyEngine(ALLERGY_MAP, DRUG_INTERACTIONS, RED_FLAGS);
    const recommendEngine = new RecommendEngine(MEDICINES, safetyEngine);
    const dialog = new DialogEngine(CATEGORIES);

    // 2) 构建渲染器
    const renderer = new Renderer(root, Components);

    // 3) 推进到下一步并刷新界面
    function advance() {
      const step = dialog.current();
      if (step.phase === "result") {
        const treats = dialog.resolvedTreats();
        const result = recommendEngine.recommend(
          treats,
          dialog.answers.safety,
          dialog.answers.redFlags
        );
        const dxTag = dialog.resolveDiagnosis();
        const diagnosis = (typeof DIAGNOSES !== "undefined" && DIAGNOSES[dxTag]) || null;
        // 病症名在结果阶段从引擎读取（"更具体"步骤可能被自动跳过，不能靠事件记录）
        const name = dialog.selectedCondition ? dialog.selectedCondition.name : "你的症状";
        renderer.renderResult(result, diagnosis, name);
      } else {
        renderer.renderStep(step, dialog.progress());
      }
    }

    // 处理用户作答
    renderer.on("answer", (optionIds) => {
      dialog.answer(optionIds);
      advance();
    });

    // 重新开始
    renderer.on("restart", () => {
      dialog.reset();
      advance();
    });

    // 启动
    advance();

    // 4) 注册 Service Worker（PWA 离线）
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
          /* 离线能力不可用时静默降级 */
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
