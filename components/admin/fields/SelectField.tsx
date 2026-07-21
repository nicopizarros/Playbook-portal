'use client';

type Option = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
};

export function SelectField({ label, help, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {help && <span className="field-help">{help}</span>}
      <select className="input input-select" value={value || options[0]?.value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
