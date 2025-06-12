import "react-responsive-modal/styles.css";

import React, { useEffect, useMemo, useRef } from "react";

import { Modal } from "react-responsive-modal";

import DynamicSVGText from "@shared/ui/DynamicSVGText";
import DynamicSVGTextSequence from "@shared/ui/DynamicSVGTextSequence";

import { useProcessingContext } from "../context/ProcessingContext";


const ProcessingModal: React.FC = () => {
  const { isBusy, percent } = useProcessingContext();
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
        open={isBusy}
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
              width: `${percent}%`,
              height: "1em",
              background: "#4caf50",
              transition: "width 0.2s ease",
            }}
          />
        </div>
        <p><DynamicSVGTextSequence text={`${percent}%`} /></p>
      </Modal>
    </>
  ), [isBusy, percent]);
};

export default ProcessingModal;