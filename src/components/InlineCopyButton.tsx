'use client';

import { CopyButton } from './ui/copy-button';

interface InlineCopyButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

export function InlineCopyButton({ text, onCopy, className = '' }: InlineCopyButtonProps) {
  const handleCopy = () => {
    onCopy?.();
  };

  return (
    <CopyButton
      text={text}
      onCopy={handleCopy}
      size="sm"
      variant="ghost"
      className={`text-xs text-gray-500 hover:text-gray-700 p-1 h-auto ${className}`}
    >
      Copy ID
    </CopyButton>
  );
}
