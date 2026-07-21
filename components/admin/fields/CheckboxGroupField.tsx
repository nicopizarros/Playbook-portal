'use client';

type CheckboxGroupFieldProps = {
  label: string;
  help?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly string[];
};

// One checkbox per fixed option, toggling membership in `value` — same
// approach as legacy/admin/dashboard.js's checkboxGroupField for the three
// tag-taxonomy tiers (deliberately not a <select multiple>).
export function CheckboxGroupField({ label, help, value, onChange, options }: CheckboxGroupFieldProps) {
  const list = value || [];

  function toggle(option: string, checked: boolean) {
    if (checked) {
      if (!list.includes(option)) onChange([...list, option]);
    } else {
      onChange(list.filter(v => v !== option));
    }
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {help && <span className="field-help">{help}</span>}
      <div className="checkbox-group">
        {options.map(option => (
          <label className="checkbox-option" key={option}>
            <input
              type="checkbox"
              checked={list.includes(option)}
              onChange={e => toggle(option, e.target.checked)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
