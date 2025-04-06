import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { TableCellsIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { table } from "table";
import { lightGray } from "../components";
import { CopyIconButton } from "../components/gui/CopyIconButton";
import { IdeMessengerContext } from "../context/IdeMessenger";
import { useNavigationListener } from "../hooks/useNavigationListener";
import PageHeader from "../components/PageHeader";

const Th = styled.th`
  padding: 0.5rem;
  text-align: left;
  border: 1px solid ${lightGray};
`;

const Tr = styled.tr`
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  overflow-wrap: anywhere;
  border: 1px solid ${lightGray};
`;

const Td = styled.td`
  padding: 0.5rem;
  border: 1px solid ${lightGray};
`;

function generateTable(data: unknown[][]) {
  return table(data);
}

function Stats() {
  useNavigationListener();
  const navigate = useNavigate();
  const ideMessenger = useContext(IdeMessengerContext);

  const [days, setDays] = useState<
    { day: string; promptTokens: number; generatedTokens: number }[]
  >([]);
  const [models, setModels] = useState<
    { model: string; promptTokens: number; generatedTokens: number }[]
  >([]);

  useEffect(() => {
    ideMessenger.request("stats/getTokensPerDay", undefined).then((result) => {
      result.status === "success" && setDays(result.content);
    });
  }, []);

  useEffect(() => {
    ideMessenger
      .request("stats/getTokensPerModel", undefined)
      .then((result) => {
        result.status === "success" && setModels(result.content);
      });
  }, []);

  return (
    <div className="overflow-y-scroll bg-gradient-to-b from-[#1a1a1a] to-[#141414]">

      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <div className="font-medium mb-4 text-base flex items-center gap-2 text-[#FFD700]">
              <TableCellsIcon className="h-5 w-5" />
              <span className="transition-colors duration-300">Tokens per Day</span>
              <CopyIconButton
                text={generateTable(
                  ([["Day", "Generated Tokens", "Prompt Tokens"]] as any).concat(
                    days.map((day) => [
                      day.day,
                      day.generatedTokens,
                      day.promptTokens,
                    ]),
                  ),
                )}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <Tr>
                    <Th className="text-gray-300">Day</Th>
                    <Th className="text-gray-300">Generated Tokens</Th>
                    <Th className="text-gray-300">Prompt Tokens</Th>
                  </Tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <Tr key={day.day} className="hover:bg-[#FFD700]/5 transition-colors duration-300">
                      <Td className="text-gray-300">{day.day}</Td>
                      <Td className="text-gray-300">{day.generatedTokens.toLocaleString()}</Td>
                      <Td className="text-gray-300">{day.promptTokens.toLocaleString()}</Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <div className="font-medium mb-4 text-base flex items-center gap-2 text-[#FFD700]">
              <TableCellsIcon className="h-5 w-5" />
              <span className="transition-colors duration-300">Tokens per Model</span>
              <CopyIconButton
                text={generateTable(
                  ([["Model", "Generated Tokens", "Prompt Tokens"]] as any).concat(
                    models.map((model) => [
                      model.model,
                      model.generatedTokens.toLocaleString(),
                      model.promptTokens.toLocaleString(),
                    ]),
                  ),
                )}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <Tr>
                    <Th className="text-gray-300">Model</Th>
                    <Th className="text-gray-300">Generated Tokens</Th>
                    <Th className="text-gray-300">Prompt Tokens</Th>
                  </Tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <Tr key={model.model} className="hover:bg-[#FFD700]/5 transition-colors duration-300">
                      <Td className="text-gray-300">{model.model}</Td>
                      <Td className="text-gray-300">{model.generatedTokens.toLocaleString()}</Td>
                      <Td className="text-gray-300">{model.promptTokens.toLocaleString()}</Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;
