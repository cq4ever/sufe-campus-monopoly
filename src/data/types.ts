export type PersonalityCode =
  `${"J" | "T"}${"N" | "K"}${"F" | "Y"}${"P" | "S"}`;
export interface ResultCopy {
  subtitle: string;
  roast: string;
  tags: [string, string, string];
  share: string;
}
export interface Personality extends Omit<ResultCopy, "subtitle"> {
  code: PersonalityCode;
  name: string;
}
export const personalityTypes: Personality[] = [
  {
    code: "JNFP",
    name: "绿叶步行街 KPI 战神",
    roast:
      "社团、学生会、绩点三开，连约饭都写进日程表。你的精力是上财未解之谜。",
    tags: ["日程满格", "社团常驻", "干饭不误"],
    share: "今天也在被日程表追着跑",
  },
  {
    code: "JNFS",
    name: "梯教前排气氛组",
    roast: "坐前排、爱发言、下课第一个冲食堂。卷是认真的，计划是不存在的。",
    tags: ["前排常驻", "气氛担当", "干饭冲刺"],
    share: "前排的风景和食堂的饭都归我",
  },
  {
    code: "JNYP",
    name: "英贤早鸟部长",
    roast:
      "开门就进英贤，下午拉学习小组，晚上还要夜跑。同学怀疑你是学校派来的自律样板。",
    tags: ["英贤早鸟", "自律达人", "组队发起人"],
    share: "自律给我自由（和黑眼圈）",
  },
  {
    code: "JNYS",
    name: "田径场社交卷王",
    roast: "边跑步边聊天边背单词，随性但高效，食堂每一桌都有你的熟人。",
    tags: ["随性高效", "跑步搭子", "熟人遍地"],
    share: "卷和社交，我全都要",
  },
  {
    code: "JKFP",
    name: "图书馆角落静音卷王",
    roast:
      "固定座位、固定窗口、固定时间，一个人吃饭快得像在赶 ddl。存在感低，学习存在感高。",
    tags: ["静音模式", "固定窗口", "计划在线"],
    share: "别找我，我在图书馆角落",
  },
  {
    code: "JKFS",
    name: "随缘干饭学霸",
    roast: "从不做计划，饿了就吃，学了就会。室友看着你的复习进度陷入沉思。",
    tags: ["随缘学习", "认真吃饭", "安静充电"],
    share: "随缘学习，认真吃饭",
  },
  {
    code: "JKYP",
    name: "自律独行侠",
    roast: "早睡早起、少油少盐、提前交作业。你不是在上大学，你是在修仙。",
    tags: ["养生作息", "独处自在", "提前交卷"],
    share: "修仙进度 +1",
  },
  {
    code: "JKYS",
    name: "暗中努力佛系人",
    roast: "嘴上说随便学学，期末悄悄考得不错。社交电量偏低，养生意识拉满。",
    tags: ["默默努力", "佛系养生", "低耗社交"],
    share: "我真的只是随便学学",
  },
  {
    code: "TNFP",
    name: "五角场觅食规划师",
    roast: "学习看心情，吃饭有攻略。五角场新开的店，你总比朋友圈先知道。",
    tags: ["觅食雷达", "攻略达人", "约饭发起人"],
    share: "人生规划：下一顿吃什么",
  },
  {
    code: "TNFS",
    name: "国定路快乐小狗",
    roast: "到哪都能交朋友，吃啥都香，计划是什么能吃吗？快乐浓度严重超标。",
    tags: ["快乐满格", "随缘出发", "吃啥都香"],
    share: "快乐小狗，在线营业",
  },
  {
    code: "TNYP",
    name: "养生局组织委员",
    roast:
      "带着室友夜跑、喝无糖茶、按时睡觉。绩点卷不动，但把全宿舍的作息卷起来了。",
    tags: ["养生组局", "规律作息", "夜跑搭子"],
    share: "今晚 11 点，全员睡觉",
  },
  {
    code: "TNYS",
    name: "社团摸鱼外交官",
    roast: "加了一堆社团，主业是认识人。哪里有活动哪里就有你，ddl 全看缘分。",
    tags: ["社团熟脸", "随性社交", "摸鱼艺术"],
    share: "认识我的人比我认识的课多",
  },
  {
    code: "TKFP",
    name: "宿舍外卖精算师",
    roast: "满减算得比作业还认真，外卖送达时间精确到分钟，床帘就是你的结界。",
    tags: ["满减专家", "精准开饭", "床帘结界"],
    share: "满减凑单，专业的",
  },
  {
    code: "TKFS",
    name: "床帘内的干饭隐士",
    roast: "非必要不出门，见得最多的人是外卖小哥。夜宵是灵魂，早八是传说。",
    tags: ["夜宵灵魂", "床帘居民", "随缘早八"],
    share: "床帘之内，自成一派",
  },
  {
    code: "TKYP",
    name: "按时睡觉的躺平艺术家",
    roast: "不卷但规律，准点睡觉、一天八杯水。你的躺平，是有计划的躺平。",
    tags: ["规律躺平", "准点关机", "喝水打卡"],
    share: "躺平也要按时按点",
  },
  {
    code: "TKYS",
    name: "国定路云养生大师",
    roast: "保温杯、床帘、白噪音三件套。外面纷纷扰扰，与你无关。",
    tags: ["保温杯派", "安静养生", "随缘生活"],
    share: "世界很吵，我在养生",
  },
];
export function getPersonality(code: PersonalityCode): Personality {
  const type = personalityTypes.find((t) => t.code === code);
  if (!type) throw new RangeError("Unknown personality code");
  return type;
}
export function getPreset(code: PersonalityCode): ResultCopy {
  const { roast, tags, share } = getPersonality(code);
  return { subtitle: "", roast, tags: [...tags], share };
}
