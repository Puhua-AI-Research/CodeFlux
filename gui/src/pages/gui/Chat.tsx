import {
  ArrowLeftIcon,
  ChatBubbleOvalLeftIcon,
  CodeBracketSquareIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  SparklesIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BoltIcon,
  BeakerIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { Editor, JSONContent } from "@tiptap/react";
import { InputModifiers, RangeInFileWithContents, ToolCallState } from "core";
import { streamResponse } from "core/llm/stream";
import { stripImages } from "core/util/messageContent";
import { usePostHog } from "posthog-js/react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSelector } from "react-redux";
import styled from "styled-components";
import {
  Button,
  defaultBorderRadius,
  lightGray,
  vscBackground,
} from "../../components";
import CodeToEditCard from "../../components/CodeToEditCard";
import FeedbackDialog from "../../components/dialogs/FeedbackDialog";
import { useFindWidget } from "../../components/find/FindWidget";
import TimelineItem from "../../components/gui/TimelineItem";
import ChatIndexingPeeks from "../../components/indexing/ChatIndexingPeeks";
import ContinueInputBox from "../../components/mainInput/ContinueInputBox";
import { NewSessionButton } from "../../components/mainInput/NewSessionButton";
import resolveEditorContent from "../../components/mainInput/resolveInput";
import { TutorialCard } from "../../components/mainInput/TutorialCard";
import {
  OnboardingCard,
  useOnboardingCard,
} from "../../components/OnboardingCard";
import { PlatformOnboardingCard } from "../../components/OnboardingCard/platform/PlatformOnboardingCard";
import PageHeader from "../../components/PageHeader";
import StepContainer from "../../components/StepContainer";
import AcceptRejectAllButtons from "../../components/StepContainer/AcceptRejectAllButtons";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useTutorialCard } from "../../hooks/useTutorialCard";
import { useWebviewListener } from "../../hooks/useWebviewListener";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUsePlatform } from "../../redux/selectors";
import { selectCurrentToolCall } from "../../redux/selectors/selectCurrentToolCall";
import { selectDefaultModel } from "../../redux/slices/configSlice";
import { submitEdit } from "../../redux/slices/editModeState";
import {
  clearLastEmptyResponse,
  newSession,
  selectIsInEditMode,
  selectIsSingleRangeEditOrInsertion,
  setInactive,
} from "../../redux/slices/sessionSlice";
import {
  setDialogEntryOn,
  setDialogMessage,
  setShowDialog,
} from "../../redux/slices/uiSlice";
import { RootState } from "../../redux/store";
import { cancelStream } from "../../redux/thunks/cancelStream";
import { exitEditMode } from "../../redux/thunks/exitEditMode";
import { loadLastSession } from "../../redux/thunks/session";
import { streamResponseThunk } from "../../redux/thunks/streamResponse";
import {
  getFontSize,
  getMetaKeyLabel,
  isMetaEquivalentKeyPressed,
} from "../../util";
import {
  FREE_TRIAL_LIMIT_REQUESTS,
  incrementFreeTrialCount,
} from "../../util/freeTrial";
import getMultifileEditPrompt from "../../util/getMultifileEditPrompt";
import { getLocalStorage, setLocalStorage } from "../../util/localStorage";
import ConfigErrorIndicator from "./ConfigError";
import { ToolCallDiv } from "./ToolCallDiv";
import { ToolCallButtons } from "./ToolCallDiv/ToolCallButtonsDiv";
import ToolOutput from "./ToolCallDiv/ToolOutput";
import FreeTrialOverDialog from "../../components/dialogs/FreeTrialOverDialog";
import AssistantSelect from "../../components/modelSelection/platform/AssistantSelect";
import { MainLogoIcon } from "../../components/svg/MainLogoIcon";
import { getLanguage } from "../../util";

const StopButton = styled.div`
  background-color: ${vscBackground};
  width: fit-content;
  margin-right: 0;
  margin-left: auto;
  font-size: ${getFontSize() - 2}px;
  border: 0.5px solid ${lightGray};
  border-radius: ${defaultBorderRadius};
  padding: 4px 8px;
  cursor: pointer;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow:
      0 6px 8px rgba(0, 0, 0, 0.15),
      0 3px 6px rgba(0, 0, 0, 0.1);
  }
`;

const NewChatButton = styled(StopButton)`
  margin-left: auto;
`;

const StepsDiv = styled.div`
  position: relative;
  background-color: transparent;
  overflow-x: hidden;
  overflow-y: hidden;

  & > * {
    position: relative;
  }

  .thread-message {
    margin: 0px 2px 0 2px;
  }
`;

