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
import { getFontSize,getLanguage } from "../../util";
import { ScopeSelect } from "./ScopeSelect";
import { editConfigJson, resetConfigJson } from "core/util/paths";
import { Tab } from "@headlessui/react";
import { setLocalStorage } from "../../util/localStorage";

function ConfigPage({
  currentLanguage="en",
}) {
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

  const handleSyncConfig = () => {
    if (!remoteConfigUrl) {
      ideMessenger.ide.showToast("error", "Please enter a valid remote configuration URL", "Error");
      return;
    }
    try {
      ideMessenger.request("config/resetFromRemoteConfig", { url: remoteConfigUrl, apiKey: apiKey }).then((response) => {
        if (response.status == "success") {
          ideMessenger.ide.showToast("info", "Configuration synchronized successfully", "OK");
        } else {
          ideMessenger.ide.showToast("error", "Configuration synchronization failed", "Error");
        }

      }).catch((error) => {
        ideMessenger.ide.showToast("error", "Configuration synchronization failed" + error, "Error");
      });

    } catch (error) {
      ideMessenger.ide.showToast("error", "Configuration synchronization failed", "Error");
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

  // Define tab categories with language support
  const categories = [
    { name: currentLanguage === "en" ? "General" : "通用" },
    { name: currentLanguage === "en" ? "RemoteConfig" : "远程配置" },
  ];

  if (!selectedProfile) {
    return (
      <div className="overflow-y-scroll">
        <div className="px-4">
          <div>
            <h2>{currentLanguage === "en" ? "CodeFlux Config" : "CodeFlux 配置"}</h2>
          </div>
          <p className="italic">{currentLanguage === "en" ? "No config profile selected" : "未选择配置配置文件"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-scroll no-scrollbar">
      <div className="px-4 py-6 max-w-3xl mx-auto">
        {hubEnabled && !!session && (
          <div className="relative bg-white/3 dark:bg-white/3 light:bg-black/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 dark:border-white/10 light:border-black/10 mb-6 group transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 dark:from-white/5 light:from-black/5 to-transparent transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="text-xl font-medium text-[rgb(255,202,7)] mb-4 flex items-center gap-2">
                <span className="transition-colors duration-300">{currentLanguage === "en" ? "Account" : "账户"}</span>
              </h2>
              {selectedOrganization?.name && (
                <span className=" dark: light:text-gray-800">
                  {currentLanguage === "en" ? "You are currently signed in to" : "您当前登录到"}{" "}
                  <span className="font-semibold text-gray-100 dark:text-gray-100 light:text-gray-900">
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

        <div className="relative backdrop-blur-sm rounded-xl p-6 border mb-6 group transition-all duration-500 overflow-hidden">
          {/* <div className="absolute inset-0 bg-gradient-to-r from-white/5 dark:from-white/5 light:from-black/5 to-transparent transition-opacity duration-500"></div> */}
          <div className="relative">

            <Tab.Group>
              <Tab.List className="flex flex-wrap gap-2 rounded-xl p-1 mb-4">
                {categories.map((category) => (
                  <Tab
                    key={category.name}
                    className={({ selected }) =>
                      `basis-[calc(50%-0.25rem)] flex-grow-0 rounded-lg py-2.5 px-4 text-sm font-medium leading-5 transition-all duration-200
                      ${selected
                        ? "bg-[rgb(255,202,7)] shadow"
                        : ""
                      }`
                    }
                  >
                    <span className="flex items-center justify-center gap-2 w-full">
                      <span className="text-center">{category.name}</span>
                    </span>
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="mt-2">
                {/* General Settings Panel - Organized by input type */}
                <Tab.Panel className="space-y-4">
                  {/* Toggle switches */}

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Disable Indexing" : "禁用索引"}</span>
                      <Select
                        value={disableIndexing ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            disableIndexing: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Turn off codebase indexing functionality" : "关闭代码库索引功能"}
                    </p>
                  </div>

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Disable Session Titles" : "禁用会话标题"}</span>
                      <Select
                        value={disableSessionTitles ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            disableSessionTitles: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Don't automatically generate titles for chat sessions" : "不要自动为聊天会话生成标题"}
                    </p>
                  </div>

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Wrap Codeblocks" : "包裹代码块"}</span>
                      <Select
                        value={codeWrap ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            codeWrap: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Automatically wrap long code lines in chat responses" : "自动将长代码行包裹在聊天响应中"}
                    </p>
                  </div>

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Display Raw Markdown" : "显示原始Markdown"}</span>
                      <Select
                        value={displayRawMarkdown ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            displayRawMarkdown: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Show markdown source instead of rendered content" : "显示Markdown源代码而不是渲染的内容"}
                    </p>
                  </div>

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Show Chat Scrollbar" : "显示聊天滚动条"}</span>
                      <Select
                        value={showChatScrollbar ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            showChatScrollbar: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Display scrollbar in the chat interface" : "在聊天界面中显示滚动条"}
                    </p>
                  </div>

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Use Autocomplete Cache" : "使用自动完成缓存"}</span>
                      <Select
                        value={useAutocompleteCache ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            useAutocompleteCache: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Cache autocomplete suggestions for better performance" : "为更好的性能缓存自动完成建议"}
                    </p>
                  </div>

                  <div className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 rounded-lg p-4 transition-all hover:bg-black/30 dark:hover:bg-black/30 light:hover:bg-gray-200/70">
                    <div className="flex items-center justify-between gap-3">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Use Chromium for Docs Crawling" : "使用Chromium进行文档爬取"}</span>
                      <Select
                        value={useChromiumForDocsCrawling ? "yes" : "no"}
                        onChange={(e) => 
                          handleUpdate({
                            useChromiumForDocsCrawling: e.target.value === "yes",
                          })
                        }
                        className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                      >
                        <option value="yes">{currentLanguage === "en" ? "Yes" : "是"}</option>
                        <option value="no">{currentLanguage === "en" ? "No" : "否"}</option>
                      </Select>
                    </div>
                    <p className="text-xs dark: light:text-gray-700 mt-1">
                      {currentLanguage === "en" ? "Use Chromium browser for crawling documentation websites" : "使用Chromium浏览器爬取文档网站"}
                    </p>
                  </div>

                  {/* Dropdown selects */}
                  <div className="flex items-center justify-between gap-3 bg-black/20 dark:bg-black/20 light:bg-gray-200/50 p-3 rounded-lg">
                    <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Codeblock Actions Position" : "代码块操作位置"}</span>
                    <Select
                      value={codeBlockToolbarPosition}
                      onChange={(e) =>
                        handleUpdate({
                          codeBlockToolbarPosition: e.target.value as
                            | "top"
                            | "bottom",
                        })
                      }
                      className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                    >
                      <option value="top">{currentLanguage === "en" ? "Top" : "顶部"}</option>
                      <option value="bottom">{currentLanguage === "en" ? "Bottom" : "底部"}</option>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-black/20 dark:bg-black/20 light:bg-gray-200/50 p-3 rounded-lg">
                    <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Multiline Autocompletions" : "多行自动完成"}</span>
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
                      className="bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20 text-gray-100 dark:text-gray-100"
                    >
                      <option value="auto">{currentLanguage === "en" ? "Auto" : "自动"}</option>
                      <option value="always">{currentLanguage === "en" ? "Always" : "总是"}</option>
                      <option value="never">{currentLanguage === "en" ? "Never" : "从不"}</option>
                    </Select>
                  </div>

                  {/* Number inputs */}
                  <div className="flex items-center justify-between gap-3 bg-black/20 dark:bg-black/20 light:bg-gray-200/50 p-3 rounded-lg">
                    <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Font Size" : "字体大小"}</span>
                    <NumberInput
                      value={fontSize}
                      onChange={(val) =>
                        handleUpdate({
                          fontSize: val,
                        })
                      }
                      min={7}
                      max={50}
                    />
                  </div>

                  {/* Text inputs with form submission */}
                  <form
                    className="flex flex-col gap-1 bg-black/20 dark:bg-black/20 light:bg-gray-200/50 p-3 rounded-lg"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDisableAutocompleteSubmit();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="dark: light:text-gray-800">{currentLanguage === "en" ? "Disable autocomplete in files" : "在文件中禁用自动完成"}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          value={formDisableAutocomplete}
                          className="max-w-[200px] bg-black/30 dark:bg-black/30 light:bg-gray-200/70 border-white/10 dark:border-white/10 light:border-black/20"
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
                      {currentLanguage === "en" ? "Comma-separated list of path matchers" : "逗号分隔的路径匹配器列表"}
                    </span>
                  </form>
                </Tab.Panel>

                {/* RemoteConfig Panel */}
                <Tab.Panel className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label>{currentLanguage === "en" ? "Remote Configuration URL" : "远程配置URL"}</label>
                    <Input
                      value={remoteConfigUrl}
                      onChange={(e) => {
                        setRemoteConfigUrl(e.target.value);
                      }}
                      placeholder={currentLanguage === "en" ? "Enter remote configuration URL" : "输入远程配置URL"}
                      className="bg-black/30 dark:bg-black/30 light:bg-white/70 border-white/10 dark:border-white/10 light:border-black/20 focus:border-[rgb(255,202,7)]/50 transition-colors text-gray-100 dark:text-gray-100 light:text-gray-900"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label>{currentLanguage === "en" ? "API Key" : "API密钥"}</label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                      }}
                      placeholder={currentLanguage === "en" ? "Enter API Key" : "输入API密钥"}
                      className="bg-black/30 dark:bg-black/30 light:bg-white/70 border-white/10 dark:border-white/10 light:border-black/20 focus:border-[rgb(255,202,7)]/50 transition-colors text-gray-100 dark:text-gray-100 light:text-gray-900"
                    />
                  </div>

                  <SecondaryButton
                    onClick={handleSyncConfig}
                    className="mt-2 bg-[rgb(255,202,7)]/10 hover:bg-[rgb(255,202,7)]/20 text-[rgb(255,202,7)] border border-[rgb(255,202,7)]/30 transition-all duration-300"
                  >
                    {currentLanguage === "en" ? "Sync Remote Configuration" : "同步远程配置"}
                  </SecondaryButton>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPage;
