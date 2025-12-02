"use client";

import { useEffect } from "react";
import PropTypes from "prop-types";

export default function GrammarToast({ text, onClose, style }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="grammar-toast-container" style={style}>
      <div className="grammar-toast">
        <div className="grammar-toast-content">
          <h1>{text}</h1>
        </div>
      </div>
    </div>
  );
}

GrammarToast.propTypes = {
  text: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  style: PropTypes.object,
};
