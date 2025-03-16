import {
  ContextProviderWithParams,
  ModelDescription,
  SerializedContinueConfig,
  SlashCommandDescription,
  EmbeddingsProviderDescription,
  BaseCompletionOptions
} from "../";

export const DEFAULT_CHAT_MODEL_CONFIG: ModelDescription = {
  model: "claude-3-5-sonnet-latest",
  provider: "anthropic",
  apiKey: "",
  title: "Claude 3.5 Sonnet",
};

export const DEFAULT_CHAT_MODELS_CONFIG: ModelDescription[] = [
  {...DEFAULT_CHAT_MODEL_CONFIG}
];


export const defaultCompletionOptions: BaseCompletionOptions = {
  maxTokens: 20480,
  temperature: 0.01
}

export const DEFAULT_AUTOCOMPLETE_MODEL_CONFIG: ModelDescription = {
  "title": "Qwen2.5-Coder-7B-Instruct",
  "provider": "openrouter",
  "model": "Qwen2.5-Coder-7B-Instruct",
  "apiBase": "...",
  "apiKey": "..."
};

export const DEFAULT_EMBEDDING_MODEL_CONFIG: EmbeddingsProviderDescription = {
  "provider": "lmstudio",
  "model": "bge-base-zh-v1.5",
  "apiBase": "...",
  "maxBatchSize": 20,
  "apiKey": "..."
}

export const FREE_TRIAL_MODELS: ModelDescription[] = [
  {
    title: "Claude 3.5 Sonnet (Free Trial)",
    provider: "free-trial",
    model: "claude-3-5-sonnet-latest",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "GPT-4o (Free Trial)",
    provider: "free-trial",
    model: "gpt-4o",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "Llama3.1 70b (Free Trial)",
    provider: "free-trial",
    model: "llama3.1-70b",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "Codestral (Free Trial)",
    provider: "free-trial",
    model: "codestral-latest",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
];


export const defaultContextProvidersVsCode: ContextProviderWithParams[] = [
  { name: "code", params: {} },
  { name: "docs", params: {} },
  { name: "diff", params: {} },
  { name: "terminal", params: {} },
  { name: "problems", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
  {
    name: "commit",
    params: {
      "Depth": 50,
      "LastXCommitsDepth": 10
    }
  },
  {
    name: "url",
    params: {}
  }
];

export const defaultContextProvidersJetBrains: ContextProviderWithParams[] = [
  { name: "diff", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultSlashCommandsVscode: SlashCommandDescription[] = [
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "cmd",
    description: "Generate a shell command",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultSlashCommandsJetBrains = [
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultConfig: SerializedContinueConfig = {
  models: DEFAULT_CHAT_MODELS_CONFIG,
  tabAutocompleteModel: DEFAULT_AUTOCOMPLETE_MODEL_CONFIG,
  embeddingsProvider: DEFAULT_EMBEDDING_MODEL_CONFIG,
  contextProviders: defaultContextProvidersVsCode,
  slashCommands: defaultSlashCommandsVscode,
  completionOptions: defaultCompletionOptions 
};

export const defaultConfigJetBrains: SerializedContinueConfig = {
  models: DEFAULT_CHAT_MODELS_CONFIG,
  tabAutocompleteModel: DEFAULT_AUTOCOMPLETE_MODEL_CONFIG,
  embeddingsProvider: DEFAULT_EMBEDDING_MODEL_CONFIG,
  contextProviders: defaultContextProvidersJetBrains,
  slashCommands: defaultSlashCommandsJetBrains,
  completionOptions: defaultCompletionOptions 
};
