import { Listbox } from "@headlessui/react";
import {
  ChevronDownIcon,
  Cog6ToothIcon,
  CubeIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { defaultBorderRadius, lightGray, vscInputBackground } from "..";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import AddModelForm from "../../forms/AddModelForm";
import { useAppSelector } from "../../redux/hooks";
import {
  selectDefaultModel,
  setDefaultModel,
} from "../../redux/slices/configSlice";
import { setDialogMessage, setShowDialog } from "../../redux/slices/uiSlice";
import {
  getFontSize,
  getMetaKeyLabel,
  isMetaEquivalentKeyPressed,
} from "../../util";
import ConfirmationDialog from "../dialogs/ConfirmationDialog";
import { Divider } from "./platform/shared";

interface ModelOptionProps {
  option: Option;
  idx: number;
  showMissingApiKeyMsg: boolean;
  showDelete?: boolean;
}

interface Option {
  value: string;
  title: string;
  apiKey?: string;
}

const MAX_HEIGHT_PX = 300;

const StyledListboxButton = styled(Listbox.Button)`
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  cursor: pointer;
  font-size: ${getFontSize() - 2}px;
  background: transparent;
  color: ${lightGray};
  &:focus {
    outline: none;
  }
`;

const StyledListboxOptions = styled(Listbox.Options)<{ $showabove: boolean }>`
  margin-top: 4px;
  position: absolute;
  list-style: none;
  padding: 0px;
  white-space: nowrap;
  cursor: default;

  display: flex;
  flex-direction: column;

  border-radius: ${defaultBorderRadius};
  border: 0.5px solid ${lightGray};
  background-color: ${vscInputBackground};

  max-height: ${MAX_HEIGHT_PX}px;
  overflow-y: scroll;

  scrollbar-width: none;

  ${(props) => (props.$showabove ? "bottom: 100%;" : "top: 100%;")}
`;

const StyledListboxOption = styled(Listbox.Option)<{ isDisabled?: boolean }>`
  border-radius: ${defaultBorderRadius};
  padding: 6px 12px;

  ${({ isDisabled }) =>
    !isDisabled &&
    `
    cursor: pointer;

    &:hover {
      background: ${lightGray}33;
    }
  `}

  ${({ isDisabled }) =>
    isDisabled &&
    `
    opacity: 0.5;
  `}
`;

const IconBase = styled.div<{ $hovered: boolean }>`
  width: 1.2em;
  height: 1.2em;
  cursor: pointer;
  padding: 4px;
  border-radius: ${defaultBorderRadius};
  opacity: ${(props) => (props.$hovered ? 0.75 : 0)};
  visibility: ${(props) => (props.$hovered ? "visible" : "hidden")};

  &:hover {
    opacity: 1;
    background-color: ${lightGray}33;
  }
`;

const StyledTrashIcon = styled(IconBase).attrs({ as: TrashIcon })``;
const StyledCog6ToothIcon = styled(IconBase).attrs({ as: Cog6ToothIcon })``;

function modelSelectTitle(model: any): string {
  if (model?.title) return model?.title;
  if (model?.model !== undefined && model?.model.trim() !== "") {
    if (model?.class_name) {
      return `${model?.class_name} - ${model?.model}`;
    }
    return model?.model;
  }
  return model?.class_name;
}

function ModelOption({
  option,
  idx,
  showDelete,
  showMissingApiKeyMsg,
}: ModelOptionProps) {
  const ideMessenger = useContext(IdeMessengerContext);

  const dispatch = useDispatch();
  const [hovered, setHovered] = useState(false);

  function onClickDelete(e: any) {
    e.stopPropagation();
    e.preventDefault();

    dispatch(setShowDialog(true));
    dispatch(
      setDialogMessage(
        <ConfirmationDialog
          title={`Delete ${option.title}`}
          text={`Are you sure you want to remove ${option.title} from your configuration?`}
          onConfirm={() => {
            ideMessenger.post("config/deleteModel", {
              title: option.title,
            });
          }}
        />,
      ),
    );
  }

  function onClickGear(e: any) {
    e.stopPropagation();
    e.preventDefault();

    ideMessenger.post("config/openProfile", {
      profileId: "local",
    });
  }

  function handleOptionClick(e: any) {
    if (showMissingApiKeyMsg) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <StyledListboxOption
      key={idx}
      value={option.value}
      isDisabled={showMissingApiKeyMsg}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleOptionClick}
    >
      <div className="flex w-full flex-col gap-0.5">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-grow items-center">
            <CubeIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="flex-grow">
              {option.title}
              {showMissingApiKeyMsg && (
                <span className="ml-2 text-[10px] italic">
                  (Missing API key)
                </span>
              )}
            </span>
          </div>
          <div className="ml-5 flex items-center">
            {/* <StyledCog6ToothIcon $hovered={hovered} onClick={onClickGear} /> */}
            {showDelete && (
              <StyledTrashIcon $hovered={hovered} onClick={onClickDelete} />
            )}
          </div>
        </div>
      </div>
    </StyledListboxOption>
  );
}

