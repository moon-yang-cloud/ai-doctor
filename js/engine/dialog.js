/**
 * 问诊对话状态机
 * ---------------------------------------------------------------------------
 * 负责驱动整个问诊流程，维护当前所处的步骤与已采集的回答。
 * 流程阶段（phase）：
 *   'category'  选择不适类别
 *   'condition' 选择具体病症
 *   'followup'  回答该病症的伴随症状追问（可能有多个）
 *   'safety'    采集用药安全画像（过敏/孕期/年龄/慢病/在服药/饮食）
 *   'result'    生成结果
 *
 * 该模块只关心"问到哪一步、收集了什么"，不直接操作 DOM，便于单独测试。
 * ---------------------------------------------------------------------------
 */

// 通用的用药安全画像问题（所有病症共用）
const SAFETY_QUESTIONS = [
  {
    id: "allergy",
    question: "你是否对以下药物过敏？（可多选，不确定可跳过）",
    multi: true,
    optional: true,
    options: [
      { id: "penicillin", label: "青霉素类（阿莫西林等）" },
      { id: "nsaid", label: "解热镇痛药（阿司匹林/布洛芬）" },
      { id: "sulfa", label: "磺胺类" },
      { id: "none", label: "无 / 不清楚", exclusive: true },
    ],
  },
  {
    id: "pregnancy",
    question: "是否处于以下特殊生理阶段？",
    multi: false,
    options: [
      { id: "pregnant", label: "怀孕中" },
      { id: "lactating", label: "哺乳期" },
      { id: "none", label: "都不是" },
    ],
  },
  {
    id: "age",
    question: "用药者的年龄段是？",
    multi: false,
    options: [
      { id: "child", label: "12 岁以下儿童" },
      { id: "adult", label: "成人（12–65 岁）" },
      { id: "elderly", label: "65 岁以上老人" },
    ],
  },
  {
    id: "chronic",
    question: "是否有以下慢性病？（可多选）",
    multi: true,
    optional: true,
    options: [
      { id: "hypertension", label: "高血压" },
      { id: "gastritis", label: "胃溃疡 / 胃炎" },
      { id: "liver", label: "肝功能不全" },
      { id: "kidney", label: "肾功能不全" },
      { id: "heart", label: "心脏病" },
      { id: "none", label: "无", exclusive: true },
    ],
  },
  {
    id: "factors",
    question: "近期是否有以下情况？（可多选，用于配伍安全检查）",
    multi: true,
    optional: true,
    options: [
      { id: "alcohol", label: "近期饮酒 / 常喝酒" },
      { id: "antibiotic", label: "正在服用抗生素" },
      { id: "grapefruit", label: "常吃西柚 / 柚子" },
      { id: "caffeine", label: "常喝咖啡 / 浓茶" },
      { id: "none", label: "以上都没有", exclusive: true },
    ],
  },
];

class DialogEngine {
  constructor(categories, safetyQuestions = SAFETY_QUESTIONS) {
    this.categories = categories;
    this.safetyQuestions = safetyQuestions;
    this.reset();
  }

  reset() {
    this.phase = "category";
    this.selectedCategory = null;
    this.selectedCondition = null;
    this.followupIndex = 0;
    this.safetyIndex = 0;
    this.diagnosisTag = null; // 当前推断出的诊断标签
    // 采集到的所有回答
    this.answers = {
      category: null,
      condition: null,
      followups: {}, // { followupId: [optionId,...] }
      implies: [], // 累积的病症强化标签
      redFlags: [], // 触发的红旗 key
      safety: {}, // { questionId: [optionId,...] }
    };
  }

  /** 返回当前应该展示的问题描述（供 UI 渲染） */
  current() {
    switch (this.phase) {
      case "category":
        return {
          phase: "category",
          question: "你哪里不舒服？先选一个大致的方向：",
          options: this.categories.map((c) => ({
            id: c.id,
            label: c.name,
            desc: c.desc,
          })),
          multi: false,
        };
      case "condition":
        return {
          phase: "condition",
          question: "更具体一点，下面哪个最符合？",
          options: this.selectedCategory.conditions.map((c) => ({
            id: c.id,
            label: c.name,
          })),
          multi: false,
        };
      case "followup": {
        const fu = this.selectedCondition.followups[this.followupIndex];
        return {
          phase: "followup",
          question: fu.question,
          options: fu.options.map((o) => ({ id: o.id, label: o.label, exclusive: !!o.exclusive })),
          multi: !!fu.multi,
          followupId: fu.id,
        };
      }
      case "safety": {
        const q = this.safetyQuestions[this.safetyIndex];
        return {
          phase: "safety",
          question: q.question,
          options: q.options.map((o) => ({ id: o.id, label: o.label, exclusive: !!o.exclusive })),
          multi: !!q.multi,
          optional: !!q.optional,
          questionId: q.id,
        };
      }
      case "result":
      default:
        return { phase: "result" };
    }
  }

