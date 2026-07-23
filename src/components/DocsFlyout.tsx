import { useEffect } from 'react';
import type { DocLink } from '../content/docs';

interface Props {
  links: DocLink[];
  onClose: () => void;
}

/**
 * Slide-in panel listing ServiceNow reference links for the current question.
 * Links open in a new tab so the lesson isn't lost.
 */
export default function DocsFlyout({ links, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="animate-pop-in flex h-full w-full max-w-sm flex-col border-l border-slate-700 bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Reference links"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <span aria-hidden="true">📚</span> Reference
          </h2>
          <button
            onClick={onClose}
            aria-label="Close reference"
            className="text-2xl leading-none text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          ServiceNow documentation for this topic — opens in a new tab.
        </p>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl bg-slate-800/70 p-3 ring-1 ring-slate-700 transition hover:bg-slate-800 hover:ring-glide-500"
            >
              <span className="mt-0.5 text-glide-400" aria-hidden="true">
                🔗
              </span>
              <span className="flex-1 text-sm font-medium text-slate-200 group-hover:text-slate-50">
                {link.title}
              </span>
              <span
                className="text-slate-500 group-hover:text-glide-300"
                aria-hidden="true"
              >
                ↗
              </span>
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}
