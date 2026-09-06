interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function Toggle({ checked, onChange, label, description, disabled, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-stone-800'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink dark:text-stone-100">{label}</span>
        {description && (
          <span className="block text-xs text-muted dark:text-stone-400 mt-0.5">{description}</span>
        )}
      </span>
      <span
        className={`relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-stone-300 dark:bg-stone-700'
        }`}
        aria-hidden="true"
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          } mt-0.5`}
        />
      </span>
    </button>
  );
}