/**
 * 用药安全核查引擎
 * ---------------------------------------------------------------------------
 * 输入：候选药物列表 + 用户安全画像（来自 DialogEngine.answers.safety）
 * 输出：
 *   - 对每个药物的安全裁决（accept / caution / block）及原因
 *   - 全局相互作用与配伍警告
 *   - 红旗症状预警
 *
 * 该引擎为纯函数式：不修改入参，返回新的结构，便于测试与复用。
 * ---------------------------------------------------------------------------
 */

class SafetyEngine {
  constructor(allergyMap, interactions, redFlags) {
    this.allergyMap = allergyMap;
    this.interactions = interactions;
    this.redFlags = redFlags;
  }

  /** 归一化安全画像：把多选数组转成易用的集合/布尔 */
  _profile(safety) {
    const get = (k) => safety[k] || [];
    return {
      allergies: get("allergy").filter((x) => x !== "none"),
      pregnancy: (get("pregnancy")[0] || "none"),
      age: (get("age")[0] || "adult"),
      chronic: get("chronic").filter((x) => x !== "none"),
      factors: get("factors").filter((x) => x !== "none"),
    };
  }

  /**
   * 对单个药物做安全裁决
   * 返回 { verdict: 'accept'|'caution'|'block', reasons: [] }
   */
  judgeMedicine(med, profile) {
    const reasons = [];
    let verdict = "accept";

    // 1) 过敏禁用（最高优先级 → block）
    for (const allergy of profile.allergies) {
      const rule = this.allergyMap[allergy];
      if (rule && med.tags.some((t) => rule.blockTags.includes(t))) {
        return { verdict: "block", reasons: [rule.text] };
      }
    }

    // 2) 孕期 / 哺乳期
    if (profile.pregnancy === "pregnant" || profile.pregnancy === "lactating") {
      const stage = profile.pregnancy === "pregnant" ? "孕期" : "哺乳期";
      if (med.pregnancy === "avoid") {
        return { verdict: "block", reasons: [`${stage}禁用：${med.name} 可能影响胎儿/婴儿。`] };
      }
      if (med.pregnancy === "caution") {
        verdict = "caution";
        reasons.push(`${stage}慎用：${med.name} 需在医生指导下使用。`);
      }
    }

    // 3) 年龄限制
    if (profile.age === "child" && med.contraAge) {
      // 有明确年龄限制说明的，提示按年龄/体重调整
      verdict = verdict === "block" ? verdict : "caution";
      reasons.push(`儿童用药请按年龄/体重调整剂量（${med.contraAge}）。`);
    }
    if (profile.age === "elderly") {
      reasons.push(`老年人代谢较慢，建议从低剂量开始并关注不良反应。`);
    }

    // 4) 慢性病提示
    for (const c of profile.chronic) {
      if (med.chronicWarn && med.chronicWarn[c]) {
        verdict = verdict === "block" ? verdict : "caution";
        reasons.push(`${med.chronicWarn[c]}`);
      }
    }

    return { verdict, reasons };
  }

  /**
   * 全局相互作用检查
   * @param {Array} acceptedMeds 通过安全裁决（accept/caution）的药物
   * @param {Object} profile 安全画像
   * 返回警告数组 [{level, text}]
   */
  checkInteractions(acceptedMeds, profile) {
    const warnings = [];
    const allTags = acceptedMeds.flatMap((m) => m.tags);
    const tagCount = {};
    for (const t of allTags) tagCount[t] = (tagCount[t] || 0) + 1;

    for (const rule of this.interactions) {
      const w = rule.when;
      let hit = false;

      // 重复成分检测
      if (w.duplicateTag) {
        if ((tagCount[w.duplicateTag] || 0) >= 2) hit = true;
      }
      // 标签 + 外部因素（酒精/抗生素/西柚/咖啡/空腹）
      else if (w.tags && w.factor) {
        const hasTag = w.tags.some((t) => allTags.includes(t));
        const hasFactor = profile.factors.includes(w.factor);
        if (hasTag && hasFactor) hit = true;
      }
      // 标签 + 与其他药同服
      else if (w.tags && w.coWith) {
        const hasTag = w.tags.some((t) => allTags.includes(t));
        if (hasTag && acceptedMeds.length > 1) hit = true;
      }

      if (hit) warnings.push({ id: rule.id, level: rule.level, text: rule.text });
    }
    return warnings;
  }

  /** 把触发的红旗 key 转成展示文本 */
  collectRedFlags(redFlagKeys) {
    const out = [];
    for (const k of Array.from(new Set(redFlagKeys))) {
      if (this.redFlags[k]) out.push({ key: k, ...this.redFlags[k] });
    }
    // danger 排前面
    out.sort((a, b) => (a.level === "danger" ? -1 : 1) - (b.level === "danger" ? -1 : 1));
    return out;
  }

  /**
   * 总入口：对候选药做完整安全分析
   * 返回 { accepted:[{med,verdict,reasons}], blocked:[...], interactions:[], redFlags:[] }
   */
  analyze(candidates, safetyAnswers, redFlagKeys) {
    const profile = this._profile(safetyAnswers);
    const accepted = [];
    const blocked = [];

    for (const med of candidates) {
      const res = this.judgeMedicine(med, profile);
      if (res.verdict === "block") {
        blocked.push({ med, ...res });
      } else {
        accepted.push({ med, ...res });
      }
    }

    const acceptedMeds = accepted.map((a) => a.med);
    const interactions = this.checkInteractions(acceptedMeds, profile);
    const redFlags = this.collectRedFlags(redFlagKeys || []);

    return { accepted, blocked, interactions, redFlags, profile };
  }
}

if (typeof window !== "undefined") {
  window.SafetyEngine = SafetyEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SafetyEngine };
}
