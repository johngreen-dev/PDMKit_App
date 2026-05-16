import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ConnectionBar } from "./components/connection/ConnectionBar";
import { Sidebar, type Section } from "./components/sidebar/Sidebar";
import { PinsPanel } from "./components/pins/PinsPanel";
import { GroupsPanel } from "./components/groups/GroupsPanel";
import { VariablesPanel } from "./components/variables/VariablesPanel";
import { RulesPanel } from "./components/rules/RulesPanel";
import { LogicCanvas } from "./components/canvas/LogicCanvas";
import { MonitorPanel } from "./components/monitor/MonitorPanel";

function App() {
  const [section, setSection] = useState<Section>("pins");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ConnectionBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={section} onChange={setSection} />
        <main className="flex-1 overflow-hidden">
          {section === "pins"      && <PinsPanel />}
          {section === "groups"    && <GroupsPanel />}
          {section === "variables" && <VariablesPanel />}
          {section === "rules"     && <RulesPanel />}
          {section === "canvas" && (
            <ReactFlowProvider>
              <LogicCanvas />
            </ReactFlowProvider>
          )}
          {section === "monitor"   && <MonitorPanel />}
        </main>
      </div>
    </div>
  );
}

export default App;
