import ContinueLogo from "../../gui/ContinueLogo";
import QuickStartSubmitButton from "../components/QuickStartSubmitButton";

interface OnboardingQuickstartTabProps {
  isDialog?: boolean;
}

function OnboardingQuickstartTab({ isDialog }: OnboardingQuickstartTabProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="xs:px-0 flex w-full max-w-full flex-col items-center justify-center px-4 text-center">
        <div className="xs:flex hidden">
          {/* <ContinueLogo height={75} /> */}
        </div>

        <p className="xs:w-3/4 w-full text-sm">
          使用前请仔细甄别AI 生成的内容，以免污染你的代码
        </p>

      </div>
    </div>
  );
}

export default OnboardingQuickstartTab;