function fallbackRender({ error, resetErrorBoundary }: any) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div
      role="alert"
      className="px-2"
      style={{ backgroundColor: vscBackground }}
    >
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <pre style={{ color: lightGray }}>{error.stack}</pre>

      <div className="text-center">
        <Button onClick={resetErrorBoundary}>Restart</Button>
      </div>
    </div>
  );
}

const useAutoScroll = (
  ref: React.RefObject<HTMLDivElement>,
  history: unknown[],
) => {
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  useEffect(() => {
    if (history.length) {
      setUserHasScrolled(false);
    }
  }, [history.length]);

  useEffect(() => {
    if (!ref.current || history.length === 0) return;

    const handleScroll = () => {
      const elem = ref.current;
      if (!elem) return;

      const isAtBottom =
        Math.abs(elem.scrollHeight - elem.scrollTop - elem.clientHeight) < 1;

      /**
       * We stop auto scrolling if a user manually scrolled up.
       * We resume auto scrolling if a user manually scrolled to the bottom.
       */
      setUserHasScrolled(!isAtBottom);
    };

    const resizeObserver = new ResizeObserver(() => {
      const elem = ref.current;
      if (!elem || userHasScrolled) return;
      elem.scrollTop = elem.scrollHeight;
    });

    ref.current.addEventListener("scroll", handleScroll);

    // Observe the container
    resizeObserver.observe(ref.current);

    // Observe all immediate children
    Array.from(ref.current.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      resizeObserver.disconnect();
      ref.current?.removeEventListener("scroll", handleScroll);
    };
  }, [ref, history.length, userHasScrolled]);
};


