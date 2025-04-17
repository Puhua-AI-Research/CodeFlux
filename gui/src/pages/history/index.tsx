import { useNavigate } from "react-router-dom";
import { History } from "../../components/History";
import PageHeader from "../../components/PageHeader";
import { getFontSize } from "../../util";

export default function HistoryPage({
  currentLanguage = "en",
  handleTabChange = (tab: string) => {},
}) {
  const navigate = useNavigate();

  return (
    <div className=" no-scrollbar" style={{ fontSize: getFontSize() }}>
      <History currentLanguage={currentLanguage} handleTabChange={handleTabChange}/>
    </div>
  );
}
