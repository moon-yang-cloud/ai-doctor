/**
 * 禁忌 / 相互作用 / 红旗症状库
 * ---------------------------------------------------------------------------
 * 本文件聚合三类知识：
 *   1. RED_FLAGS      —— 需要立即就医的危险信号说明
 *   2. DRUG_INTERACTIONS —— 药物-药物、药物-食物的危险组合规则
 *   3. ALLERGY_MAP    —— 过敏原与禁用药物标签的映射
 * ---------------------------------------------------------------------------
 */

// 红旗症状：key 与 symptoms.js 中 followup option 的 redFlag 对应
const RED_FLAGS = {
  "throat-high-fever": {
    level: "warn",
    text: "咽痛伴持续高热可能为细菌性扁桃体炎/链球菌感染，若 2–3 天不缓解建议就医并做血常规。",
  },
  "persistent-high-fever": {
    level: "danger",
    text: "体温超过 39.5℃ 或高热持续 3 天以上，请尽快就医，不要仅靠退烧药硬扛。",
  },
  "meningitis-sign": {
    level: "danger",
    text: "发热伴脖子僵硬、剧烈头痛、喷射性呕吐，警惕脑膜炎，请立即就医！",
  },
  "thunderclap-headache": {
    level: "danger",
    text: "突发'这辈子最痛'的炸裂样头痛，可能是脑血管意外，请立即拨打急救电话！",
  },
  "stroke-sign": {
    level: "danger",
    text: "头痛伴肢体无力、口齿不清、视物模糊是卒中（中风）征兆，争分夺秒，立即就医！",
  },
  "bloody-stool": {
    level: "danger",
    text: "大便带血或呈黑色柏油样提示消化道出血，请尽快就医，勿自行用止泻药。",
  },
  "diarrhea-fever": {
    level: "warn",
    text: "腹泻伴高热可能为细菌性肠炎，单纯止泻可能掩盖病情，建议就医评估是否需要抗生素。",
  },
  "gi-bleed": {
    level: "danger",
    text: "剧烈胃痛伴呕血/黑便提示上消化道出血，请立即就医，禁用布洛芬等刺激胃的药物。",
  },
  anaphylaxis: {
    level: "danger",
    text: "过敏伴呼吸困难、喉头发紧、面部肿胀是严重过敏反应（过敏性休克前兆），请立即拨打急救电话！",
  },
  "chronic-insomnia": {
    level: "warn",
    text: "失眠超过 1 个月并严重影响生活，建议到睡眠门诊或精神心理科就诊，而非长期自行服用助眠药。",
  },
  "spine-nerve": {
    level: "danger",
    text: "腰背痛向下肢放射、腿麻，或伴大小便异常，警惕腰椎间盘突出压迫神经，请尽快骨科就诊，勿自行推拿。",
  },
  "joint-acute": {
    level: "warn",
    text: "关节明显红肿热痛、有积液或无法弯曲，可能为急性关节炎/痛风/感染，建议就医明确诊断，不要盲目热敷。",
  },
  "cervical-nerve": {
    level: "warn",
    text: "肩颈痛伴手臂麻木或头晕，警惕神经根型/椎动脉型颈椎病，建议到骨科或康复科就诊。",
  },
  "dental-abscess": {
    level: "warn",
    text: "牙龈化脓或面部肿胀提示可能形成脓肿，口服药仅作临时控制，请尽快到口腔科处理，必要时切开引流。",
  },
  "ulcer-chronic": {
    level: "warn",
    text: "口腔溃疡超过 2 周不愈合或反复发作、面积大，需就医排查（如缺铁/免疫/罕见情况），不要长期拖延。",
  },
  "mumps-care": {
    level: "warn",
    text: "腮腺炎为病毒性传染病，建议就医确诊并隔离休息；如出现持续高热、剧烈头痛呕吐、男性睾丸肿痛，须立即就医防并发症。",
  },
  "consti-acute": {
    level: "danger",
    text: "突然出现的便秘伴明显腹痛腹胀、停止排气排便或便血，警惕肠梗阻等急症，请尽快就医，勿强行用泻药。",
  },
  "dysmenorrhea-secondary": {
    level: "warn",
    text: "痛经逐月加重、非经期也痛或经量明显异常，可能为子宫内膜异位症等继发性痛经，建议妇科就诊排查。",
  },
  "eye-infection": {
    level: "info",
    text: "红眼伴脓性分泌物多为细菌性结膜炎，传染性强：勤洗手、毛巾专用、不揉眼；2–3 天无改善或视力下降请就医。",
  },
  "eye-severe": {
    level: "danger",
    text: "眼红伴视力下降或剧烈眼痛，可能为角膜炎、虹膜炎或青光眼等严重眼病，请尽快到眼科就诊，切勿自行滴药拖延。",
  },
};

