import React from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { ProcessingState } from "../hooks/useRealmProgressState";

interface ProcessingModalProps {
  processingState: ProcessingState;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ processingState }) => {

  return (
    <Modal
      open={processingState.isBusy}
      center
      showCloseIcon={false}
      styles={{
        modal: { padding: "2em", textAlign: "center" },
        overlay: { background: "rgba(0,0,0,0.5)" },
      }}
      onClose={() => {}}      
    >
      <h2>計算中…</h2>
      <div style={{ width: "100%", background: "#eee", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${processingState.percent}%`,
            height: "1em",
            background: "#4caf50",
            transition: "width 0.2s ease",
          }}
        />
      </div>
      <p>{processingState.percent}%</p>
    </Modal>
  );
};

export default ProcessingModal;