import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useNavigationListener } from "../../hooks/useNavigationListener";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  SharedConfigSchema,
  modifyContinueConfigWithSharedConfig,
} from "core/config/sharedConfig";
import { defaultConfig } from "core/config/default";
import { Input, SecondaryButton } from "../../components";
import NumberInput from "../../components/gui/NumberInput";
import { Select } from "../../components/gui/Select";
import ToggleSwitch from "../../components/gui/Switch";
import { useAuth } from "../../context/Auth";
import { updateConfig } from "../../redux/slices/configSlice";
import { getFontSize } from "../../util";
import { ScopeSelect } from "./ScopeSelect";
import { editConfigJson, resetConfigJson } from "core/util/paths";

function ConfigPage() {
  useNavigationListener();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ideMessenger = useContext(IdeMessengerContext);

  const { selectedProfile, selectedOrganization, session } = useAuth();
  const config = useAppSelector((state) => state.config.config);

  function handleUpdate(sharedConfig: Partial<SharedConfigSchema>) {
    dispatch(
      updateConfig(modifyContinueConfigWithSharedConfig(config, sharedConfig)),
    );
    ideMessenger.post("config/updateSharedConfig", sharedConfig);
  }

  const codeWrap = config.ui?.codeWrap ?? false;
  const showChatScrollbar = config.ui?.showChatScrollbar ?? false;
  const displayRawMarkdown = config.ui?.displayRawMarkdown ?? false;
  const disableSessionTitles = config.disableSessionTitles ?? false;
  const readResponseTTS = config.experimental?.readResponseTTS ?? false;

  const allowAnonymousTelemetry = config.allowAnonymousTelemetry ?? true;
  const disableIndexing = config.disableIndexing ?? false;

  const useAutocompleteCache = config.tabAutocompleteOptions?.useCache ?? false;
  const useChromiumForDocsCrawling =
    config.experimental?.useChromiumForDocsCrawling ?? false;
  const codeBlockToolbarPosition = config.ui?.codeBlockToolbarPosition ?? "top";
  const useAutocompleteMultilineCompletions =
    config.tabAutocompleteOptions?.multilineCompletions ?? "auto";
  const fontSize = getFontSize();

  const [hubEnabled, setHubEnabled] = useState(false);

  // Modified state initialization to load from localStorage
  const [remoteConfigUrl, setRemoteConfigUrl] = useState(() => {
    return localStorage.getItem('remoteConfigUrl') || "";
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('apiKey') || "sk-auto-openai";
  });
  
  // Update localStorage when values change
  useEffect(() => {
    localStorage.setItem('remoteConfigUrl', remoteConfigUrl);
  }, [remoteConfigUrl]);

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
  }, [apiKey]);
  
  const handleSyncConfig = async () => {
    if (!remoteConfigUrl) {
      await ideMessenger.ide.showToast("error", "Please enter a valid remote configuration URL", "Error");
      return;
    }
    try {      
      await ideMessenger.post("config/resetFromRemoteConfig", { url: remoteConfigUrl, apiKey: apiKey });
      await ideMessenger.ide.showToast("info", "Configuration synchronized successfully", "OK");
    } catch (error) {
      await ideMessenger.ide.showToast("error", "Configuration synchronization failed", "Error");
    }
  };

  useEffect(() => {
    ideMessenger.ide.getIdeSettings().then(({ continueTestEnvironment }) => {
      setHubEnabled(continueTestEnvironment === "production");
    });
  }, [ideMessenger]);

  // Disable autocomplete
  const disableAutocompleteInFiles = (
    config.tabAutocompleteOptions?.disableInFiles ?? []
  ).join(", ");
  const [formDisableAutocomplete, setFormDisableAutocomplete] = useState(
    disableAutocompleteInFiles,
  );
  const cancelChangeDisableAutocomplete = () => {
    setFormDisableAutocomplete(disableAutocompleteInFiles);
  };
  const handleDisableAutocompleteSubmit = () => {
    handleUpdate({
      disableAutocompleteInFiles: formDisableAutocomplete
        .split(",")
        .map((val) => val.trim())
        .filter((val) => !!val),
    });
  };

  useEffect(() => {
    // Necessary so that reformatted/trimmed values don't cause dirty state
    setFormDisableAutocomplete(disableAutocompleteInFiles);
  }, [disableAutocompleteInFiles]);

  // Workspace prompts
  const promptPath = config.experimental?.promptPath || "";
  const [formPromptPath, setFormPromptPath] = useState(promptPath);
  const cancelChangePromptPath = () => {
    setFormPromptPath(promptPath);
  };
  const handleSubmitPromptPath = () => {
    handleUpdate({
      promptPath: formPromptPath || "",
    });
  };

  useEffect(() => {
    // Necessary so that reformatted/trimmed values don't cause dirty state
    setFormPromptPath(promptPath);
  }, [promptPath]);

  function handleOpenConfig() {
    if (!selectedProfile) {
      return;
    }
    ideMessenger.post("config/openProfile", {
      profileId: selectedProfile.id,
    });
  }

  if (!selectedProfile) {
    return (
      <div className="overflow-y-scroll">
        <PageHeader onTitleClick={() => navigate("/")} title="Chat" />
        <div className="px-4">
          <div>
            <h2>Continue Config</h2>
          </div>
          <p className="italic">No config profile selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-scroll bg-gradient-to-b from-[#1a1a1a] to-[#141414]">
      <PageHeader onTitleClick={() => navigate("/")} title="Chat" />

      <div className="px-4 py-6 max-w-3xl mx-auto">
        {hubEnabled && !!session && (
          <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="text-xl font-medium text-[#FFD700] mb-4 flex items-center gap-2">
                <span className="transition-colors duration-300">Account</span>
              </h2>
              {selectedOrganization?.name && (
                <span className="text-gray-300">
                  You are currently signed in to{" "}
                  <span className="font-semibold text-white">
                    {selectedOrganization?.name}
                  </span>
                </span>
              )}
              <div className="mt-4">
                <ScopeSelect />
              </div>
            </div>
          </div>
        )}

        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <h2 className="text-xl font-medium text-[#FFD700] mb-4 flex items-center gap-2">
              <span className="transition-colors duration-300">Remote Configuration Sync</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-300">Remote Configuration URL</label>
                <Input
                  value={remoteConfigUrl}
                  onChange={(e) => {
                    setRemoteConfigUrl(e.target.value);
                  }}
                  placeholder="Enter remote configuration URL"
                  className="bg-black/30 border-white/10 focus:border-[#FFD700]/50 transition-colors"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-300">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                  }}
                  placeholder="Enter API Key"
                  className="bg-black/30 border-white/10 focus:border-[#FFD700]/50 transition-colors"
                />
              </div>

              <SecondaryButton
                onClick={handleSyncConfig}
                className="mt-2 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 transition-all duration-300"
              >
                Sync Remote Configuration
              </SecondaryButton>
            </div>
          </div>
        </div>

        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <h2 className="text-xl font-medium text-[#FFD700] mb-4 flex items-center gap-2">
              <span className="transition-colors duration-300">User Settings</span>
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={codeWrap}
                  onToggle={() =>
                    handleUpdate({
                      codeWrap: !codeWrap,
                    })
                  }
                  text="Wrap Codeblocks"
                />
                <p className="text-xs text-gray-400 mt-1">Automatically wrap long code lines in chat responses</p>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={displayRawMarkdown}
                  onToggle={() =>
                    handleUpdate({
                      displayRawMarkdown: !displayRawMarkdown,
                    })
                  }
                  text="Display Raw Markdown"
                />
                <p className="text-xs text-gray-400 mt-1">Show markdown source instead of rendered content</p>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={allowAnonymousTelemetry}
                  onToggle={() =>
                    handleUpdate({
                      allowAnonymousTelemetry: !allowAnonymousTelemetry,
                    })
                  }
                  text="Allow Anonymous Telemetry"
                />
                <p className="text-xs text-gray-400 mt-1">Help improve the app by sending anonymous usage data</p>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={disableIndexing}
                  onToggle={() =>
                    handleUpdate({
                      disableIndexing: !disableIndexing,
                    })
                  }
                  text="Disable Indexing"
                />
                <p className="text-xs text-gray-400 mt-1">Turn off codebase indexing functionality</p>
              </div>

              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={disableSessionTitles}
                  onToggle={() =>
                    handleUpdate({
                      disableSessionTitles: !disableSessionTitles,
                    })
                  }
                  text="Disable Session Titles"
                />
                <p className="text-xs text-gray-400 mt-1">Don't automatically generate titles for chat sessions</p>
              </div>
              
              {/* <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={readResponseTTS}
                  onToggle={() =>
                    handleUpdate({
                      readResponseTTS: !readResponseTTS,
                    })
                  }
                  text="Response Text to Speech"
                />
                <p className="text-xs text-gray-400 mt-1">Read AI responses aloud using text-to-speech</p>
              </div> */}
              
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={showChatScrollbar}
                  onToggle={() =>
                    handleUpdate({
                      showChatScrollbar: !showChatScrollbar,
                    })
                  }
                  text="Show Chat Scrollbar"
                />
                <p className="text-xs text-gray-400 mt-1">Display scrollbar in the chat interface</p>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={useAutocompleteCache}
                  onToggle={() =>
                    handleUpdate({
                      useAutocompleteCache: !useAutocompleteCache,
                    })
                  }
                  text="Use Autocomplete Cache"
                />
                <p className="text-xs text-gray-400 mt-1">Cache autocomplete suggestions for better performance</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-black/20 rounded-lg p-4 transition-all hover:bg-black/30">
                <ToggleSwitch
                  isToggled={useChromiumForDocsCrawling}
                  onToggle={() =>
                    handleUpdate({
                      useChromiumForDocsCrawling: !useChromiumForDocsCrawling,
                    })
                  }
                  text="Use Chromium for Docs Crawling"
                />
                <p className="text-xs text-gray-400 mt-1">Use Chromium browser for crawling documentation websites</p>
              </div>

              <div className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-lg">
                <span className="text-gray-300">Codeblock Actions Position</span>
                <Select
                  value={codeBlockToolbarPosition}
                  onChange={(e) =>
                    handleUpdate({
                      codeBlockToolbarPosition: e.target.value as
                        | "top"
                        | "bottom",
                    })
                  }
                  className="bg-black/30 border-white/10 text-white"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-lg">
                <span className="text-gray-300">Multiline Autocompletions</span>
                <Select
                  value={useAutocompleteMultilineCompletions}
                  onChange={(e) =>
                    handleUpdate({
                      useAutocompleteMultilineCompletions: e.target.value as
                        | "auto"
                        | "always"
                        | "never",
                    })
                  }
                  className="bg-black/30 border-white/10 text-white"
                >
                  <option value="auto">Auto</option>
                  <option value="always">Always</option>
                  <option value="never">Never</option>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-lg">
                <span className="text-gray-300">Font Size</span>
                <NumberInput
                  value={fontSize}
                  onChange={(val) =>
                    handleUpdate({
                      fontSize: val,
                    })
                  }
                  min={7}
                  max={50}
                  // className="bg-black/30 border-white/10 text-white"
                />
              </div>

              <form
                className="flex flex-col gap-1 bg-black/20 p-3 rounded-lg"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitPromptPath();
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Workspace prompts path</span>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formPromptPath}
                      className="max-w-[200px] bg-black/30 border-white/10"
                      onChange={(e) => {
                        setFormPromptPath(e.target.value);
                      }}
                    />
                    <div className="flex h-full flex-col">
                      {formPromptPath !== promptPath ? (
                        <>
                          <div
                            onClick={handleSubmitPromptPath}
                            className="cursor-pointer"
                          >
                            <CheckIcon className="h-4 w-4 text-green-500 hover:opacity-80" />
                          </div>
                          <div
                            onClick={cancelChangePromptPath}
                            className="cursor-pointer"
                          >
                            <XMarkIcon className="h-4 w-4 text-red-500 hover:opacity-80" />
                          </div>
                        </>
                      ) : (
                        <div>
                          <CheckIcon className="text-vsc-foreground-muted h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
              
              <form
                className="flex flex-col gap-1 bg-black/20 p-3 rounded-lg"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDisableAutocompleteSubmit();
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Disable autocomplete in files</span>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formDisableAutocomplete}
                      className="max-w-[200px] bg-black/30 border-white/10"
                      onChange={(e) => {
                        setFormDisableAutocomplete(e.target.value);
                      }}
                    />
                    <div className="flex h-full flex-col">
                      {formDisableAutocomplete !== disableAutocompleteInFiles ? (
                        <>
                          <div
                            onClick={handleDisableAutocompleteSubmit}
                            className="cursor-pointer"
                          >
                            <CheckIcon className="h-4 w-4 text-green-500 hover:opacity-80" />
                          </div>
                          <div
                            onClick={cancelChangeDisableAutocomplete}
                            className="cursor-pointer"
                          >
                            <XMarkIcon className="h-4 w-4 text-red-500 hover:opacity-80" />
                          </div>
                        </>
                      ) : (
                        <div>
                          <CheckIcon className="text-vsc-foreground-muted h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-gray-500 self-end text-xs">
                  Comma-separated list of path matchers
                </span>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPage;