  /**
   * 提交当前问题的回答（optionIds 为选中的选项 id 数组）
   * 返回更新后的 phase。
   */
  answer(optionIds) {
    switch (this.phase) {
      case "category":
        return this._answerCategory(optionIds[0]);
      case "condition":
        return this._answerCondition(optionIds[0]);
      case "followup":
        return this._answerFollowup(optionIds);
      case "safety":
        return this._answerSafety(optionIds);
      default:
        return this.phase;
    }
  }

  _answerCategory(categoryId) {
    this.selectedCategory = this.categories.find((c) => c.id === categoryId);
    this.answers.category = categoryId;
    const conds = this.selectedCategory.conditions;
    // 该类别只有一个病症时，自动选中并跳过"更具体一点"这一步
    if (conds.length === 1) {
      return this._answerCondition(conds[0].id);
    }
    this.phase = "condition";
    return this.phase;
  }

  _answerCondition(conditionId) {
    this.selectedCondition = this.selectedCategory.conditions.find(
      (c) => c.id === conditionId
    );
    this.answers.condition = conditionId;
    // 病症自带的 treats 先并入 implies
    this.answers.implies.push(...(this.selectedCondition.treats || []));
    // 记录默认诊断标签（后续 followup 可细化覆盖）
    this.diagnosisTag = this.selectedCondition.diagnosis || null;
    this.followupIndex = 0;
    if (this.selectedCondition.followups && this.selectedCondition.followups.length > 0) {
      this.phase = "followup";
    } else {
      this.phase = "safety";
    }
    return this.phase;
  }

  _answerFollowup(optionIds) {
    const fu = this.selectedCondition.followups[this.followupIndex];
    this.answers.followups[fu.id] = optionIds;
    // 处理每个被选项的 implies 与 redFlag
    for (const oid of optionIds) {
      const opt = fu.options.find((o) => o.id === oid);
      if (!opt) continue;
      if (opt.implies) this.answers.implies.push(...opt.implies);
      if (opt.redFlag) this.answers.redFlags.push(opt.redFlag);
      if (opt.diagnosis) this.diagnosisTag = opt.diagnosis; // 细化诊断
    }
    // 进入下一个追问或安全问卷
    this.followupIndex += 1;
    if (this.followupIndex < this.selectedCondition.followups.length) {
      this.phase = "followup";
    } else {
      this.phase = "safety";
    }
    return this.phase;
  }

  _answerSafety(optionIds) {
    const q = this.safetyQuestions[this.safetyIndex];
    this.answers.safety[q.id] = optionIds;
    this.safetyIndex += 1;
    if (this.safetyIndex < this.safetyQuestions.length) {
      this.phase = "safety";
    } else {
      this.phase = "result";
    }
    return this.phase;
  }

  /** 进度（0–1），用于进度条 */
  progress() {
    const order = ["category", "condition", "followup", "safety", "result"];
    const base = order.indexOf(this.phase);
    let sub = 0;
    if (this.phase === "followup" && this.selectedCondition) {
      sub = this.followupIndex / (this.selectedCondition.followups.length || 1);
    } else if (this.phase === "safety") {
      sub = this.safetyIndex / this.safetyQuestions.length;
    }
    return Math.min(1, (base + sub) / (order.length - 1));
  }

  /** 去重后的病症标签集合 */
  resolvedTreats() {
    return Array.from(new Set(this.answers.implies));
  }

  /** 推断出的诊断标签：优先用细化标签，否则回退到第一个有效 treat */
  resolveDiagnosis() {
    if (this.diagnosisTag) return this.diagnosisTag;
    const treats = this.resolvedTreats();
    return treats.length ? treats[0] : null;
  }
}

if (typeof window !== "undefined") {
  window.DialogEngine = DialogEngine;
  window.SAFETY_QUESTIONS = SAFETY_QUESTIONS;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DialogEngine, SAFETY_QUESTIONS };
}
