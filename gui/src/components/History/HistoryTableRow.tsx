import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { SessionMetadata } from "core";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "..";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  deleteSession,
  getSession,
  loadSession,
  updateSession,
} from "../../redux/thunks/session";
import HeaderButtonWithToolTip from "../gui/HeaderButtonWithToolTip";
import {
  getLastNUriRelativePathParts,
  getUriPathBasename,
} from "core/util/uri";

interface HistoryTableRowProps {
  sessionMetadata: SessionMetadata;
  date: Date;
  index: number;
  currentLanguage: string;
  handleTabChange:(tab: string)=>void;
}

export function HistoryTableRow({
  sessionMetadata,
  date,
  index,
  currentLanguage,
  handleTabChange
}: HistoryTableRowProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ideMessenger = useContext(IdeMessengerContext);

  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sessionTitleEditValue, setSessionTitleEditValue] = useState(
    sessionMetadata.title,
  );
  const currentSessionId = useAppSelector((state) => state.session.id);

  useEffect(() => {
    setSessionTitleEditValue(sessionMetadata.title);
  }, [sessionMetadata]);

  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (sessionTitleEditValue !== sessionMetadata.title) {
        // imperfect solution of loading session just to update it
        // but fine for now, pretty low latency
        const currentSession = await getSession(
          ideMessenger,
          sessionMetadata.sessionId,
        );
        await dispatch(
          updateSession({
            ...currentSession,
            title: sessionTitleEditValue,
          }),
        );
      }
      setEditing(false);
    } else if (e.key === "Escape") {
      setSessionTitleEditValue(sessionMetadata.title);
      setEditing(false);
    }
  };

  const msgIcon = () => {
    return (
      <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="icon_icon_&#230;&#143;&#144;&#233;&#151;&#174;_s&#229;&#164;&#135;&#228;&#187;&#189; 3">
      <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="50" height="50" fill="#999999"/>
      <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M37.2114 16.9282H40.689C42.0532 16.9282 43.1631 18.0386 43.1636 19.4023V36.8306C43.1636 38.1943 42.0537 39.3042 40.6894 39.3042H38.9531C38.9243 40.5176 38.897 41.7407 38.8965 41.9673C38.9258 42.6465 38.563 43.2803 37.9546 43.5967C37.6982 43.7295 37.4209 43.7949 37.1455 43.7949C36.7427 43.7949 36.3433 43.6558 36.02 43.3843L31.1597 39.3042H22.9224C22.0903 39.3042 21.415 38.6294 21.415 37.7969C21.415 36.9644 22.0898 36.2895 22.9224 36.2895H31.3599C31.977 36.2895 32.5649 36.5161 33.021 36.9297L35.9355 39.3765C35.9369 39.3184 35.9383 39.259 35.9397 39.1982C35.9428 39.0669 35.946 38.9293 35.9497 38.7861C35.9619 37.4072 37.0874 36.2895 38.4687 36.2895H40.1484V19.9434H37.2114V30.0781C37.2114 32.4497 35.2817 34.3794 32.9097 34.3794H21.5195C21.1699 34.3794 20.8374 34.5122 20.5835 34.7524L14.7422 40.2842C14.1483 40.8474 13.2761 41.0025 12.5244 40.6787C11.772 40.355 11.2856 39.6162 11.2856 38.7969V34.9775C11.2856 34.6479 11.0176 34.3799 10.6885 34.3799H10.0127C7.64062 34.3799 5.71094 32.4502 5.71094 30.0786V11.8501C5.71094 9.47803 7.64062 7.54834 10.0127 7.54834H32.9097C35.2817 7.54834 37.2114 9.47803 37.2114 11.8501V16.9282ZM32.9097 31.3647C33.6191 31.3647 34.1963 30.7876 34.1963 30.0786V11.8501C34.1963 11.1406 33.6191 10.5635 32.9097 10.5635H10.0132C9.3037 10.5635 8.72655 11.1406 8.72655 11.8501V30.0786C8.72655 30.7876 9.3037 31.3647 10.0132 31.3647H10.689C12.6807 31.3647 14.3013 32.9853 14.3013 34.9775V36.5503L18.5112 32.5635C19.3271 31.7905 20.396 31.3647 21.52 31.3647H32.9097Z" fill="#999999"/>
      </g>
</svg>
    )
  }

  return (
    <tr>
      <td
        data-testid={`history-row-${index}`}
        className="p-1"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="bg-black/20 dark:bg-black/20 light:bg-gray-200/50 hover:bg-[rgb(195,195,195,0.2)] relative box-border flex max-w-full cursor-pointer overflow-hidden rounded-lg p-3 border border-gray-700"
          onClick={async () => {
            if (sessionMetadata.sessionId !== currentSessionId) {
              await dispatch(
                loadSession({
                  sessionId: sessionMetadata.sessionId,
                  saveCurrentSession: true,
                }),
              );
            }
            handleTabChange("chat")
          }}
        >
          <div className="flex items-center mr-3">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 cursor-pointer space-y-1">
            {editing ? (
              <div className="text-md">
                <Input
                  type="text"
                  className="w-full"
                  ref={(titleInput) => titleInput && titleInput.focus()}
                  value={sessionTitleEditValue}
                  onChange={(e) => setSessionTitleEditValue(e.target.value)}
                  onKeyUp={(e) => handleKeyUp(e)}
                  onBlur={() => setEditing(false)}
                />
              </div>
            ) : (
              <span className="text-md block max-w-80 truncate text-base font-semibold">
                {sessionMetadata.title}
              </span>
            )}

            <div className="flex" style={{ color: "#9ca3af" }}>
              <span>
                {getUriPathBasename(sessionMetadata.workspaceDirectory || "")}
              </span>
              {/* Uncomment to show the date */}
              {/* <span className="inline-block ml-auto">
                {date.toLocaleString(currentLanguage === "en" ? "en-US" : "zh-CN", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span> */}
            </div>
          </div>

          {hovered && !editing && (
            <div className="bg-vsc-background absolute right-2 top-1/2 ml-auto flex -translate-y-1/2 transform items-center gap-x-2 rounded-full py-1.5 pl-4 pr-4 shadow-md">
              <HeaderButtonWithToolTip
                text={currentLanguage === "en" ? "Edit" : "编辑"}
                onClick={async (e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
              >
                <PencilSquareIcon width="1.3em" height="1.3em" />
              </HeaderButtonWithToolTip>
              <HeaderButtonWithToolTip
                text={currentLanguage === "en" ? "Delete" : "删除"}
                onClick={async (e) => {
                  e.stopPropagation();
                  await dispatch(deleteSession(sessionMetadata.sessionId));
                }}
              >
                <TrashIcon width="1.3em" height="1.3em" />
              </HeaderButtonWithToolTip>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
