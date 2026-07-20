import type { SiteConfig } from "../types";
import { assetUrl } from "../lib/assetUrl";

export const siteConfig: SiteConfig = {
  assistantName: "潍院小兴",
  siteTitle: "潍坊学院 AI 新生助手",
  schoolName: "潍坊学院",
  campusName: "2026 新生服务",
  phone: "0536-8785670",
  phoneLabel: "招生办热线",
  intro: "报到安排、宿舍食堂、交通快递、军训资助，一站式帮你快速了解潍院。",
  statusText: "新生答疑助手 · 在线",
  disclaimer: "具体信息以学校官方通知为准",
  avatarUrl: assetUrl("campus-assets/assistant-xiaoxing.jpg"),
  heroImageUrl: assetUrl("campus-assets/hero-weifang.jpg"),
  qrEntries: [],
};
