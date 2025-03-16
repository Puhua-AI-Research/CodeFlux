import { useDispatch } from "react-redux";
import AddModelForm from "../../../forms/AddModelForm";
import { setDialogMessage, setShowDialog } from "../../../redux/slices/uiSlice";
import Alert from "../../gui/Alert";
import { useSubmitOnboarding } from "../hooks";

function ProviderAlert() {
  const dispatch = useDispatch();
  const { submitOnboarding } = useSubmitOnboarding("Custom");

  function onClick() {
    dispatch(setShowDialog(true));
    dispatch(setDialogMessage(<AddModelForm onDone={submitOnboarding} />));
  }

  return (
    <div className="w-full">
      <Alert type="info">
        <p className="m-0 text-sm font-semibold">
          当前模型均为开源大模型
        </p>
        <p className="m-0 mt-1 text-xs">

        </p>
      </Alert>
    </div>
  );
}

export default ProviderAlert;
