import { isDemoAI, type AIProvider } from "./provider";
import { DemoAIProvider } from "./demoProvider";
import { OpenAIProvider } from "./openaiProvider";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  if (isDemoAI()) {
    cached = new DemoAIProvider();
  } else {
    cached = new OpenAIProvider();
  }
  return cached;
}

export function getAIModeLabel(): string {
  return getAIProvider().isDemo ? "Analysis" : "AI Analysis";
}
