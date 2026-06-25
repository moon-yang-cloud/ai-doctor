/**
 * 症状分类与问诊问题库
 * ---------------------------------------------------------------------------
 * 问诊对话引擎的"剧本"，层级结构：
 *
 *   CATEGORIES（一级：科室 / 不适部位）
 *       └── conditions（二级：具体主诉）
 *               └── followups（三级：伴随症状追问，用于细化判断）
 *
 * 关键字段：
 *   condition.treats     用于推荐引擎筛选候选药的标签
 *   condition.diagnosis  默认诊断标签（对应 diagnoses.js 的 key）
 *   followup.option.implies    选中后追加的 treats 标签
 *   followup.option.diagnosis  选中后"覆盖/细化"诊断标签
 *   followup.option.redFlag    触发就医预警的 key
 * ---------------------------------------------------------------------------
 */

const CATEGORIES = [
  // ============================ 感冒 / 呼吸道 ============================
  {
    id: "respiratory",
    name: "感冒 / 呼吸道",
    icon: "",
    desc: "鼻塞、流涕、咳嗽、咽痛、打喷嚏",
    conditions: [
      {
        id: "cold",
        name: "感冒（鼻塞/流涕/打喷嚏）",
        treats: [],
        diagnosis: null,
        followups: [
          {
            id: "cold-type",
            question: "你的鼻涕和怕冷情况更接近哪种？",
            multi: false,
            options: [
              { id: "clear-nose", label: "流清水样鼻涕、明显怕冷、想多穿衣", implies: ["cold-wind-cold"], diagnosis: "cold-wind-cold" },
              { id: "yellow-nose", label: "流黄稠鼻涕、咽干口渴、感觉发热", implies: ["cold-wind-heat"], diagnosis: "cold-wind-heat" },
            ],
          },
        ],
      },
      {
        id: "sore-throat",
        name: "咽喉肿痛",
        treats: ["sore-throat"],
        diagnosis: "sore-throat",
        followups: [
          {
            id: "throat-fever",
            question: "是否伴随发热？",
            multi: false,
            options: [
              { id: "yes", label: "有，而且持续不退", implies: ["cold-wind-heat"], redFlag: "throat-high-fever" },
              { id: "no", label: "没有，主要是嗓子疼", implies: [] },
            ],
          },
        ],
      },
      {
        id: "cough",
        name: "咳嗽",
        treats: [],
        diagnosis: null,
        followups: [
          {
            id: "cough-type",
            question: "你的咳嗽是哪种？",
            multi: false,
            options: [
              { id: "dry", label: "干咳无痰、喉咙痒", implies: ["cough-dry"], diagnosis: "cough-dry" },
              { id: "phlegm", label: "有痰、咳得出东西", implies: ["cough-phlegm"], diagnosis: "cough-phlegm" },
            ],
          },
        ],
      },
      {
        id: "rhinitis",
        name: "鼻塞 / 过敏性鼻炎",
        treats: ["rhinitis"],
        diagnosis: "rhinitis",
        followups: [
          {
            id: "rhinitis-trigger",
            question: "是否在接触花粉、尘螨、冷空气后明显加重，并连续打喷嚏？",
            multi: false,
            options: [
              { id: "yes", label: "是，反复发作", implies: ["allergy"] },
              { id: "no", label: "不一定", implies: [] },
            ],
          },
        ],
      },
    ],
  },

  // ============================ 发热 ============================
  {
    id: "fever",
    name: "发热 / 发烧",
    icon: "",
    desc: "体温升高、畏寒、全身酸痛",
    conditions: [
      {
        id: "fever",
        name: "发热",
        treats: ["fever"],
        diagnosis: "fever",
        followups: [
          {
            id: "fever-level",
            question: "体温大概多少？",
            multi: false,
            options: [
              { id: "low", label: "37.3–38.5℃（低热）", implies: [] },
              { id: "high", label: "高于 38.5℃", implies: ["body-ache"] },
              { id: "very-high", label: "高于 39.5℃ 或持续 3 天以上", implies: [], redFlag: "persistent-high-fever" },
            ],
          },
          {
            id: "fever-extra",
            question: "是否伴随以下情况？（可多选）",
            multi: true,
            options: [
              { id: "ache", label: "全身肌肉酸痛", implies: ["body-ache"] },
              { id: "stiff-neck", label: "脖子僵硬、剧烈头痛、喷射性呕吐", implies: [], redFlag: "meningitis-sign" },
              { id: "none", label: "以上都没有", implies: [], exclusive: true },
            ],
          },
        ],
      },
    ],
  },

  // ============================ 疼痛 / 筋骨 ============================
  {
    id: "pain",
    name: "头痛 / 筋骨疼痛",
    icon: "",
    desc: "头痛、腰背痛、膝盖痛、肩颈痛、肌肉酸痛",
    conditions: [
      {
        id: "headache",
        name: "头痛",
        treats: ["headache"],
        diagnosis: "headache",
        followups: [
          {
            id: "headache-sign",
            question: "头痛是否伴随以下危险信号？（可多选）",
            multi: true,
            options: [
              { id: "sudden", label: "突然炸裂样剧痛，是这辈子最痛的一次", implies: [], redFlag: "thunderclap-headache" },
              { id: "weakness", label: "伴随肢体无力、口齿不清、视物模糊", implies: [], redFlag: "stroke-sign" },
              { id: "none", label: "普通胀痛/紧绷感", implies: [], exclusive: true },
            ],
          },
        ],
      },
      {
        id: "body-ache",
        name: "全身肌肉酸痛",
        treats: ["body-ache"],
        diagnosis: "body-ache",
        followups: [],
      },
      {
        id: "back-pain",
        name: "腰酸背痛",
        treats: ["back-pain", "joint-pain"],
        diagnosis: "back-pain",
        followups: [
          {
            id: "back-sign",
            question: "是否伴随以下情况？",
            multi: false,
            options: [
              { id: "radiate", label: "向下肢放射、腿麻，或大小便异常", implies: [], redFlag: "spine-nerve" },
              { id: "normal", label: "只是腰背肌肉酸胀/僵硬", implies: [] },
            ],
          },
        ],
      },
      {
        id: "knee-pain",
        name: "膝关节痛",
        treats: ["knee-pain", "joint-pain"],
        diagnosis: "knee-pain",
        followups: [
          {
            id: "knee-sign",
            question: "膝盖目前的状态？",
            multi: false,
            options: [
              { id: "swell", label: "明显红肿发热/有积液/无法弯曲", implies: [], redFlag: "joint-acute" },
              { id: "ache", label: "上下楼或久走后酸痛，外观正常", implies: [] },
            ],
          },
        ],
      },
      {
        id: "neck-pain",
        name: "肩颈痛 / 落枕",
        treats: ["neck-pain", "joint-pain"],
        diagnosis: "neck-pain",
        followups: [
          {
            id: "neck-sign",
            question: "是否伴随手臂麻木或头晕？",
            multi: false,
            options: [
              { id: "numb", label: "有手麻/头晕", implies: [], redFlag: "cervical-nerve" },
              { id: "no", label: "只是脖子肩膀僵硬酸痛", implies: [] },
            ],
          },
        ],
      },
    ],
  },

  // ============================ 口腔 / 牙齿 ============================
  {
    id: "oral",
    name: "口腔 / 牙齿",
    icon: "",
    desc: "牙痛、牙龈肿痛、口腔溃疡、腮腺炎",
    conditions: [
      {
        id: "toothache",
        name: "牙痛",
        treats: ["toothache"],
        diagnosis: "toothache",
        followups: [],
      },
      {
        id: "gingivitis",
        name: "牙龈肿痛 / 出血",
        treats: ["gingivitis"],
        diagnosis: "gingivitis",
        followups: [
          {
            id: "gum-sign",
            question: "牙龈是否化脓或伴面部肿胀？",
            multi: false,
            options: [
              { id: "pus", label: "有化脓/明显肿胀", implies: [], redFlag: "dental-abscess" },
              { id: "no", label: "只是红肿、刷牙出血", implies: [] },
            ],
          },
        ],
      },
      {
        id: "mouth-ulcer",
        name: "口腔溃疡",
        treats: ["mouth-ulcer"],
        diagnosis: "mouth-ulcer",
        followups: [
          {
            id: "ulcer-dur",
            question: "溃疡长了多久？",
            multi: false,
            options: [
              { id: "short", label: "1 周以内", implies: [] },
              { id: "long", label: "超过 2 周不愈合 / 反复发作", implies: [], redFlag: "ulcer-chronic" },
            ],
          },
        ],
      },
      {
        id: "mumps",
        name: "腮帮子肿痛（腮腺炎）",
        treats: ["mumps"],
        diagnosis: "mumps",
        followups: [
          {
            id: "mumps-sign",
            question: "是否伴随发热、张口或咀嚼时耳下疼痛加重？",
            multi: false,
            options: [
              { id: "yes", label: "是", implies: ["fever"], redFlag: "mumps-care" },
              { id: "no", label: "只是局部有点肿", implies: [], redFlag: "mumps-care" },
            ],
          },
        ],
      },
    ],
  },

  // ============================ 肠胃 / 消化 ============================
  {
    id: "digestive",
    name: "肠胃 / 消化",
    icon: "",
    desc: "腹泻、胃痛、反酸、腹胀、便秘、恶心、晕车",
    conditions: [
      {
        id: "diarrhea",
        name: "腹泻 / 拉肚子",
        treats: ["diarrhea"],
        diagnosis: "diarrhea",
        followups: [
          {
            id: "diarrhea-sign",
            question: "是否有以下情况？（可多选）",
            multi: true,
            options: [
              { id: "blood", label: "大便带血或呈黑色柏油样", implies: [], redFlag: "bloody-stool" },
              { id: "high-fever", label: "伴随高热不退", implies: [], redFlag: "diarrhea-fever" },
              { id: "dehydrate", label: "口干、尿少、明显乏力（脱水）", implies: [] },
              { id: "none", label: "只是普通拉肚子", implies: [], exclusive: true },
            ],
          },
        ],
      },
      {
        id: "stomach-pain",
        name: "胃痛 / 反酸烧心",
        treats: [],
        diagnosis: null,
        followups: [
          {
            id: "stomach-type",
            question: "更接近哪种感觉？",
            multi: false,
            options: [
              { id: "pain", label: "上腹隐痛、胀痛", implies: ["stomach-pain"], diagnosis: "stomach-pain" },
              { id: "reflux", label: "反酸、烧心、胸口灼热", implies: ["acid-reflux"], diagnosis: "acid-reflux" },
            ],
          },
          {
            id: "stomach-danger",
            question: "是否伴随呕血或黑便、剧烈疼痛？",
            multi: false,
            options: [
              { id: "yes", label: "是", implies: [], redFlag: "gi-bleed" },
              { id: "no", label: "否", implies: [] },
            ],
          },
        ],
      },
      {
        id: "indigestion",
        name: "消化不良 / 腹胀",
        treats: ["indigestion"],
        diagnosis: "indigestion",
        followups: [],
      },
      {
        id: "nausea",
        name: "恶心 / 想吐 / 晕车",
        treats: [],
        diagnosis: null,
        followups: [
          {
            id: "nausea-cause",
            question: "恶心主要出现在什么时候？",
            multi: false,
            options: [
              { id: "motion", label: "坐车/坐船时", implies: ["motion-sickness"], diagnosis: "motion-sickness" },
              { id: "stomach", label: "肠胃不适、吃坏东西时", implies: ["nausea", "indigestion"], diagnosis: "nausea" },
            ],
          },
        ],
      },
      {
        id: "constipation",
        name: "便秘",
        treats: ["constipation"],
        diagnosis: "constipation",
        followups: [
          {
            id: "consti-sign",
            question: "是否为突然出现并伴腹痛腹胀、便血？",
            multi: false,
            options: [
              { id: "yes", label: "是", implies: [], redFlag: "consti-acute" },
              { id: "no", label: "只是大便干硬、排便费力", implies: [] },
            ],
          },
        ],
      },
    ],
  },

  // ============================ 皮肤 / 过敏 ============================
  {
    id: "skin",
    name: "皮肤 / 过敏",
    icon: "",
    desc: "皮肤瘙痒、荨麻疹、湿疹、蚊虫叮咬、过敏",
    conditions: [
      {
        id: "allergy",
        name: "过敏（皮疹/瘙痒）",
        treats: ["allergy", "itching"],
        diagnosis: "allergy",
        followups: [
          {
            id: "allergy-sign",
            question: "是否伴随呼吸困难、喉头发紧、面部肿胀？",
            multi: false,
            options: [
              { id: "yes", label: "有（疑似严重过敏反应）", implies: [], redFlag: "anaphylaxis" },
              { id: "no", label: "只是皮肤瘙痒/红疹", implies: [] },
            ],
          },
        ],
      },
      {
        id: "hives",
        name: "荨麻疹（风团）",
        treats: ["hives", "itching"],
        diagnosis: "hives",
        followups: [],
      },
      {
        id: "eczema",
        name: "湿疹 / 皮炎",
        treats: ["eczema", "itching"],
        diagnosis: "eczema",
        followups: [],
      },
      {
        id: "insect-bite",
        name: "蚊虫叮咬",
        treats: ["insect-bite", "itching"],
        diagnosis: "insect-bite",
        followups: [],
      },
    ],
  },

  // ============================ 妇科 ============================
  {
    id: "women",
    name: "经期不适",
    icon: "",
    desc: "痛经、经期腹痛",
    conditions: [
      {
        id: "menstrual-pain",
        name: "痛经 / 经期腹痛",
        treats: ["menstrual-pain"],
        diagnosis: "menstrual-pain",
        followups: [
          {
            id: "dysmenorrhea-sign",
            question: "疼痛情况如何？",
            multi: false,
            options: [
              { id: "worse", label: "逐月加重 / 非经期也痛 / 经量异常", implies: [], redFlag: "dysmenorrhea-secondary" },
              { id: "usual", label: "每次经期类似的下腹坠痛", implies: [] },
            ],
          },
        ],
      },
    ],
  },

  // ============================ 眼部 ============================
  {
    id: "eye",
    name: "眼部不适",
    icon: "",
    desc: "眼红、眼干、视疲劳",
    conditions: [
      {
        id: "conjunctivitis",
        name: "眼睛发红、分泌物多",
        treats: ["conjunctivitis-bacterial"],
        diagnosis: "conjunctivitis-bacterial",
        followups: [
          {
            id: "eye-red-sign",
            question: "是否伴随视力下降或剧烈眼痛？",
            multi: false,
            options: [
              { id: "yes", label: "有视力下降 / 剧烈眼痛", implies: [], redFlag: "eye-severe" },
              { id: "no", label: "主要是发红、黄白色分泌物、晨起睁眼困难", implies: [], redFlag: "eye-infection" },
            ],
          },
        ],
      },
      {
        id: "dry-eye",
        name: "眼睛干涩、酸胀、疲劳",
        treats: ["dry-eye"],
        diagnosis: "dry-eye",
        followups: [],
      },
    ],
  },

  // ============================ 睡眠 / 情绪 ============================
  {
    id: "sleep",
    name: "睡眠 / 情绪",
    icon: "",
    desc: "入睡困难、易醒、作息紊乱",
    conditions: [
      {
        id: "insomnia",
        name: "失眠 / 入睡困难",
        treats: ["insomnia"],
        diagnosis: "insomnia",
        followups: [
          {
            id: "insomnia-dur",
            question: "失眠持续多久了？",
            multi: false,
            options: [
              { id: "short", label: "最近几天，多因作息/压力", implies: [] },
              { id: "long", label: "超过 1 个月，严重影响生活", implies: [], redFlag: "chronic-insomnia" },
            ],
          },
        ],
      },
    ],
  },
];

if (typeof window !== "undefined") {
  window.CATEGORIES = CATEGORIES;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CATEGORIES };
}
