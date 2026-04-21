import React from "react";

interface DiffTextProps {
  oldText?: string;
  newText?: string;
  className?: string;
}

export const DiffText: React.FC<DiffTextProps> = ({ oldText = "", newText = "", className = "" }) => {
  if (oldText === newText) return <span className={className}>{newText}</span>;
  if (!oldText) return <span className={`${className} bg-green-100 text-green-800 px-1 rounded`}>{newText}</span>;

  // Very basic word-level diff visualization
  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);
  
  // This is a naive implementation for visual feedback
  // In a production app, we'd use a library like 'diff' or 'diff-match-patch'
  return (
    <span className={className}>
      {newWords.map((word, i) => {
        const isNew = !oldWords.includes(word);
        return (
          <span key={i} className={isNew ? "bg-green-100 text-green-800 px-0.5 rounded font-medium" : ""}>
            {word}{" "}
          </span>
        );
      })}
    </span>
  );
};
