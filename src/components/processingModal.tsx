import React, { useEffect, useMemo, useRef } from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { ProcessingState } from "../hooks/realm/useRealmProgressState";
import DynamicSVGText from "./dynamicSVGText";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";

interface ProcessingModalProps {
  processingState: ProcessingState;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ processingState }) => {
  const hasPreloaded = useRef(false);
  useEffect(() => {
    hasPreloaded.current = true;
  }, []);
  
  return useMemo(() => (
    <>
      {!hasPreloaded.current ? null : (
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          <DynamicSVGText text="計算中…" />
          <DynamicSVGTextSequence text="1234567890%" />
        </div>
      )}
      <Modal
        open={processingState.isBusy}
        center
        showCloseIcon={false}
        styles={{
          modal: { padding: "2em", textAlign: "center" },
          overlay: { background: "rgba(0, 0, 0, 0.5)" },
        }}
        onClose={() => {}}      
      >
        <h2><DynamicSVGText text="計算中…" /></h2>
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
        <p><DynamicSVGTextSequence text={`${processingState.percent}%`} /></p>
      </Modal>
    </>
  ), [processingState.isBusy, processingState.percent]);
};

export default ProcessingModal;