export function Chat({
  currentLanguage = "en"
}) {
  const posthog = usePostHog();
  const dispatch = useAppDispatch();
  const ideMessenger = useContext(IdeMessengerContext);
  const onboardingCard = useOnboardingCard();
  const { showTutorialCard, closeTutorialCard } = useTutorialCard();
  const selectedModelTitle = useAppSelector(
    (store) => store.config.defaultModelTitle,
  );
  const defaultModel = useAppSelector(selectDefaultModel);
  const ttsActive = useAppSelector((state) => state.ui.ttsActive);
  const isStreaming = useAppSelector((state) => state.session.isStreaming);
  const [stepsOpen, setStepsOpen] = useState<(boolean | undefined)[]>([]);
  const mainTextInputRef = useRef<HTMLInputElement>(null);
  const stepsDivRef = useRef<HTMLDivElement>(null);
  const history = useAppSelector((state) => state.session.history);
  const showChatScrollbar = useAppSelector(
    (state) => state.config.config.ui?.showChatScrollbar,
  );
  const codeToEdit = useAppSelector((state) => state.session.codeToEdit);
  const toolCallState = useSelector<RootState, ToolCallState | undefined>(
    selectCurrentToolCall,
  );
  const applyStates = useAppSelector(
    (state) => state.session.codeBlockApplyStates.states,
  );
  const pendingApplyStates = applyStates.filter(
    (state) => state.status === "done",
  );
  const hasPendingApplies = pendingApplyStates.length > 0;
  const isInEditMode = useAppSelector(selectIsInEditMode);
  const isSingleRangeEditOrInsertion = useAppSelector(
    selectIsSingleRangeEditOrInsertion,
  );
  const lastSessionId = useAppSelector((state) => state.session.lastSessionId);
  const usePlatform = useAppSelector(selectUsePlatform);
  const [showInputBox, setShowInputBox] = useState(false);


  const suggestions = currentLanguage === "en" ? [
    "How to use fastapi ?",
    "What is the best way to use react with typescript ?",
    "How to set nginx configuration for https ?"
  ] : [
    "如何使用fastapi？",
    "使用typescript开发react应用的最佳实践是什么？",
    "如何配置nginx的https服务？"
  ];

  useEffect(() => {
    // Cmd + Backspace to delete current step
    const listener = (e: any) => {
      if (
        e.key === "Backspace" &&
        isMetaEquivalentKeyPressed(e) &&
        !e.shiftKey
      ) {
        dispatch(cancelStream());
      }
    };
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [isStreaming]);

  const { widget, highlights } = useFindWidget(stepsDivRef);

  const sendInput = useCallback(
    (
      editorState: JSONContent,
      modifiers: InputModifiers,
      index?: number,
      editorToClearOnSend?: Editor,
    ) => {
      if (defaultModel?.provider === "free-trial") {
        const newCount = incrementFreeTrialCount();

        if (newCount === FREE_TRIAL_LIMIT_REQUESTS) {
          posthog?.capture("ftc_reached");
        }
        if (newCount >= FREE_TRIAL_LIMIT_REQUESTS) {
          // Show this message whether using platform or not
          // So that something happens if in new chat
          ideMessenger.ide.showToast(
            "error",
            "You've reached the free trial limit. Please configure a model to continue.",
          );

          // Card in chat will only show if no history
          // Also, note that platform card ignore the "Best", always opens to main tab
          // onboardingCard.open("Best");

          // If history, show the dialog, which will automatically close if there is not history
          if (history.length) {
            // dispatch(setDialogMessage(<FreeTrialOverDialog />));
            dispatch(setShowDialog(true));
          }
          return;
        }
      }

      if (isSingleRangeEditOrInsertion) {
        handleSingleRangeEditOrInsertion(editorState);
        return;
      }

      const promptPreamble = isInEditMode
        ? getMultifileEditPrompt(codeToEdit)
        : undefined;

      dispatch(
        streamResponseThunk({ editorState, modifiers, promptPreamble, index }),
      );

      if (editorToClearOnSend) {
        editorToClearOnSend.commands.clearContent();
      }

      // Increment localstorage counter for popup
      const currentCount = getLocalStorage("mainTextEntryCounter");
      if (currentCount) {
        setLocalStorage("mainTextEntryCounter", currentCount + 1);
        if (currentCount === 300) {
          dispatch(setDialogMessage(<FeedbackDialog />));
          dispatch(setDialogEntryOn(false));
          dispatch(setShowDialog(true));
        }
      } else {
        setLocalStorage("mainTextEntryCounter", 1);
      }
    },
    [
      history,
      defaultModel,
      streamResponse,
      isSingleRangeEditOrInsertion,
      codeToEdit,
    ],
  );

  async function handleSingleRangeEditOrInsertion(editorState: JSONContent) {
    const [contextItems, __, userInstructions] = await resolveEditorContent({
      editorState,
      modifiers: {
        noContext: true,
        useCodebase: false,
      },
      ideMessenger,
      defaultContextProviders: [],
      dispatch,
      selectedModelTitle,
    });

    const prompt = [
      ...contextItems.map((item) => item.content),
      stripImages(userInstructions),
    ].join("\n\n");

    ideMessenger.post("edit/sendPrompt", {
      prompt,
      range: codeToEdit[0] as RangeInFileWithContents,
    });

    dispatch(submitEdit(prompt));
  }

  useWebviewListener(
    "newSession",
    async () => {
      // unwrapResult(response) // errors if session creation failed
      mainTextInputRef.current?.focus?.();
    },
    [mainTextInputRef],
  );

  const isLastUserInput = useCallback(
    (index: number): boolean => {
      return !history
        .slice(index + 1)
        .some((entry) => entry.message.role === "user");
    },
    [history],
  );

  const showScrollbar = showChatScrollbar || window.innerHeight > 5000;

  useAutoScroll(stepsDivRef, history);


  const promptIcon = () => {
    return (
      <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="icon_icon_&#230;&#143;&#144;&#233;&#151;&#174;_s&#229;&#164;&#135;&#228;&#187;&#189; 4">
      <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="21" height="21" fill="black"/>
      <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M15.6291 7.10985H17.0897C17.6627 7.10985 18.1288 7.5762 18.129 8.14898V15.4688C18.129 16.0416 17.6629 16.5078 17.0899 16.5078H16.3606C16.3485 17.0174 16.3371 17.5311 16.3369 17.6263C16.3492 17.9115 16.1968 18.1777 15.9413 18.3106C15.8336 18.3664 15.7171 18.3939 15.6014 18.3939C15.4323 18.3939 15.2645 18.3354 15.1287 18.2214L13.0874 16.5078H9.62772C9.27827 16.5078 8.99465 16.2243 8.99465 15.8747C8.99465 15.525 9.27807 15.2416 9.62772 15.2416H13.1715C13.4307 15.2416 13.6776 15.3368 13.8692 15.5105L15.0933 16.5381L15.095 16.4634L15.0992 16.2902C15.1043 15.711 15.577 15.2416 16.1572 15.2416H16.8627V8.37621H15.6291V12.6328C15.6291 13.6289 14.8187 14.4393 13.8224 14.4393H9.03854C8.8917 14.4393 8.75204 14.4951 8.6454 14.596L6.19205 16.9194C5.94264 17.1559 5.57627 17.2211 5.26059 17.0851C4.94456 16.9491 4.7403 16.6388 4.7403 16.2947V14.6906C4.7403 14.5521 4.62771 14.4396 4.48949 14.4396H4.20566C3.20939 14.4396 2.39893 13.6291 2.39893 12.633V4.97704C2.39893 3.98077 3.20939 3.1703 4.20566 3.1703H13.8224C14.8187 3.1703 15.6291 3.98077 15.6291 4.97704V7.10985ZM9.5865 11.8562C9.27526 11.8562 9.02295 11.6039 9.02295 11.2926C9.02295 10.9814 9.27526 10.7291 9.5865 10.7291C9.89775 10.7291 10.1501 10.9814 10.1501 11.2926C10.1501 11.6039 9.89775 11.8562 9.5865 11.8562ZM14.3628 12.633C14.3628 12.9308 14.1204 13.1732 13.8224 13.1732H9.03874C8.56665 13.1732 8.11773 13.352 7.77505 13.6767L6.00687 15.3511V14.6906C6.00687 13.8538 5.32621 13.1732 4.4897 13.1732H4.20587C3.90789 13.1732 3.66549 12.9308 3.66549 12.633V4.97704C3.66549 4.67906 3.90789 4.43666 4.20587 4.43666H13.8224C14.1204 4.43666 14.3628 4.67906 14.3628 4.97704V12.633ZM8.86442 9.97357C8.87283 10.3179 9.15461 10.5913 9.49709 10.5913C9.49878 10.5913 9.5005 10.5912 9.50223 10.5912C9.50574 10.5912 9.50931 10.5911 9.51288 10.5913C9.86254 10.5829 10.139 10.2927 10.1306 9.94301L10.1257 9.74306C10.3139 9.63908 10.5522 9.48794 10.7702 9.29168C11.1164 8.97996 11.3329 8.6301 11.4137 8.25132C11.4904 7.89161 11.4757 7.33031 10.97 6.70011C10.7005 6.3644 10.3016 6.14537 9.84654 6.08323C9.4571 6.02991 9.03895 6.09246 8.66919 6.25899C7.89604 6.607 7.48158 7.32703 7.61304 8.093C7.61632 8.11248 7.61878 8.12786 7.62042 8.13935C7.61176 8.25494 7.63518 8.37069 7.6881 8.47383C7.84724 8.78514 8.22868 8.90859 8.53999 8.74945C8.75532 8.63933 8.88596 8.42133 8.88965 8.16621C8.89067 8.08972 8.88186 8.00112 8.86094 7.87869C8.81705 7.62214 9.04756 7.47715 9.18906 7.41337C9.45238 7.29483 9.82111 7.29196 9.9821 7.49253C10.1386 7.68756 10.2036 7.85388 10.1751 7.98697C10.1293 8.20128 9.84757 8.4644 9.43987 8.67357C9.07545 8.8604 8.84658 9.24595 8.85663 9.65569L8.86442 9.97357Z" fill="#999999"/>
      </g>
      </svg>
    )
  }


  return (
    <div className="no-scrollbar flex flex-col h-full relative">

      {widget}

      <StepsDiv
        ref={stepsDivRef}
        className={`pt-[8px] no-scrollbar ${history.length > 0 ? "pb-4" : "flex-1"}`}
      >
        {highlights}

        {history.map((item, index: number) => (
          <div
            key={item.message.id}
          >
            <ErrorBoundary
              FallbackComponent={fallbackRender}
              onReset={() => {
                dispatch(newSession());
              }}
            >
              {item.message.role === "user" ? (
                <>
                  {isInEditMode && index === 0 && <CodeToEditCard />}
                  <div className="pr-0.5">
                    <ContinueInputBox
                      isEditMode={isInEditMode}
                      onEnter={(editorState, modifiers) =>
                        sendInput(editorState, modifiers, index)
                      }
                      isLastUserInput={isLastUserInput(index)}
                      isMainInput={false}
                      editorState={item.editorState}
                      contextItems={item.contextItems}
                      inputId={item.message.id}
                      currentLanguage={currentLanguage}
                    />
                  </div>
                </>
              ) : item.message.role === "tool" ? (
                <ToolOutput
                  contextItems={item.contextItems}
                  toolCallId={item.message.toolCallId}
                />
              ) : item.message.role === "assistant" &&
                item.message.toolCalls &&
                item.toolCallState ? (
                <div>
                  {item.message.toolCalls?.map((toolCall, i) => {
                    return (
                      <div key={i}>
                        <ToolCallDiv
                          toolCallState={item.toolCallState!}
                          toolCall={toolCall}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="thread-message">
                  <TimelineItem
                    item={item}
                    iconElement={
                      false ? (
                        <CodeBracketSquareIcon width="16px" height="16px" />
                      ) : false ? (
                        <ExclamationTriangleIcon
                          width="16px"
                          height="16px"
                          color="red"
                        />
                      ) : (
                        <ChatBubbleOvalLeftIcon width="16px" height="16px" />
                      )
                    }
                    open={
                      typeof stepsOpen[index] === "undefined"
                        ? false
                          ? false
                          : true
                        : stepsOpen[index]!
                    }
                    onToggle={() => { }}
                  >
                    <StepContainer
                      index={index}
                      isLast={index === history.length - 1}
                      item={item}
                    />
                  </TimelineItem>
                </div>
              )}
            </ErrorBoundary>
          </div>
        ))}
      </StepsDiv>
      <div className={`relative`}>
        <div className="absolute -top-8">
        </div>

        {toolCallState?.status === "generated" && <ToolCallButtons />}

        {isInEditMode && history.length === 0 && <CodeToEditCard />}



        <div
          style={{
            pointerEvents: isStreaming ? "none" : "auto",
          }}
        >

          {hasPendingApplies && isSingleRangeEditOrInsertion && (
            <AcceptRejectAllButtons
              pendingApplyStates={pendingApplyStates}
              onAcceptOrReject={async (outcome) => {
                if (outcome === "acceptDiff") {
                  await dispatch(
                    loadLastSession({
                      saveCurrentSession: false,
                    }),
                  );
                  dispatch(exitEditMode());
                }
              }}
            />
          )}

          {history.length === 0 && (
            <>
              <div className="mb-12 flex flex-col  justify-center overflow-auto no-scrollbar px-2 md:px-4 lg:px-auto">
                <div className="flex flex-col items-center py-10">
                  <h1 className="text-xl font-medium text-[#FFD700] flex items-center gap-2">
                    <MainLogoIcon></MainLogoIcon>
                  </h1>
                  <p className="text-left max-w-md mb-6 text-sm animate-fadeIn">
                    {currentLanguage === "en"
                      ? "CodeFlux is an intelligent programming assistant that provides code completion, explanation, optimization, comment generation, and conversational Q&A features to enhance developer productivity."
                      : "CodeFlux是一个智能编程助手，提供代码补全、解释、优化、注释生成和对话问答功能，以提高开发者的工作效率。"}
                  </p>


                </div>
              </div>
            </>
          )}
        </div>
      </div>

      { history.length === 0 ? null : (<p style={{height: "70px"}}></p>)}
      {isInEditMode && history.length > 0 ? null : (
        <div className="fixed bottom-0 left-0 right-0 mx-auto bg-[inherit] z-10 pb-4 px-[20px]">
          {history.length > 0 && (
            <div className="flex justify-end mb-2 pr-0" style={{paddingRight: "0px", marginRight: "0px"}}>
              {isStreaming ? (
                <StopButton
                  onClick={() => {
                    dispatch(setInactive());
                    dispatch(clearLastEmptyResponse());
                  }}
                >
                  {currentLanguage === "en" ? `${getMetaKeyLabel()} ⌫ Cancel` : `${getMetaKeyLabel()} ⌫ 取消`}
                </StopButton>
              ) : <NewChatButton
                onClick={() => {
                  dispatch(newSession());
                }}
              >
                {currentLanguage === "en" ? "New Chat" : "新对话"}
              </NewChatButton>}
            </div>
          )}
          {history.length === 0 && (
            <div className="flex flex-col gap-[10px] w-full mt-2 mb-[20px] mx-auto">
              <div className="text-sm mb-[10px] flex items-center gap-2">
                {promptIcon()}
                {currentLanguage === "en" ? "How to write a prompt:" : "如何编写提示词："}
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{cursor: "pointer"}}
                  className="p-2 h-[18px] hover:bg-gray-500 transition-all bg-[rgb(195,195,195,0.2)] text-left text-sm font-medium rounded-md"
                  onClick={() => {
                    const editorState = {
                      type: "doc",
                      content: [{
                        type: "paragraph",
                        content: [{ type: "text", text: suggestion }]
                      }]
                    };
                    sendInput(editorState, { noContext: false, useCodebase: false });
                  }}
                >
                  <div className="truncate">{suggestion}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{paddingRight: history.length === 0 ? "0px" : "0px"}}>
            <ContinueInputBox
              isMainInput
              isEditMode={isInEditMode}
              isLastUserInput={false}
              onEnter={(editorState, modifiers, editor) =>
                sendInput(editorState, modifiers, undefined, editor)
              }
              inputId={"main-editor"}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
