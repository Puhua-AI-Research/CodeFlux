import { Editor, JSONContent } from "@tiptap/react";
import { ContextItemWithId, InputModifiers } from "core";
import { useDispatch } from "react-redux";
import styled, { keyframes } from "styled-components";
import { defaultBorderRadius, vscBackground } from "..";
import { selectSlashCommandComboBoxInputs } from "../../redux/selectors";
import ContextItemsPeek from "./ContextItemsPeek";
import TipTapEditor from "./TipTapEditor";
import { useAppSelector } from "../../redux/hooks";
import { ToolbarOptions } from "./InputToolbar";
import { useMemo } from "react";

interface ContinueInputBoxProps {
  isEditMode?: boolean;
  isLastUserInput: boolean;
  isMainInput?: boolean;
  onEnter: (
    editorState: JSONContent,
    modifiers: InputModifiers,
    editor: Editor,
  ) => void;
  editorState?: JSONContent;
  contextItems?: ContextItemWithId[];
  hidden?: boolean;
  inputId: string; // used to keep track of things per input in redux
}

const EDIT_DISALLOWED_CONTEXT_PROVIDERS = [
  "codebase",
  "tree",
  "open",
  "web",
  "diff",
  "folder",
  "search",
  "debugger",
  "repo-map",
];

const gradient = keyframes`
  0% {
    background-position: 0px 0;
  }
  100% {
    background-position: 100em 0;
  }
`;

const GradientBorder = styled.div<{
  borderRadius?: string;
  borderColor?: string;
  loading: 0 | 1;
}>`
  border-radius: ${(props) => props.borderRadius || "0"};
  padding: 1px;
  background: ${(props) =>
    props.borderColor
      ? props.borderColor
      : `repeating-linear-gradient(
      101.79deg,
      rgb(255,202,7) 0%,
      rgb(255,170,7) 20%,
      rgb(255,140,7) 40%,
      rgb(255,110,7) 60%,
      rgb(255,140,7) 80%,
      rgb(255,202,7) 100%
    )`};
  animation: ${(props) => (props.loading ? gradient : "")} 6s linear infinite;
  background-size: 200% 200%;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

// 定义一个名为ContinueInputBox的函数，接收一个ContinueInputBoxProps类型的参数props
function ContinueInputBox(props: ContinueInputBoxProps) {
  // 使用useAppSelector钩子获取session状态中的isStreaming属性
  const isStreaming = useAppSelector((state) => state.session.isStreaming);
  // 使用useAppSelector钩子获取slashCommandComboBoxInputs选择器中的availableSlashCommands属性
  const availableSlashCommands = useAppSelector(
    selectSlashCommandComboBoxInputs,
  );
  // 使用useAppSelector钩子获取config状态中的contextProviders属性
  const availableContextProviders = useAppSelector(
    (state) => state.config.config.contextProviders,
  );
  const editModeState = useAppSelector((state) => state.editModeState);

  const filteredSlashCommands = props.isEditMode ? [] : availableSlashCommands;
  // 如果props.isEditMode为true，则filteredSlashCommands为空数组，否则为availableSlashCommands
  const filteredContextProviders = useMemo(() => {
  // 如果props.isEditMode为false，则filteredContextProviders为availableContextProviders，否则为availableContextProviders中不包含EDIT_DISALLOWED_CONTEXT_PROVIDERS中的title的数组
    if (!props.isEditMode) {
      return availableContextProviders ?? [];
    }

    return (
      availableContextProviders?.filter(
        (provider) =>
          !EDIT_DISALLOWED_CONTEXT_PROVIDERS.includes(provider.title),
      ) ?? []
    );
  }, [availableContextProviders]);

  const historyKey = props.isEditMode ? "edit" : "chat";
  // 如果props.isEditMode为true，则historyKey为"edit"，否则为"chat"
  const placeholder = props.isEditMode
  // 如果props.isEditMode为true，则placeholder为"Describe how to modify the code - use '#' to add files"，否则为undefined
    ? "Describe how to modify the code - use '#' to add files"
    : undefined;

  const toolbarOptions: ToolbarOptions = props.isEditMode
    ? {
        hideAddContext: false,
        hideImageUpload: false,
        hideUseCodebase: true,
        hideSelectModel: false,
        hideTools: true,
        enterText: editModeState.editStatus === "accepting" ? "Retry" : "Edit",
      }
    : {};

  return (
    <div className={`${props.hidden ? "hidden" : ""}`}>
      <div className={`relative flex flex-col px-2 md:px-4 lg:px-auto`}>
        <GradientBorder
          loading={isStreaming && props.isLastUserInput ? 1 : 0}
          borderColor={
            isStreaming && props.isLastUserInput ? undefined : vscBackground
          }
          borderRadius={defaultBorderRadius}
        >
          <TipTapEditor
            editorState={props.editorState}
            onEnter={props.onEnter}
            placeholder={placeholder}
            isMainInput={props.isMainInput ?? false}
            availableContextProviders={filteredContextProviders}
            availableSlashCommands={filteredSlashCommands}
            historyKey={historyKey}
            toolbarOptions={toolbarOptions}
            inputId={props.inputId}
          />
        </GradientBorder>
      </div>
      <ContextItemsPeek
        contextItems={props.contextItems}
        isCurrentContextPeek={props.isLastUserInput}
      />
    </div>
  );
}

export default ContinueInputBox;
