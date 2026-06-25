/**
 * 药物推荐与评分引擎
 * ---------------------------------------------------------------------------
 * 根据问诊得到的病症标签（treats）从药物库筛选候选药，并按多维度打分排序，
 * 再交由 SafetyEngine 做安全过滤，最终归类为"首选 / 次选 / 慎用"。
 * ---------------------------------------------------------------------------
 */

class RecommendEngine {
  constructor(medicines, safetyEngine) {
    this.medicines = medicines;
    this.safety = safetyEngine;
  }

  /** 按病症标签找出所有相关候选药 */
  findCandidates(treats) {
    const set = new Set(treats);
    const list = [];
    for (const id in this.medicines) {
      const med = this.medicines[id];
      const matched = med.indications.filter((i) => set.has(i));
      if (matched.length > 0) {
        list.push({ med, matchCount: matched.length, matched });
      }
    }
    return list;
  }

  /** 起效速度转分值 */
  _onsetScore(onset) {
    return { fast: 20, medium: 12, slow: 6 }[onset] || 8;
  }

  /** 安全性转分值（越安全分越高） */
  _toxicityScore(tox) {
    return { "very-low": 24, low: 18, medium: 10, high: 2 }[tox] || 10;
  }

  /**
   * 计算单个候选药的基础评分（未含安全裁决）
   * 维度：症状匹配度 + 起效速度 + 安全性 + OTC 加分
   */
  scoreCandidate(c) {
    let s = 0;
    s += c.matchCount * 22; // 命中越多越对症
    s += this._onsetScore(c.med.onset);
    s += this._toxicityScore(c.med.toxicity);
    if (c.med.otc) s += 8; // 非处方更适合自我药疗
    return s;
  }

  /** verdict 对最终评分的调整：慎用降权，block 已被过滤 */
  _verdictAdjust(score, verdict) {
    if (verdict === "caution") return score - 30;
    return score;
  }

  /**
   * 主入口
   * @param {string[]} treats 病症标签
   * @param {object} safetyAnswers 安全画像
   * @param {string[]} redFlagKeys 红旗
   * 返回完整推荐结果
   */
  recommend(treats, safetyAnswers, redFlagKeys) {
    const candidates = this.findCandidates(treats);

    // 交给安全引擎做裁决与相互作用检查
    const safetyResult = this.safety.analyze(
      candidates.map((c) => c.med),
      safetyAnswers,
      redFlagKeys
    );

    // 把基础评分与安全裁决合并
    const scored = [];
    for (const a of safetyResult.accepted) {
      const cand = candidates.find((c) => c.med.id === a.med.id);
      const base = this.scoreCandidate(cand);
      const finalScore = this._verdictAdjust(base, a.verdict);
      scored.push({
        med: a.med,
        score: finalScore,
        verdict: a.verdict,
        reasons: a.reasons,
        matched: cand.matched,
      });
    }

    scored.sort((x, y) => y.score - x.score);

    // 分级：首选 / 次选 / 慎用
    const tiered = this._assignTiers(scored);

    return {
      tiers: tiered,
      blocked: safetyResult.blocked,
      interactions: safetyResult.interactions,
      redFlags: safetyResult.redFlags,
      hasCandidates: candidates.length > 0,
    };
  }

  /** 根据评分与裁决把结果分到三档 */
  _assignTiers(scored) {
    const tiers = { primary: [], secondary: [], caution: [] };
    let topRank = 0;
    for (const item of scored) {
      if (item.verdict === "caution") {
        tiers.caution.push(item);
      } else if (topRank < 2 && item.score >= 40) {
        tiers.primary.push(item);
        topRank++;
      } else {
        tiers.secondary.push(item);
      }
    }
    // 若没有 primary（都不够分），把得分最高的提为首选
    if (tiers.primary.length === 0 && tiers.secondary.length > 0) {
      tiers.primary.push(tiers.secondary.shift());
    }
    return tiers;
  }
}

if (typeof window !== "undefined") {
  window.RecommendEngine = RecommendEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { RecommendEngine };
}
