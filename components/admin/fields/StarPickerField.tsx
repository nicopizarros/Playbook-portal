'use client';

type StarPickerFieldProps = {
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
};

export function StarPickerField({ label, help, value, onChange }: StarPickerFieldProps) {
  const current = Number(value) || 0;
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {help && <span className="field-help">{help}</span>}
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`star-btn${n <= current ? ' is-filled' : ''}`}
            aria-label={`${n} de 5 estrellas`}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