// 药物相互作用规则
// 每条规则描述触发条件与风险说明。引擎会对"已推荐药物 + 用户在服药物 + 饮食习惯"做匹配。
const DRUG_INTERACTIONS = [
  {
    id: "disulfiram",
    // 含此类标签的药物 + 酒精 = 危险
    when: { tags: ["cephalosporin", "metronidazole"], factor: "alcohol" },
    level: "danger",
    text: "头孢类 / 甲硝唑与酒精同用会引发双硫仑反应（面红、心悸、休克），用药前后 7 天严禁饮酒及含酒精食品。",
  },
  {
    id: "acetaminophen-alcohol",
    when: { tags: ["contains-acetaminophen"], factor: "alcohol" },
    level: "danger",
    text: "对乙酰氨基酚与酒精同用会显著增加肝损伤风险，服药期间请勿饮酒。",
  },
  {
    id: "acetaminophen-duplicate",
    // 多个含对乙酰氨基酚成分的药同时出现
    when: { duplicateTag: "contains-acetaminophen" },
    level: "danger",
    text: "检测到多种药物都含对乙酰氨基酚，叠加易超量伤肝。复方感冒药多已含该成分，切勿再叠加单方退烧药。",
  },
  {
    id: "nsaid-stack",
    when: { duplicateTag: "nsaid" },
    level: "warn",
    text: "同时使用多种非甾体抗炎药（如布洛芬+阿司匹林）会成倍增加胃出血风险，避免叠加。",
  },
  {
    id: "nsaid-gastric",
    when: { tags: ["gastric-irritant"], factor: "empty-stomach" },
    level: "warn",
    text: "布洛芬等需饭后服用，空腹服用刺激胃黏膜，可能引起胃痛甚至出血。",
  },
  {
    id: "adsorbent-spacing",
    when: { tags: ["adsorbent"], coWith: true },
    level: "info",
    text: "蒙脱石散会吸附同服的其他药物，请与别的药间隔至少 2 小时服用。",
  },
  {
    id: "probiotic-antibiotic",
    when: { tags: ["probiotic"], factor: "antibiotic" },
    level: "info",
    text: "益生菌与抗生素需间隔 2 小时，否则活菌会被抗生素杀灭；且不可用热水冲服。",
  },
  {
    id: "antihistamine-grapefruit",
    when: { tags: ["antihistamine-2nd"], factor: "grapefruit" },
    level: "warn",
    text: "氯雷他定等与西柚/柚子同食会升高血药浓度，服药期间避免食用。",
  },
  {
    id: "sleep-caffeine",
    when: { tags: ["sleep-aid"], factor: "caffeine" },
    level: "info",
    text: "助眠药与咖啡、浓茶作用相反，睡前请避免摄入咖啡因。",
  },
];

// 过敏原 → 禁用药物标签
const ALLERGY_MAP = {
  penicillin: {
    name: "青霉素类过敏",
    blockTags: ["penicillin"],
    text: "青霉素过敏者禁用阿莫西林等青霉素类抗生素，可能引发过敏性休克。",
  },
  nsaid: {
    name: "解热镇痛药（阿司匹林/布洛芬）过敏",
    blockTags: ["nsaid"],
    text: "对非甾体抗炎药过敏者禁用布洛芬等，可诱发哮喘或荨麻疹。",
  },
  sulfa: {
    name: "磺胺类过敏",
    blockTags: ["sulfa"],
    text: "磺胺类过敏者禁用复方磺胺甲噁唑等药物。",
  },
};

if (typeof window !== "undefined") {
  window.RED_FLAGS = RED_FLAGS;
  window.DRUG_INTERACTIONS = DRUG_INTERACTIONS;
  window.ALLERGY_MAP = ALLERGY_MAP;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { RED_FLAGS, DRUG_INTERACTIONS, ALLERGY_MAP };
}
