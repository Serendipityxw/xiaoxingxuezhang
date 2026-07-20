import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  ClipboardList,
  GraduationCap,
  Home,
  MapPin,
  MapPinned,
  Medal,
  Package,
  Phone,
  QrCode,
  RefreshCcw,
  Ruler,
  Send,
  ShieldCheck,
  TrainFront,
  Trash2,
  Utensils,
  WalletCards,
} from "lucide-react";
import { faqItems } from "./data/faqItems";
import { siteConfig } from "./data/siteConfig";
import { assetUrl } from "./lib/assetUrl";
import {
  KnowledgeAnswerProvider,
  type AnswerProvider,
} from "./providers/answerProvider";
import type { ChatMessage, FaqItem } from "./types";

const answerProvider: AnswerProvider = new KnowledgeAnswerProvider();
const thinkingDelayMs = 850;
const streamChunkDelayMs = 34;
const streamPauseDelayMs = 120;

const iconMap = {
  ClipboardList,
  Home,
  WalletCards,
  TrainFront,
  Package,
  Medal,
  RefreshCcw,
  Ruler,
  Utensils,
  MapPinned,
};

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const responseRunRef = useRef(0);
  const isChatting = messages.length > 0 || isAnswering;

  useEffect(() => {
    if (!isChatting) {
      scrollRef.current?.scrollTo({ top: 0 });
      return;
    }

    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isAnswering, isChatting]);

  async function askQuestion(question: string, faqId?: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isAnswering) {
      return;
    }

    const userMessage = createMessage("user", trimmedQuestion);
    const history = [...messages, userMessage];
    const runId = responseRunRef.current + 1;

    responseRunRef.current = runId;

    setMessages(history);
    setInputValue("");
    setIsAnswering(true);

    const result = await answerProvider.answer(trimmedQuestion, {
      faqId,
      history,
    });

    await wait(thinkingDelayMs);

    if (responseRunRef.current !== runId) {
      return;
    }

    const assistantMessage = createMessage("assistant", "", {
      sourceTitle: result.sourceTitle,
      suggestions: [],
      imageUrls: result.imageUrls,
    });

    setMessages((currentMessages) => [
      ...currentMessages,
      assistantMessage,
    ]);

    let streamedText = "";

    for (const chunk of splitAnswerIntoChunks(result.text)) {
      if (responseRunRef.current !== runId) {
        return;
      }

      streamedText += chunk;
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, text: streamedText }
            : message,
        ),
      );
      await wait(getChunkDelay(chunk));
    }

    if (responseRunRef.current !== runId) {
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === assistantMessage.id
          ? { ...message, suggestions: result.suggestions }
          : message,
      ),
    );
    setIsAnswering(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askQuestion(inputValue);
  }

  function handleBackHome() {
    cancelAnswering();
    setMessages([]);
    setInputValue("");
    setIsAnswering(false);
  }

  function handleClearChat() {
    cancelAnswering();
    setMessages([]);
    setInputValue("");
    setIsAnswering(false);
  }

  function cancelAnswering() {
    responseRunRef.current += 1;
  }

  return (
    <div className="app">
      <img className="campus-visual" src={assetUrl("campus-scene.svg")} alt="" />
      <section className="assistant-shell" aria-label={siteConfig.siteTitle}>
        <TopBar
          isChatting={isChatting}
          onBack={handleBackHome}
          onClear={handleClearChat}
        />

        <div ref={scrollRef} className="screen-scroll">
          {isChatting ? (
            <ChatScreen
              messages={messages}
              isAnswering={isAnswering}
              onSuggestionClick={(question) => void askQuestion(question)}
            />
          ) : (
            <HomeScreen onAsk={(item) => void askQuestion(item.question, item.id)} />
          )}
        </div>

        <Composer
          value={inputValue}
          isAnswering={isAnswering}
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}

interface TopBarProps {
  isChatting: boolean;
  onBack: () => void;
  onClear: () => void;
}

function TopBar({ isChatting, onBack, onClear }: TopBarProps) {
  return (
    <header className="top-bar">
      {isChatting ? (
        <button className="icon-button" type="button" onClick={onBack} aria-label="返回首页">
          <ArrowLeft size={21} />
        </button>
      ) : (
        <div className="brand-mark" aria-hidden="true">
          <GraduationCap size={21} />
        </div>
      )}

      <div className="top-identity">
        <img src={siteConfig.avatarUrl} alt="" />
        <div>
          <strong>{siteConfig.assistantName}</strong>
          <span>
            <i aria-hidden="true" />
            {siteConfig.statusText}
          </span>
        </div>
      </div>

      {isChatting ? (
        <button className="icon-button" type="button" onClick={onClear} aria-label="清空对话">
          <Trash2 size={19} />
        </button>
      ) : (
        <a className="icon-button" href={`tel:${siteConfig.phone}`} aria-label="拨打咨询电话">
          <Phone size={18} />
        </a>
      )}
    </header>
  );
}

interface HomeScreenProps {
  onAsk: (item: FaqItem) => void;
}

