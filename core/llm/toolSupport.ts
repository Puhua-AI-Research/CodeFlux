export const PROVIDER_TOOL_SUPPORT: Record<
  string,
  (model: string) => boolean | undefined
> = {
  anthropic: (model) => {
    if (
      ["claude-3-5", "claude-3.5"].some((part) =>
        model.toLowerCase().startsWith(part),
      )
    ) {
      return true;
    }
  },
  openai: (model) => {
    // https://platform.openai.com/docs/guides/function-calling#models-supporting-function-calling
    if (model.toLowerCase().startsWith("gpt-4")) {
      return true;
    }
  },
  gemini: (model) => {
    // All gemini models support function calling
    return model.toLowerCase().includes("gemini");
  },
  // https://ollama.com/search?c=tools
  ollama: (model) => {
    if (
      ["vision", "math", "guard", "mistrallite", "mistral-openorca"].some(
        (part) => model.toLowerCase().includes(part),
      )
    ) {
      return false;
    }
    if (
      [
        "llama3.3",
        "qwq",
        "llama3.2",
        "llama3.1",
        "qwen2",
        "mixtral",
        "command-r",
        "smollm2",
        "hermes3",
        "athene-v2",
        "nemotron",
        "llama3-groq",
        "granite3",
        "aya-expanse",
        "firefunction-v2",
        "mistral",
        "qwen2.5",
        "deepseek"
      ].some((part) => model.toLowerCase().startsWith(part))
    ) {
      return true;
    }
  },
  _openrouter: (model) => {
    if (
      ["vision", "math", "guard", "mistrallite", "mistral-openorca"].some(
        (part) => model.toLowerCase().includes(part),
      )
    ) {
      return false;
    }
    if (
      [
        "llama3.3",
        "qwq",
        "llama3.2",
        "llama3.1",
        "qwen2",
        "mixtral",
        "command-r",
        "smollm2",
        "hermes3",
        "athene-v2",
        "nemotron",
        "llama3-groq",
        "granite3",
        "aya-expanse",
        "firefunction-v2",
        "mistral",
        "qwen2.5",
        "deepseek"
      ].some((part) => model.toLowerCase().startsWith(part))
    ) {
      return true;
    }
  }
};
