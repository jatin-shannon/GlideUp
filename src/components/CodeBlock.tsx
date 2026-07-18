import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

interface CodeBlockProps {
  code: string;
  /** Render inline (no <pre>) for short snippets. */
  className?: string;
}

/**
 * Prism-highlighted JavaScript. Highlighting runs on the DOM node after
 * render so it works fully offline (grammar is bundled, not fetched).
 */
export default function CodeBlock({ code, className = '' }: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current);
    }
  }, [code]);

  return (
    <pre
      className={`overflow-x-auto rounded-lg bg-slate-950/70 p-4 ring-1 ring-slate-800 ${className}`}
    >
      <code ref={ref} className="language-javascript">
        {code}
      </code>
    </pre>
  );
}