function HomeScreen({ onAsk }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <section className="hero">
        {siteConfig.heroImageUrl ? (
          <div className="pinned-hero-image" aria-hidden="true">
            <img src={siteConfig.heroImageUrl} alt="" />
          </div>
        ) : null}
        <h1>{siteConfig.siteTitle}</h1>
        <p className="school-line">
          {siteConfig.schoolName} · {siteConfig.campusName}
        </p>
        <p className="intro">{siteConfig.intro}</p>

        <a className="phone-link" href={`tel:${siteConfig.phone}`}>
          <Phone size={15} />
          <span>{siteConfig.phoneLabel}: {siteConfig.phone}</span>
        </a>
      </section>

      <section className="quick-section" aria-label="常见问题">
        <div className="section-heading">
          <Bot size={18} />
          <h2>新生常问</h2>
        </div>
        <div className="faq-grid">
          {faqItems.map((item) => (
            <FaqButton key={item.id} item={item} onClick={() => onAsk(item)} />
          ))}
        </div>
      </section>

      {siteConfig.qrEntries.length > 0 ? (
        <section className="qr-section" aria-label="咨询入口">
          {siteConfig.qrEntries.map((entry) => (
            <article className="qr-card" key={entry.id}>
              <img src={entry.imageUrl} alt={`${entry.label}二维码占位`} />
              <div>
                <h3>{entry.label}</h3>
                <p>{entry.description}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}

interface FaqButtonProps {
  item: FaqItem;
  onClick: () => void;
}

function FaqButton({ item, onClick }: FaqButtonProps) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? ClipboardList;

  return (
    <button className="faq-button" type="button" onClick={onClick}>
      <span className="faq-icon">
        <Icon size={19} />
      </span>
      <span>{item.question}</span>
    </button>
  );
}

interface ChatScreenProps {
  messages: ChatMessage[];
  isAnswering: boolean;
  onSuggestionClick: (question: string) => void;
}

function ChatScreen({ messages, isAnswering, onSuggestionClick }: ChatScreenProps) {
  const showThinkingBubble =
    isAnswering && messages[messages.length - 1]?.role === "user";

  return (
    <main className="chat-screen">
      {messages.map((message, index) => (
        <ChatBubble
          key={message.id}
          message={message}
          isStreaming={
            isAnswering &&
            index === messages.length - 1 &&
            message.role === "assistant"
          }
          onSuggestionClick={onSuggestionClick}
        />
      ))}
      {showThinkingBubble ? <TypingBubble /> : null}
    </main>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming: boolean;
  onSuggestionClick: (question: string) => void;
}

function ChatBubble({ message, isStreaming, onSuggestionClick }: ChatBubbleProps) {
  const suggestions = useMemo(
    () => message.suggestions?.slice(0, 3) ?? [],
    [message.suggestions],
  );

  if (message.role === "user") {
    return (
      <article className="bubble-row user-row">
        <div className="user-bubble">{message.text}</div>
      </article>
    );
  }

  return (
    <article className="bubble-row assistant-row">
      <img className="bubble-avatar" src={siteConfig.avatarUrl} alt="" />
      <div className={isStreaming ? "assistant-bubble streaming" : "assistant-bubble"}>
        {message.sourceTitle ? (
          <div className="source-label">
            <ShieldCheck size={14} />
            <span>{message.sourceTitle}</span>
          </div>
        ) : null}
        <p>{message.text}</p>
        {message.imageUrls && message.imageUrls.length > 0 ? (
          <div className="answer-images" aria-label="相关校园图片">
            {message.imageUrls.map((imageUrl) => (
              <button
                key={imageUrl}
                type="button"
                className="answer-image"
                onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
              >
                <img src={imageUrl} alt="相关校园图片" />
              </button>
            ))}
          </div>
        ) : null}
        {suggestions.length > 0 ? (
          <div className="suggestions" aria-label="你可能还想问">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TypingBubble() {
  return (
    <article className="bubble-row assistant-row">
      <img className="bubble-avatar" src={siteConfig.avatarUrl} alt="" />
      <div className="assistant-bubble typing" aria-live="polite">
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

interface ComposerProps {
  value: string;
  isAnswering: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function Composer({ value, isAnswering, onChange, onSubmit }: ComposerProps) {
  return (
    <footer className="composer-wrap">
      <form className="composer" onSubmit={onSubmit}>
        <MapPin size={17} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="输入你的问题..."
          aria-label="输入你的问题"
          disabled={isAnswering}
        />
        <button
          type="submit"
          aria-label="发送问题"
          disabled={isAnswering || value.trim().length === 0}
        >
          {isAnswering ? <QrCode size={18} /> : <Send size={18} />}
        </button>
      </form>
      <p>{siteConfig.disclaimer}</p>
    </footer>
  );
}

function createMessage(
  role: ChatMessage["role"],
  text: string,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    createdAt: Date.now(),
    ...overrides,
  };
}

function splitAnswerIntoChunks(answer: string): string[] {
  const chunks = answer.match(/[\s\S]{1,2}|[\s\S]/g) ?? [];

  return chunks;
}

function getChunkDelay(chunk: string): number {
  if (/[\n。！？；：]/.test(chunk)) {
    return streamPauseDelayMs;
  }

  if (/[，、,.]/.test(chunk)) {
    return streamPauseDelayMs * 0.58;
  }

  return streamChunkDelayMs;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
