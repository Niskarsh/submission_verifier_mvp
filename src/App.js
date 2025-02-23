import React, { useState } from 'react';
import './App.css';
import { uiSkillsets, uxSkillsets, fundamentalSkillsets } from './constants';
import CollapsibleSection from './components/CollapsibleSection';
import ChatSection from './components/ChatSection';

function App() {
  // Step states
  const [figmaFile, setFigmaFile] = useState('');
  const [figmaCompleted, setFigmaCompleted] = useState(false);
  const [figmaCollapsed, setFigmaCollapsed] = useState(false);

  const [selectedSkillsets, setSelectedSkillsets] = useState([]);
  const [skillsetCompleted, setSkillsetCompleted] = useState(false);
  const [skillsetCollapsed, setSkillsetCollapsed] = useState(false);

  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  // Handlers for Figma Section
  const handleFigmaFileChange = (event) => {
    setFigmaFile(event.target.value);
  };

  const submitFigmaFile = () => {
    if (figmaFile.trim()) {
      setFigmaCompleted(true);
      // Auto collapse the Figma section once submitted
      setFigmaCollapsed(true);
    }
  };

  // Handlers for Skillset Section
  const toggleSkillset = (skill) => {
    if (selectedSkillsets.includes(skill)) {
      setSelectedSkillsets(selectedSkillsets.filter((s) => s !== skill));
    } else {
      setSelectedSkillsets([...selectedSkillsets, skill]);
    }
  };

  const submitSkillsets = () => {
    if (selectedSkillsets.length > 0) {
      setSkillsetCompleted(true);
      setSkillsetCollapsed(true);
      setChatUnlocked(true);
      // Optionally, you could auto-expand the chat section:
      setChatCollapsed(false);
    }
  };

  const renderSkillsetItem = (skill) => (
    <div key={skill} className="skillset-item" onClick={() => toggleSkillset(skill)}>
      <label>{skill}</label>
      {selectedSkillsets.includes(skill) && <span className="selected-indicator">✓</span>}
    </div>
  );
console.log('#######################################')
  return (
    <div className="App dark-theme">
      {/* Figma Section */}
      <CollapsibleSection
        title="Figma File"
        status={figmaCompleted ? "(Completed)" : "(In Progress)"}
        isCollapsed={figmaCollapsed}
        onToggle={() => setFigmaCollapsed(!figmaCollapsed)}
      >
        <input
          type="text"
          value={figmaFile}
          onChange={handleFigmaFileChange}
          placeholder="Enter Figma file URL..."
        />
        <button onClick={submitFigmaFile} disabled={!figmaFile.trim()}>
          Submit Figma File
        </button>
      </CollapsibleSection>

      {/* Skillset Selection Section */}
      <CollapsibleSection
        title="Skillset Selection"
        status={skillsetCompleted ? "(Completed)" : (figmaCompleted ? "(In Progress)" : "(Locked)")}
        isCollapsed={skillsetCollapsed || !figmaCompleted}
        onToggle={() => {
          if (figmaCompleted) setSkillsetCollapsed(!skillsetCollapsed);
        }}
      >
        <div>
          <strong>Added File:</strong> {figmaFile}
        </div>
        <h2>Select Skillsets to Test</h2>
        <div className="skillsets-wrapper">
          <div className="skillset-group">
            <h3>Fundamental Skillsets</h3>
            <div className="skillset-container">
              {fundamentalSkillsets.map(renderSkillsetItem)}
            </div>
          </div>
          <div className="skillset-group">
            <h3>UI Skillsets</h3>
            <div className="skillset-container">
              {uiSkillsets.map(renderSkillsetItem)}
            </div>
          </div>
        </div>
        <div className="skillset-group">
          <h3>UX Skillsets</h3>
          <div className="skillset-container">
            {uxSkillsets.map(renderSkillsetItem)}
          </div>
        </div>
        <button onClick={submitSkillsets} disabled={selectedSkillsets.length === 0}>
          Submit Skillsets ({selectedSkillsets.length})
        </button>
      </CollapsibleSection>

      {/* Chat Section */}
      <CollapsibleSection
        title="Chat Section"
        status={chatUnlocked ? "(Active)" : "(Locked)"}
        isCollapsed={chatCollapsed || !chatUnlocked}
        onToggle={() => {
          if (chatUnlocked) setChatCollapsed(!chatCollapsed);
        }}
      >
        <ChatSection figmaFile={figmaFile} selectedSkillsets={selectedSkillsets} />
      </CollapsibleSection>
    </div>
  );
}

export default App;
