export type Group = "国定" | "教学" | "武东" | "武川";
export type Tile = {
  id: number;
  name: string;
  type: "property" | "event" | "quiz" | "corner";
  price?: number;
  group?: Group;
  icon: string;
};
export const groupColors: Record<Group, string> = {
  国定: "#e9ac52",
  教学: "#759b83",
  武东: "#7c91c8",
  武川: "#be83a2",
};
export const board: Tile[] = [
  { id: 0, name: "国定路校门", type: "corner", icon: "⚑" },
  {
    id: 1,
    name: "绿叶步行街",
    type: "property",
    group: "国定",
    price: 100,
    icon: "♧",
  },
  { id: 2, name: "AI 校园事件", type: "event", icon: "✦" },
  {
    id: 3,
    name: "第一食堂（绿叶餐厅）",
    type: "property",
    group: "国定",
    price: 120,
    icon: "♨",
  },
  {
    id: 4,
    name: "第二食堂（清真餐厅）",
    type: "property",
    group: "国定",
    price: 120,
    icon: "♨",
  },
  { id: 5, name: "校医院", type: "corner", icon: "✚" },
  {
    id: 6,
    name: "第一教学楼",
    type: "property",
    group: "教学",
    price: 160,
    icon: "▤",
  },
  { id: 7, name: "AI 财经小题", type: "quiz", icon: "?" },
  {
    id: 8,
    name: "第二教学楼",
    type: "property",
    group: "教学",
    price: 160,
    icon: "▤",
  },
  {
    id: 9,
    name: "国定梯教 T1–T4",
    type: "property",
    group: "教学",
    price: 180,
    icon: "▤",
  },
  { id: 10, name: "主体育馆", type: "corner", icon: "◎" },
  {
    id: 11,
    name: "第三教学楼",
    type: "property",
    group: "武东",
    price: 220,
    icon: "▤",
  },
  { id: 12, name: "AI 校园事件", type: "event", icon: "✦" },
  {
    id: 13,
    name: "武东梯教 T5–T12",
    type: "property",
    group: "武东",
    price: 220,
    icon: "▤",
  },
  {
    id: 14,
    name: "第三食堂（新食堂）",
    type: "property",
    group: "武东",
    price: 240,
    icon: "♨",
  },
  { id: 15, name: "武东田径场", type: "corner", icon: "↗" },
  {
    id: 16,
    name: "英贤图书馆",
    type: "property",
    group: "武川",
    price: 300,
    icon: "▥",
  },
  { id: 17, name: "AI 财经小题", type: "quiz", icon: "?" },
  {
    id: 18,
    name: "第四教学楼",
    type: "property",
    group: "武川",
    price: 280,
    icon: "▤",
  },
  {
    id: 19,
    name: "第四食堂（新园餐厅）",
    type: "property",
    group: "武川",
    price: 280,
    icon: "♨",
  },
];
