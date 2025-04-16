import { useContext, useRef } from "react";
import {
  CommandLineIcon,
  PlayIcon,
  ArrowLeftEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { defaultBorderRadius, vscEditorBackground } from "..";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { isJetBrains } from "../../util";
import { isTerminalCodeBlock, getTerminalCommand } from "./utils";
import HeaderButtonWithToolTip from "../gui/HeaderButtonWithToolTip";
import { CopyIconButton } from "../gui/CopyIconButton";
import { v4 as uuidv4 } from "uuid";
import { useWebviewListener } from "../../hooks/useWebviewListener";
import { useAppSelector } from "../../redux/hooks";
import {
  selectDefaultModel,
  selectUIConfig,
} from "../../redux/slices/configSlice";

interface StepContainerPreActionButtonsProps {
  language: string | null;
  codeBlockContent: string;
  codeBlockIndex: number;
  children: any;
}

export default function StepContainerPreActionButtons({
  language,
  codeBlockContent,
  codeBlockIndex,
  children,
}: StepContainerPreActionButtonsProps) {
  const ideMessenger = useContext(IdeMessengerContext);
  const uiConfig = useAppSelector(selectUIConfig);
  const streamIdRef = useRef<string | null>(null);
  const nextCodeBlockIndex = useAppSelector(
    (state) => state.session.codeBlockApplyStates.curIndex,
  );
  const isStreaming = useAppSelector((state) => state.session.isStreaming);
  const isBottomToolbarPosition =
    uiConfig?.codeBlockToolbarPosition == "bottom";

  const toolTipPlacement = "bottom";

  const shouldRunTerminalCmd =
    !isJetBrains() && isTerminalCodeBlock(language, codeBlockContent);
  const isNextCodeBlock = nextCodeBlockIndex === codeBlockIndex;

  if (streamIdRef.current === null) {
    streamIdRef.current = uuidv4();
  }

  const defaultModel = useAppSelector(selectDefaultModel);

  function onClickApply() {
    if (!defaultModel || !streamIdRef.current) {
      return;
    }
    ideMessenger.post("applyToFile", {
      streamId: streamIdRef.current,
      text: codeBlockContent,
      curSelectedModelTitle: defaultModel.title,
    });
  }

  async function onClickRunTerminal(): Promise<void> {
    if (shouldRunTerminalCmd) {
      return ideMessenger.ide.runCommand(getTerminalCommand(codeBlockContent));
    }
  }

  // Handle apply keyboard shortcut
  useWebviewListener(
    "applyCodeFromChat",
    async () => onClickApply(),
    [isNextCodeBlock, codeBlockContent],
    !isNextCodeBlock,
  );

  const codeIcon = () => {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="&#228;&#187;&#163;&#231;&#160;&#129;&#231;&#164;&#186;&#228;&#190;&#139;">
      <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="16" height="16" fill="#999999"/>
      <path id="&#229;&#189;&#162;&#231;&#138;&#182;&#231;&#187;&#147;&#229;&#144;&#136;" fill-rule="evenodd" clip-rule="evenodd" d="M12.57 13.685H3.10755C2.49587 13.685 2 13.1891 2 12.5775V3.11498C1.99999 2.50209 2.49467 2.00409 3.10755 2H12.57C13.1858 2 13.685 2.49919 13.685 3.11498V12.5775C13.6809 13.1903 13.1829 13.685 12.57 13.685ZM3.10755 2.74332C3.00965 2.7433 2.91586 2.78269 2.84734 2.85261C2.77881 2.92254 2.74132 3.0171 2.74332 3.11498V4.11846H12.9417V3.11498C12.9417 2.90972 12.7753 2.74332 12.57 2.74332H3.10755ZM12.9417 4.86178V12.5775C12.9376 12.7798 12.7724 12.9417 12.57 12.9417H3.10755C2.90639 12.9417 2.74332 12.7786 2.74332 12.5775V4.86178H12.9417ZM7.02485 12.1835H6.92078C6.72373 12.126 6.61058 11.9197 6.66805 11.7226L8.36282 5.86527C8.4203 5.66 8.63329 5.5402 8.83855 5.59767C9.04381 5.65515 9.16362 5.86813 9.10614 6.0734L7.38164 11.9159C7.33331 12.073 7.18922 12.1811 7.02485 12.1835ZM5.28548 11.0908C5.35184 11.1406 5.43295 11.1668 5.51591 11.1651C5.63114 11.1664 5.7396 11.1108 5.8058 11.0165C5.9306 10.8542 5.90069 10.6216 5.7389 10.4962L3.9475 9.12844L5.74634 7.67154C5.90574 7.54389 5.9323 7.31153 5.8058 7.15121C5.67548 6.99088 5.44077 6.96444 5.27804 7.09175L3.10755 8.84598C3.01954 8.9192 2.97018 9.02888 2.97375 9.14331C2.97316 9.25665 3.02536 9.36381 3.11498 9.43321L5.28548 11.0908ZM10.1691 11.1651C10.0077 11.1684 9.86272 11.0672 9.81016 10.9146C9.7576 10.762 9.80952 10.5929 9.93866 10.4962L11.7301 9.12844L9.93123 7.6864C9.82501 7.60275 9.77148 7.46878 9.79081 7.33496C9.81014 7.20114 9.8994 7.0878 10.025 7.03763C10.1505 6.98747 10.2933 7.00809 10.3995 7.09175L12.57 8.83112C12.661 8.90206 12.711 9.01332 12.7038 9.12844C12.7044 9.24179 12.6522 9.34895 12.5626 9.41834L10.3921 11.0759C10.33 11.13 10.2514 11.1615 10.1691 11.1651Z" fill="#999999"/>
      </g>
      </svg>
    ) 
  }

  const copyIcon = () => {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="&#229;&#164;&#141;&#229;&#136;&#182;&#229;&#164;&#135;&#228;&#187;&#189;">
      <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="16" height="16" fill="#999999"/>
      <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M12.5072 2H4.90625C4.65931 2 4.45913 2.20018 4.45913 2.44712C4.45913 2.69405 4.65931 2.89423 4.90625 2.89423H12.5072C12.6307 2.89423 12.7308 2.99432 12.7308 3.11779V11.613C12.7308 11.8599 12.9309 12.0601 13.1779 12.0601C13.4248 12.0601 13.625 11.8599 13.625 11.613V3.11779C13.625 2.50166 13.1238 2 12.5072 2ZM3.11779 3.78846H10.7188C11.3353 3.78846 11.8365 4.29012 11.8365 4.90625V13.4014C11.8365 14.018 11.3353 14.5192 10.7188 14.5192H3.11779C2.50166 14.5192 2 14.018 2 13.4014V4.90625C2.00074 4.28922 2.50076 3.7892 3.11779 3.78846ZM10.7188 13.625C10.8417 13.625 10.9423 13.5244 10.9423 13.4014V4.90625C10.9423 4.78278 10.8422 4.68269 10.7188 4.68269H3.11779C2.99432 4.68269 2.89423 4.78278 2.89423 4.90625V13.4014C2.89423 13.5249 2.99432 13.625 3.11779 13.625H10.7188ZM4.68269 6.13582H9.15385C9.40078 6.13582 9.60096 6.336 9.60096 6.58293C9.60096 6.82987 9.40078 7.03005 9.15385 7.03005H4.68269C4.43576 7.03005 4.23558 6.82987 4.23558 6.58293C4.23558 6.336 4.43576 6.13582 4.68269 6.13582ZM9.15385 8.37139H4.68269C4.43576 8.37139 4.23558 8.57157 4.23558 8.81851C4.23558 9.06544 4.43576 9.26562 4.68269 9.26562H9.15385C9.40078 9.26562 9.60096 9.06544 9.60096 8.81851C9.60096 8.57157 9.40078 8.37139 9.15385 8.37139ZM4.68269 10.5882H7.36538C7.61232 10.5882 7.8125 10.7884 7.8125 11.0353C7.8125 11.2822 7.61232 11.4824 7.36538 11.4824H4.68269C4.43576 11.4824 4.23558 11.2822 4.23558 11.0353C4.23558 10.7884 4.43576 10.5882 4.68269 10.5882Z" fill="#999999"/>
      </g>
      </svg>

    )
  }

  return (
    <div
      tabIndex={-1}
      className="bg-vsc-editor-background border-vsc-input-border relative my-2.5 rounded-md border-[1px] border-solid overflow-hidden"
    >
      {/* Command icons row with background */}
      <div className="flex justify-end items-center bg-[rgb(195,195,195,0.05)] py-1.5 px-4 gap-3 border-b border-[#3a3a3a]">
        {shouldRunTerminalCmd && (
          <HeaderButtonWithToolTip
            text="Run in terminal"
            style={{ backgroundColor: "transparent" }}
            onClick={onClickRunTerminal}
            tooltipPlacement={toolTipPlacement}
          >
            <CommandLineIcon className="h-4 w-4 " />
          </HeaderButtonWithToolTip>
        )}
        <HeaderButtonWithToolTip
          text="Apply"
          style={{ backgroundColor: "transparent" }}
          onClick={onClickApply}
          tooltipPlacement={toolTipPlacement}
        >
          <PlayIcon className="h-4 w-4 " />
          {/* {codeIcon()} */}
        </HeaderButtonWithToolTip>
        <HeaderButtonWithToolTip
          text="Insert"
          style={{ backgroundColor: "transparent" }}
          onClick={() =>
            ideMessenger.post("insertAtCursor", { text: codeBlockContent })
          }
          tooltipPlacement={toolTipPlacement}
        >
          <ArrowLeftEndOnRectangleIcon className="h-4 w-4 " />
        </HeaderButtonWithToolTip>
        <CopyIconButton
          text={codeBlockContent}
          tooltipPlacement={toolTipPlacement}
        />
        {/* {copyIcon()} */}
      </div>
      
      <div className="h-full w-full overflow-x">
        {children}
      </div>
    </div>
  );
}
