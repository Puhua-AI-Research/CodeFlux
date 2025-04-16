import React from "react";

type ToggleSwitchProps = {
  isToggled: boolean;
  onToggle: () => void;
  text: string;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isToggled,
  onToggle,
  text,
}) => {
  return (
    <div className="flex cursor-pointer select-none items-center justify-between gap-3">
      <span className="truncate-right text-right">{text}</span>
      <div>
        <div
          className={`flex h-5 w-10 items-center rounded-full border border-solid p-0.5 transition-all ${
            isToggled ? "bg-[rgb(255,202,7)] border-[rgb(255,202,7)]" : "bg-gray-500 border-gray-600"
          }`}
          onClick={onToggle}
        >
          <div
            className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-all ${
              isToggled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default ToggleSwitch;
