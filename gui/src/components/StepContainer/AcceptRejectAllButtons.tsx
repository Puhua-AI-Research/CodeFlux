import { useContext } from "react";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ApplyState } from "core";
import { getMetaKeyLabel } from "../../util";
import { useAppSelector } from "../../redux/hooks";
import { selectIsSingleRangeEditOrInsertion } from "../../redux/slices/sessionSlice";

export interface AcceptRejectAllButtonsProps {
  pendingApplyStates: ApplyState[];
  onAcceptOrReject?: (outcome: AcceptOrRejectOutcome) => void;
  currentLanguage: string;
}

export type AcceptOrRejectOutcome = "acceptDiff" | "rejectDiff";

export default function AcceptRejectAllButtons({
  pendingApplyStates,
  onAcceptOrReject,
  currentLanguage,
}: AcceptRejectAllButtonsProps) {
  const ideMessenger = useContext(IdeMessengerContext);
  const isSingleRangeEdit = useAppSelector(selectIsSingleRangeEditOrInsertion);

  async function handleAcceptOrReject(status: AcceptOrRejectOutcome) {
    for (const { filepath = "", streamId } of pendingApplyStates) {
      ideMessenger.post(status, {
        filepath,
        streamId,
      });
    }

    if (onAcceptOrReject) {
      onAcceptOrReject(status);
    }
  }

  return (
    <div className="flex justify-center gap-2 border-b border-gray-200/25 p-1 px-3">
      <button
        className="flex cursor-pointer items-center border-none bg-transparent px-2 py-1 text-xs text-gray-300 opacity-80 hover:opacity-100 hover:brightness-125"
        onClick={() => handleAcceptOrReject("rejectDiff")}
        data-testid="edit-reject-button"
      >
        <XMarkIcon className="mr-1 h-4 w-4 text-red-600" />
        {isSingleRangeEdit ? (
          <span>
            {currentLanguage === "en" ? "Reject" : "拒绝"} ({getMetaKeyLabel()}⇧⌫)
          </span>
        ) : (
          <>
            <span className="sm:hidden">{currentLanguage === "en" ? "Reject" : "拒绝"}</span>
            <span className="max-sm:hidden md:hidden">{currentLanguage === "en" ? "Reject all" : "全部拒绝"}</span>
            <span className="max-md:hidden">{currentLanguage === "en" ? "Reject all changes" : "拒绝所有更改"}</span>
          </>
        )}
      </button>
      <button
        className="flex cursor-pointer items-center border-none bg-transparent px-2 py-1 text-xs text-gray-300 opacity-80 hover:opacity-100 hover:brightness-125"
        onClick={() => handleAcceptOrReject("acceptDiff")}
        data-testid="edit-accept-button"
      >
        <CheckIcon className="mr-1 h-4 w-4 text-green-600" />
        {isSingleRangeEdit ? (
          <span>
            {currentLanguage === "en" ? "Accept" : "接受"} ({getMetaKeyLabel()}⇧⏎)
          </span>
        ) : (
          <>
            <span className="sm:hidden">{currentLanguage === "en" ? "Accept" : "接受"}</span>
            <span className="max-sm:hidden md:hidden">{currentLanguage === "en" ? "Accept all" : "全部接受"}</span>
            <span className="max-md:hidden">{currentLanguage === "en" ? "Accept all changes" : "接受所有更改"}</span>
          </>
        )}
      </button>
    </div>
  );
}
