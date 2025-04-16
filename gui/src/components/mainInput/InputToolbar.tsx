import { AtSymbolIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { InputModifiers } from "core";
import { modelSupportsImages, modelSupportsTools } from "core/llm/autodetect";
import { useRef } from "react";
import styled from "styled-components";
import {
  defaultBorderRadius,
  lightGray,
  vscForeground,
  vscInputBackground,
} from "..";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectUseActiveFile } from "../../redux/selectors";
import { selectDefaultModel } from "../../redux/slices/configSlice";
import {
  selectHasCodeToEdit,
  selectIsInEditMode,
} from "../../redux/slices/sessionSlice";
import { exitEditMode } from "../../redux/thunks";
import { loadLastSession } from "../../redux/thunks/session";
import {
  getAltKeyLabel,
  getFontSize,
  getMetaKeyLabel,
  isMetaEquivalentKeyPressed,
} from "../../util";
import { ToolTip } from "../gui/Tooltip";
import ModelSelect from "../modelSelection/ModelSelect";
import HoverItem from "./InputToolbar/HoverItem";
import ToggleToolsButton from "./InputToolbar/ToggleToolsButton";

const StyledDiv = styled.div<{ isHidden?: boolean }>`
  padding-top: 4px;
  justify-content: space-between;
  gap: 1px;
  background-color: ${vscInputBackground};
  align-items: center;
  font-size: ${getFontSize() - 2}px;
  cursor: ${(props) => (props.isHidden ? "default" : "text")};
  opacity: ${(props) => (props.isHidden ? 0 : 1)};
  pointer-events: ${(props) => (props.isHidden ? "none" : "auto")};
  user-select: none;

  & > * {
    flex: 0 0 auto;
  }
`;

const EnterButton = styled.button`
  all: unset;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  border-radius: ${defaultBorderRadius};
  color: ${vscForeground};
  cursor: pointer;

  :disabled {
    cursor: wait;
  }
`;

export interface ToolbarOptions {
  hideUseCodebase?: boolean;
  hideImageUpload?: boolean;
  hideAddContext?: boolean;
  enterText?: string;
  hideSelectModel?: boolean;
  hideTools?: boolean;
}

interface InputToolbarProps {
  onEnter?: (modifiers: InputModifiers) => void;
  onAddContextItem?: () => void;
  onAddSlashCommand?: () => void;
  onClick?: () => void;
  onImageFileSelected?: (file: File) => void;
  hidden?: boolean;
  activeKey: string | null;
  toolbarOptions?: ToolbarOptions;
  disabled?: boolean;
}

function InputToolbar(props: InputToolbarProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const defaultModel = useAppSelector(selectDefaultModel);
  const useActiveFile = useAppSelector(selectUseActiveFile);
  const isInEditMode = useAppSelector(selectIsInEditMode);
  const hasCodeToEdit = useAppSelector(selectHasCodeToEdit);
  const isEditModeAndNoCodeToEdit = isInEditMode && !hasCodeToEdit;
  const isEnterDisabled = props.disabled || isEditModeAndNoCodeToEdit;
  let shouldRenderToolsButton =
    defaultModel &&
    modelSupportsTools(defaultModel.model, defaultModel.provider) &&
    !props.toolbarOptions?.hideTools;
  shouldRenderToolsButton = false;
  let supportsImages =
    defaultModel &&
    modelSupportsImages(
      defaultModel.provider,
      defaultModel.model,
      defaultModel.title,
      defaultModel.capabilities,
    );
  supportsImages = true;

    const sendBtnIcon = () => {
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="&#229;&#143;&#145;&#233;&#128;&#129;">
        <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="18" height="18" fill="#999999"/>
        <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M1.81287 8.457L16.8978 2.63602V2.636C17.4645 2.41734 17.8161 2.72249 17.6841 3.31718L14.9301 15.7267C14.7977 16.3231 14.2936 16.5122 13.8033 16.1528L10.0293 13.3872L8.11745 15.2812C7.68389 15.7106 7.17704 15.5889 6.98302 15.0116L5.50107 10.602L1.85623 9.52053C0.984062 9.26172 0.962781 8.78502 1.81287 8.457ZM8.16756 11.1747L14.602 5.44173C15.0548 5.03829 14.9995 4.96463 14.4795 5.27652L6.31936 10.171C6.18932 10.249 6.12257 10.4289 6.1713 10.5758L7.41636 14.3288C7.51172 14.6162 7.61512 14.6039 7.64703 14.304L7.93109 11.6333C7.94716 11.482 8.05187 11.2778 8.16756 11.1747Z" fill="#999999"/>
        </g>
        </svg>
      )
    }

    

  return (
    <>
      <StyledDiv
        isHidden={props.hidden}
        onClick={props.onClick}
        id="input-toolbar"
        className="find-widget-skip flex"
      >
        <div className="flex items-center justify-start gap-2 whitespace-nowrap">
          
          <div className="xs:flex -mb-1 hidden items-center text-gray-400 transition-colors duration-200">
            <HoverItem onClick={props.onAddSlashCommand}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="hover:brightness-125">
                <path d="M10.5 2.75L5.5 13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <ToolTip id="add-slash-command-tooltip" place="top-middle">
                Add slash command
              </ToolTip>
            </HoverItem>
            
            {props.toolbarOptions?.hideAddContext || (
              <HoverItem onClick={props.onAddContextItem}>
                <AtSymbolIcon
                  data-tooltip-id="add-context-item-tooltip"
                  className="h-4 w-4 hover:brightness-125"
                />

                <ToolTip id="add-context-item-tooltip" place="top-middle">
                  Add context (files, docs, urls, etc.)
                </ToolTip>
              </HoverItem>
            )}
            {props.toolbarOptions?.hideImageUpload ||
              (supportsImages && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".jpg,.jpeg,.png,.gif,.svg,.webp"
                    onChange={(e) => {
                      const files = e.target?.files ?? [];
                      for (const file of files) {
                        props.onImageFileSelected?.(file);
                      }
                    }}
                  />
                  <HoverItem>
                    <PhotoIcon
                      className="h-4 w-4 hover:brightness-125"
                      data-tooltip-id="image-tooltip"
                      onClick={(e) => {
                        fileInputRef.current?.click();
                      }}
                    />
                    <ToolTip id="image-tooltip" place="top-middle">
                      Attach an image
                    </ToolTip>
                  </HoverItem>
                </>
              ))}
            {shouldRenderToolsButton && <ToggleToolsButton />}
          </div>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap text-gray-400">

          {isInEditMode && (
            <HoverItem
              className="hidden hover:underline sm:flex"
              onClick={async (e) => {
                await dispatch(
                  loadLastSession({
                    saveCurrentSession: false,
                  }),
                );
                dispatch(exitEditMode());
              }}
            >
              <span>
                <i>Esc</i> to exit
              </span>
            </HoverItem>
          )}
          <ModelSelect />
          <EnterButton
            data-testid="submit-input-button"
            onClick={async (e) => {
              if (props.onEnter) {
                props.onEnter({
                  useCodebase: isMetaEquivalentKeyPressed(e as any),
                  noContext: useActiveFile ? e.altKey : !e.altKey,
                });
              }
            }}
            disabled={isEnterDisabled}
          >
            {sendBtnIcon()}
          </EnterButton>
        </div>
      </StyledDiv>
    </>
  );
}

export default InputToolbar;