function ModelSelect() {
  const dispatch = useDispatch();
  const defaultModel = useAppSelector(selectDefaultModel);
  const allModels = useAppSelector((state) => state.config.config.models);
  const ideMessenger = useContext(IdeMessengerContext);
  const [showAbove, setShowAbove] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [sortedOptions, setSortedOptions] = useState<Option[]>([]);
  const selectedProfileId = useAppSelector(
    (store) => store.session.selectedProfileId,
  );

  // Sort so that options without an API key are at the end
  useEffect(() => {
    const enabledOptions = options.filter((option) => option.apiKey !== "");
    const disabledOptions = options.filter((option) => option.apiKey === "");

    const sorted = [...enabledOptions, ...disabledOptions];

    setSortedOptions(sorted);
  }, [options]);

  useEffect(() => {
    setOptions(
      allModels.map((model) => {
        return {
          value: model.title,
          title: modelSelectTitle(model),
          apiKey: model.apiKey,
        };
      }),
    );
  }, [allModels]);

  useEffect(() => {
    const handleResize = () => calculatePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "'" && isMetaEquivalentKeyPressed(event as any)) {
        const direction = event.shiftKey ? -1 : 1;
        const currentIndex = options.findIndex(
          (option) => option.value === defaultModel?.title,
        );
        let nextIndex = (currentIndex + 1 * direction) % options.length;
        if (nextIndex < 0) nextIndex = options.length - 1;
        const newModelTitle = options[nextIndex].value;
        dispatch(setDefaultModel({ title: newModelTitle }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [options, defaultModel]);

  function calculatePosition() {
    if (!buttonRef.current) {
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = MAX_HEIGHT_PX;

    setShowAbove(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }

  function onClickAddModel(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    // Close the dropdown
    if (buttonRef.current) {
      buttonRef.current.click();
    }
    dispatch(setShowDialog(true));
    dispatch(
      setDialogMessage(
        <AddModelForm
          onDone={() => {
            dispatch(setShowDialog(false));
          }}
        />,
      ),
    );
  }

  const modelIcon = () => {
    return (
      <svg width="12" height="12" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="Iconfont SVG # &#230;&#168;&#161;&#229;&#158;&#139;" clip-path="url(#clip0_236_1445)">
      <path id="Vector" d="M3.37132 3.65103L0.371268 2.09501C0.331078 2.07285 0.285854 2.06236 0.24038 2.06464C0.194906 2.06692 0.150872 2.0819 0.112937 2.10798C0.0750015 2.13406 0.0445744 2.17028 0.0248739 2.21281C0.00517336 2.25533 -0.00306813 2.30259 0.00102109 2.34957V5.79504C0.00147545 5.83918 0.0128475 5.88246 0.0340505 5.92075C0.0552536 5.95904 0.0855791 5.99106 0.122129 6.01374L3.11527 7.95339C3.15447 7.97992 3.19995 7.9948 3.24675 7.99641C3.27947 7.99641 3.31187 7.98974 3.34209 7.97676C3.37232 7.96379 3.39979 7.94478 3.42292 7.92081C3.44606 7.89684 3.46441 7.86838 3.47693 7.83706C3.48945 7.80574 3.4959 7.77217 3.4959 7.73827V3.88408C3.49755 3.83717 3.48682 3.79068 3.46487 3.74962C3.44291 3.70855 3.41057 3.67447 3.37132 3.65103ZM7.88698 2.05915C7.85036 2.03844 7.80931 2.02759 7.7676 2.02759C7.72588 2.02759 7.68483 2.03844 7.64821 2.05915L4.15335 3.65103C4.10904 3.67123 4.07137 3.70437 4.04495 3.74639C4.01853 3.78842 4.00449 3.83751 4.00456 3.88766V7.74186C4.00477 7.78706 4.01644 7.83142 4.03839 7.87048C4.06035 7.90955 4.09182 7.94196 4.12965 7.96447C4.16749 7.98697 4.21037 7.99879 4.254 7.99873C4.29763 7.99868 4.34048 7.98675 4.37827 7.96415L7.86967 5.89184C7.90737 5.86929 7.9387 5.83691 7.96056 5.7979C7.98241 5.7589 7.99403 5.71465 7.99424 5.66955V2.27786C7.99528 2.23504 7.98601 2.19264 7.96729 2.15446C7.94856 2.11628 7.92096 2.08353 7.88698 2.05915ZM7.47521 1.39587C7.47294 1.34384 7.45553 1.29373 7.42527 1.25214C7.39501 1.21055 7.35331 1.17941 7.30565 1.16283L4.15335 0.0119512C4.10494 -0.00398374 4.05296 -0.00398374 4.00456 0.0119512L0.630789 1.23454C0.583825 1.25068 0.542563 1.28094 0.512263 1.32148C0.481963 1.36201 0.463998 1.41097 0.460658 1.46212C0.457317 1.51327 0.468753 1.5643 0.493507 1.60869C0.51826 1.65308 0.555211 1.68883 0.599649 1.71138L3.5997 3.2674C3.6343 3.28435 3.67216 3.29293 3.71043 3.2925C3.74355 3.29936 3.77766 3.29936 3.81079 3.2925L7.3091 1.68629C7.36582 1.6666 7.41382 1.62643 7.44432 1.57311C7.47481 1.51979 7.48577 1.45688 7.4752 1.39587H7.47521Z" fill="#999999"/>
      </g>
      <defs>
      <clipPath id="clip0_236_1445">
      <rect width="8" height="8" fill="white"/>
      </clipPath>
      </defs>
      </svg>
    )
  }

  return (
    <Listbox
      onChange={async (val: string) => {
        if (val === defaultModel?.title) return;
        dispatch(setDefaultModel({ title: val }));
      }}
    >
      <div className="relative">
        <StyledListboxButton
          data-testid="model-select-button"
          ref={buttonRef}
          className="h-[30px] overflow-hidden justify-center"
          style={{ padding: "2px" , fontSize: "12px"}}
          onClick={calculatePosition}
        >
          <div
            style={{border: "1px solid gray", padding: "2px 5px"}} 
            className="flex max-w-[33vw] items-center gap-0.5 text-gray-400 transition-colors duration-200">
            <span className="truncate" style={{fontSize: "12px"}}>
              {modelSelectTitle(defaultModel) || "Select model"}{" "}
            </span>
            <ChevronDownIcon
              className="h-3 w-3 flex-shrink-0"
              aria-hidden="true"
            />
          </div>
        </StyledListboxButton>
        <StyledListboxOptions
          $showabove={showAbove}
          className="z-50 max-w-[90vw] right-0"
        >
          <div
            className={`max-h-[${MAX_HEIGHT_PX}px] no-scrollbar overflow-y-scroll`}
            style={{ fontSize: "12px"}}
          >
            {sortedOptions.map((option, idx) => (
              <ModelOption
                option={option}
                idx={idx}
                key={idx}
                showDelete={options.length > 1}
                showMissingApiKeyMsg={option.apiKey === ""}
              />
            ))}
          </div>

          <div className="mt-auto">
            <Divider className="!my-0" />

            {selectedProfileId === "local" && (
              <>
                {/* <StyledListboxOption
                  key={options.length}
                  onClick={onClickAddModel}
                  value={"addModel" as any}
                >
                  <div className="flex items-center py-0.5">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Chat model
                  </div>
                </StyledListboxOption> */}
              </>
            )}

            <Divider className="!my-0" />

            {/* <span className="block px-3 py-3" style={{ color: lightGray }}>
              <code>{getMetaKeyLabel()} + '</code> to toggle
            </span> */}
          </div>
        </StyledListboxOptions>
      </div>
    </Listbox>
  );
}

export default ModelSelect;
