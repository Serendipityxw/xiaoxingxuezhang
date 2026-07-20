import { faqItems } from "../data/faqItems";
import type { ChatMessage, FaqItem } from "../types";

export interface AnswerContext {
  faqId?: string;
  history: ChatMessage[];
}

export interface AnswerResult {
  text: string;
  suggestions: string[];
  sourceTitle?: string;
  imageUrls?: string[];
}

export interface AnswerProvider {
  answer(question: string, context: AnswerContext): Promise<AnswerResult>;
}

const fallbackSuggestions = faqItems.slice(0, 4).map((item) => item.question);

export class KnowledgeAnswerProvider implements AnswerProvider {
  async answer(question: string, context: AnswerContext): Promise<AnswerResult> {
    const explicitFaq = context.faqId
      ? faqItems.find((item) => item.id === context.faqId)
      : undefined;
    const matchedFaq = explicitFaq ?? findBestFaq(question);

    if (!matchedFaq) {
      return {
        text: [
          "该问题我暂时无法准确回答，建议你通过以下方式获取信息：",
          "",
          "📞 招生办热线：0536-8785670",
          "📱 关注官方公众号：潍坊学院",
          "🛰️ 添加账号进行学长咨询：19853398369",
        ].join("\n"),
        suggestions: fallbackSuggestions,
        sourceTitle: undefined,
      };
    }

    return {
      text: matchedFaq.answer,
      suggestions: matchedFaq.suggestions,
      sourceTitle: matchedFaq.shortTitle,
      imageUrls: matchedFaq.imageUrls,
    };
  }
}

function findBestFaq(question: string): FaqItem | undefined {
  const normalizedQuestion = normalize(question);

  if (!normalizedQuestion) {
    return undefined;
  }

  const ranked = faqItems
    .map((item) => ({
      item,
      score: getMatchScore(item, normalizedQuestion),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].item : undefined;
}

function getMatchScore(item: FaqItem, normalizedQuestion: string): number {
  const searchable = [
    item.question,
    item.shortTitle,
    ...item.keywords,
    ...item.suggestions,
  ].map(normalize);

  let score = 0;

  for (const phrase of searchable) {
    if (!phrase) {
      continue;
    }

    if (normalizedQuestion.includes(phrase)) {
      score += phrase.length > 2 ? 4 : 2;
    }

    if (phrase.includes(normalizedQuestion) && normalizedQuestion.length >= 2) {
      score += 3;
    }
  }

  for (const keyword of item.keywords.map(normalize)) {
    if (keyword && normalizedQuestion.includes(keyword)) {
      score += 8;
    }
  }

  return score;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[，。！？、,.!?;；:：\s]/g, "")
    .trim();
}
