import { Check } from 'lucide-react';

interface SimpleCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  sublabel?: string;
  required?: boolean;
}

export function SimpleCheckbox({
  label,
  checked,
  onChange,
  sublabel,
  required = false
}: SimpleCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left w-full ${
        checked
          ? 'border-blue-500 bg-blue-50'
          : 'border-neutral-200 hover:border-neutral-300 bg-white'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          checked
            ? 'border-blue-500 bg-blue-500'
            : 'border-neutral-300 bg-white'
        }`}
      >
        {checked && <Check className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-neutral-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
        {sublabel && (
          <div className="text-xs text-neutral-500 mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}
