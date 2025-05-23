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

export const DEFAULT_CHAT_MODELS_CONFIG: ModelDescription[] = [];


export const defaultCompletionOptions: BaseCompletionOptions = {
  maxTokens: 20480,
  temperature: 0.7
}

export const DEFAULT_AUTOCOMPLETE_MODEL_CONFIG: ModelDescription = {
  "title": "Qwen2.5-Coder-7B-Instruct",
  "provider": "openrouter",
  "model": "Qwen2.5-Coder-7B-Instruct",
  "apiBase": "...",
  "apiKey": "..."
};

export const DEFAULT_EMBEDDING_MODEL_CONFIG: EmbeddingsProviderDescription = {
  "provider": "transformers.js"
}

export const FREE_TRIAL_MODELS: ModelDescription[] = [];


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
