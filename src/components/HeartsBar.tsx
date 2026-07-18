interface HeartsBarProps {
  hearts: number;
  maxHearts: number;
}

/** Row of hearts; filled up to `hearts`, hollow for the rest. */
export default function HeartsBar({ hearts, maxHearts }: HeartsBarProps) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${hearts} of ${maxHearts} hearts remaining`}
    >
      {Array.from({ length: maxHearts }).map((_, i) => (
        <span
          key={i}
          className={`text-xl leading-none ${
            i < hearts ? 'opacity-100' : 'opacity-25 grayscale'
          }`}
          aria-hidden="true"
        >
          {i < hearts ? '❤️' : '🤍'}
        </span>
      ))}
    </div>
  );
}
