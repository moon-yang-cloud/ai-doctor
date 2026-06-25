/**
 * 诊断知识库
 * ---------------------------------------------------------------------------
 * 把问诊得到的"诊断标签"翻译成可读的初步判断说明。系统会在给出用药方案之前，
 * 先向用户展示"初步判断（疑似什么病）+ 通俗解释 + 护理建议 + 何时就医"。
 *
 * 字段说明：
 *   name      病症的通俗名称（含可能的医学名）
 *   summary   一句话通俗解释，帮助用户理解
 *   advice    非药物的护理/生活建议
 *   seeDoctor 建议就医的情形
 *   severity  'mild' | 'moderate' | 'attention'，用于诊断卡片配色与提示语气
 * ---------------------------------------------------------------------------
 */

const DIAGNOSES = {
  // ---- 呼吸道 ----
  "cold-wind-cold": {
    name: "风寒感冒",
    summary: "受凉引起的普通感冒，特点是怕冷明显、流清水样鼻涕、打喷嚏、无汗。",
    advice: "多喝热水、注意保暖，可喝姜汤发汗，保证休息。",
    seeDoctor: "症状超过 1 周不缓解，或出现高热、胸闷气短时就医。",
    severity: "mild",
  },
  "cold-wind-heat": {
    name: "风热感冒",
    summary: "多见于换季或上火，特点是咽干咽痛、流黄稠鼻涕、口渴、可有低热。",
    advice: "多饮温水、清淡饮食，避免辛辣油腻。",
    seeDoctor: "高热不退、咽痛剧烈或扁桃体化脓时建议就医查血常规。",
    severity: "mild",
  },
  "sore-throat": {
    name: "咽喉肿痛（急性咽炎 / 扁桃体炎）",
    summary: "咽部黏膜或扁桃体的炎症，吞咽时疼痛，可能由病毒或细菌引起。",
    advice: "多喝水、含润喉片、少说话，避免烟酒和辛辣。",
    seeDoctor: "伴持续高热、扁桃体有脓点或张口困难时，需就医排查细菌感染。",
    severity: "moderate",
  },
  "cough-dry": {
    name: "干咳（刺激性咳嗽）",
    summary: "无痰或少痰的咳嗽，常因咽喉受刺激、过敏或感冒后期所致。",
    advice: "保持空气湿润，避免冷风和刺激性气味，多喝温水。",
    seeDoctor: "干咳超过 2 周、夜间加重或伴气喘、咯血时就医。",
    severity: "mild",
  },
  "cough-phlegm": {
    name: "有痰咳嗽（痰湿咳嗽）",
    summary: "伴有痰液的咳嗽，需要化痰排痰，而非单纯镇咳。",
    advice: "多喝水稀释痰液，拍背帮助排痰，戒烟。",
    seeDoctor: "痰呈黄绿色、伴发热或胸痛、痰中带血时就医。",
    severity: "moderate",
  },
  rhinitis: {
    name: "鼻炎 / 鼻塞",
    summary: "鼻黏膜炎症导致鼻塞、流涕、打喷嚏，过敏性鼻炎常反复发作。",
    advice: "远离过敏原（尘螨/花粉），可用生理盐水洗鼻。",
    seeDoctor: "长期鼻塞、嗅觉减退或反复发作影响生活时到耳鼻喉科就诊。",
    severity: "mild",
  },

  // ---- 发热 ----
  fever: {
    name: "发热（发烧）",
    summary: "体温升高是身体对抗感染的反应，多由病毒或细菌感染引起。",
    advice: "多喝水、物理降温、充分休息，38.5℃ 以下优先物理降温。",
    seeDoctor: "超过 39.5℃、持续 3 天以上，或伴意识改变、抽搐时立即就医。",
    severity: "moderate",
  },

  // ---- 疼痛 / 筋骨 ----
  headache: {
    name: "头痛（多为紧张性头痛）",
    summary: "最常见的是压力、疲劳、睡眠不足引起的紧张性头痛，呈胀痛或紧箍感。",
    advice: "规律作息、放松颈肩、减少屏幕时间，适当按摩。",
    seeDoctor: "突发剧痛、伴呕吐/肢体无力/言语不清时立即就医。",
    severity: "mild",
  },
  toothache: {
    name: "牙痛（龋齿 / 牙髓炎）",
    summary: "多由蛀牙、牙髓发炎引起，遇冷热或夜间加重。止痛药只能暂时缓解。",
    advice: "避免冷热刺激和咀嚼患侧，注意口腔清洁。",
    seeDoctor: "牙痛多需口腔科治疗（补牙/根管），药物仅作临时缓解，建议尽快就诊。",
    severity: "moderate",
  },
  gingivitis: {
    name: "牙龈肿痛（牙龈炎 / 上火）",
    summary: "牙龈红肿疼痛，常因牙菌斑、上火或维生素缺乏引起，可伴出血。",
    advice: "认真刷牙、使用牙线，多吃蔬果补充维生素，清淡饮食。",
    seeDoctor: "反复肿痛、化脓或牙龈萎缩时到口腔科洁牙、治疗。",
    severity: "mild",
  },
  "mouth-ulcer": {
    name: "口腔溃疡",
    summary: "口腔黏膜的小溃疡，疼痛明显，多与上火、缺乏维生素、免疫或压力有关。",
    advice: "补充维生素 B2/C，清淡饮食，保证睡眠，一般 1–2 周自愈。",
    seeDoctor: "溃疡超过 2 周不愈、面积大或反复发作时就医排查。",
    severity: "mild",
  },
  mumps: {
    name: "流行性腮腺炎（俗称'痄腮'）",
    summary: "由病毒引起的腮腺肿大疼痛，具有传染性，常见于儿童青少年。",
    advice: "隔离休息、清淡饮食、避免酸性食物刺激唾液分泌，多喝水。",
    seeDoctor: "这是传染病，建议尽早就医确诊；伴高热、头痛、睾丸肿痛等并发症须立即就医。",
    severity: "attention",
  },
  "menstrual-pain": {
    name: "痛经（原发性痛经）",
    summary: "经期前后下腹坠胀绞痛，多为子宫收缩引起，无器质性病变者为原发性痛经。",
    advice: "腹部热敷、喝热水、注意保暖、避免生冷，适度休息。",
    seeDoctor: "疼痛进行性加重、经量异常或非经期也痛时，妇科就诊排查器质性疾病。",
    severity: "mild",
  },
  "body-ache": {
    name: "全身肌肉酸痛",
    summary: "常见于感冒发热、过度疲劳或运动后乳酸堆积，多可自行缓解。",
    advice: "充分休息、热敷、补充水分，避免过度劳累。",
    seeDoctor: "持续不缓解、伴明显无力或肌肉肿胀时就医。",
    severity: "mild",
  },
  "joint-pain": {
    name: "关节疼痛",
    summary: "关节因劳损、受凉或炎症出现疼痛，活动时可能加重。",
    advice: "注意保暖、避免过度负重，适度活动。",
    seeDoctor: "关节红肿热痛、晨僵明显或持续疼痛时到风湿/骨科就诊。",
    severity: "moderate",
  },
  "back-pain": {
    name: "腰酸背痛（腰肌劳损）",
    summary: "多由久坐久站、姿势不良、受凉或劳累引起的肌肉筋膜疼痛。",
    advice: "纠正坐姿、避免久坐、热敷与适度拉伸，加强腰背肌锻炼。",
    seeDoctor: "伴下肢放射痛/麻木、大小便异常或外伤后疼痛时立即就医。",
    severity: "moderate",
  },
  "knee-pain": {
    name: "膝关节疼痛（骨关节炎 / 劳损）",
    summary: "膝盖在上下楼、久走后疼痛，中老年多为退行性骨关节炎，年轻人多为劳损。",
    advice: "减少爬楼/爬山、控制体重、避免久蹲，加强股四头肌锻炼。",
    seeDoctor: "明显肿胀、积液、活动受限或夜间痛时到骨科就诊。",
    severity: "moderate",
  },
  "neck-pain": {
    name: "肩颈痛 / 落枕（颈肌劳损）",
    summary: "颈肩肌肉因姿势不良、受凉或睡姿不当而僵硬疼痛，落枕为急性发作。",
    advice: "热敷、轻柔拉伸、调整枕头高度，避免长时间低头。",
    seeDoctor: "伴手臂麻木、头晕或持续加重时到骨科/康复科就诊。",
    severity: "mild",
  },

  // ---- 消化 ----
  diarrhea: {
    name: "腹泻（急性肠胃炎）",
    summary: "排便次数增多、大便稀薄，多由饮食不洁或病毒/细菌感染引起。",
    advice: "防脱水最重要，少量多次补充口服补液盐，清淡易消化饮食。",
    seeDoctor: "便血/黑便、持续高热、严重脱水或腹泻超过 3 天时就医。",
    severity: "moderate",
  },
  "stomach-pain": {
    name: "胃痛（胃炎）",
    summary: "上腹部隐痛或灼痛，常与饮食不规律、辛辣刺激、幽门螺杆菌等有关。",
    advice: "规律饮食、细嚼慢咽、避免辛辣浓茶咖啡和空腹刺激。",
    seeDoctor: "剧烈胃痛、呕血黑便、消瘦时立即就医。",
    severity: "moderate",
  },
  "acid-reflux": {
    name: "反酸烧心（胃食管反流）",
    summary: "胃酸反流到食管，产生烧心、反酸、胸骨后灼热感。",
    advice: "少食多餐、睡前 3 小时不进食、抬高床头、避免过饱和高脂。",
    seeDoctor: "频繁发作、吞咽困难或体重下降时到消化科就诊。",
    severity: "mild",
  },
  indigestion: {
    name: "消化不良 / 腹胀",
    summary: "进食后上腹饱胀、嗳气，多因胃动力不足或饮食过量。",
    advice: "细嚼慢咽、少吃产气食物、饭后适度活动。",
    seeDoctor: "长期不缓解或伴体重下降、贫血时就医。",
    severity: "mild",
  },
  nausea: {
    name: "恶心 / 想吐",
    summary: "胃部不适伴呕吐感，可由肠胃问题、饮食、紧张等多种原因引起。",
    advice: "少量多次饮水、清淡饮食、避免油腻气味。",
    seeDoctor: "频繁呕吐、无法进食进水或伴剧烈腹痛时就医。",
    severity: "mild",
  },
  "motion-sickness": {
    name: "晕动症（晕车 / 晕船）",
    summary: "乘车船时因平衡感与视觉信息冲突引起的头晕、恶心、出冷汗。",
    advice: "乘车前别吃太饱、坐前排看远处、保持通风，提前服药效果更好。",
    seeDoctor: "一般无需就医；若平时无诱因频繁眩晕需排查耳/神经问题。",
    severity: "mild",
  },
  constipation: {
    name: "便秘",
    summary: "排便困难、次数减少、大便干硬，多与膳食纤维不足、饮水少、久坐有关。",
    advice: "多吃蔬果粗粮、多喝水、规律排便、适度运动，优先非药物调理。",
    seeDoctor: "突然便秘伴腹痛腹胀、便血或大便变细时就医排查。",
    severity: "mild",
  },

  // ---- 皮肤 / 过敏 ----
  allergy: {
    name: "过敏反应（皮疹 / 瘙痒）",
    summary: "接触或摄入过敏原后免疫系统过度反应，出现皮疹、瘙痒、风团等。",
    advice: "尽快脱离并记录可疑过敏原，避免抓挠。",
    seeDoctor: "出现呼吸困难、喉头发紧、面部肿胀时立即拨打急救电话。",
    severity: "moderate",
  },
  hives: {
    name: "荨麻疹（风团）",
    summary: "皮肤突发红色风团、剧烈瘙痒，时起时消，多为过敏所致。",
    advice: "避免已知诱因（食物/药物/冷热），抗组胺药可缓解。",
    seeDoctor: "伴呼吸困难或反复发作超过 6 周（慢性荨麻疹）时就医。",
    severity: "moderate",
  },
  itching: {
    name: "皮肤瘙痒",
    summary: "皮肤干燥、过敏或刺激引起的瘙痒感。",
    advice: "保湿、避免过热水烫洗和搔抓，穿宽松棉质衣物。",
    seeDoctor: "全身顽固瘙痒或伴黄疸、消瘦时排查内科疾病。",
    severity: "mild",
  },
  "insect-bite": {
    name: "蚊虫叮咬",
    summary: "蚊虫叮咬后局部红肿瘙痒，一般可自行消退。",
    advice: "冷敷止痒、避免抓破，外用止痒剂即可。",
    seeDoctor: "大面积红肿、化脓或伴全身症状时就医。",
    severity: "mild",
  },
  eczema: {
    name: "湿疹 / 皮炎",
    summary: "皮肤出现红斑、丘疹、脱屑伴瘙痒，易反复，与过敏体质和皮肤屏障受损有关。",
    advice: "加强保湿、避免刺激和过度清洁，远离可疑诱因。",
    seeDoctor: "范围扩大、渗液感染或反复不愈时到皮肤科就诊。",
    severity: "moderate",
  },

  // ---- 眼部 ----
  "conjunctivitis-bacterial": {
    name: "细菌性结膜炎（红眼病）",
    summary: "眼睛发红、分泌物多（黄白色脓性），晨起睁眼困难，具传染性。",
    advice: "勤洗手、毛巾专用、不揉眼，避免交叉感染。",
    seeDoctor: "视力下降、剧烈眼痛或 2–3 天无改善时到眼科就诊。",
    severity: "moderate",
  },
  "dry-eye": {
    name: "干眼症 / 视疲劳",
    summary: "用眼过度或泪液不足引起眼干、酸涩、异物感、视物模糊。",
    advice: "遵循 20-20-20 用眼法则，多眨眼、增加环境湿度、规律休息。",
    seeDoctor: "持续干涩刺痛、视力明显下降时到眼科就诊。",
    severity: "mild",
  },

  // ---- 睡眠 ----
  insomnia: {
    name: "失眠 / 入睡困难",
    summary: "入睡困难、易醒或睡眠质量差，短期多与压力、作息紊乱有关。",
    advice: "固定作息、睡前远离手机和咖啡因、营造安静黑暗环境。",
    seeDoctor: "失眠超过 1 个月并影响日间功能时到睡眠/精神心理科就诊。",
    severity: "mild",
  },
};

if (typeof window !== "undefined") {
  window.DIAGNOSES = DIAGNOSES;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DIAGNOSES };
}
