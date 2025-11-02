interface RadioOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  selected: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3 | 4;
  required?: boolean;
}

export function RadioGroup({
  label,
  options,
  selected,
  onChange,
  columns = 2,
  required = false
}: RadioGroupProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'border-blue-500'
                    : 'border-neutral-300'
                }`}
              >
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900">{option.label}</div>
                {option.sublabel && (
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {option.sublabel}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
