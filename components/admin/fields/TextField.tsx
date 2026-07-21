'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormValidationRegistrar } from './FormValidationContext';

// Same rule as legacy/admin/dashboard.js's isValidUrlValue: empty is always
// "valid" here (required-ness is a separate check), a real URL must start
// with a real scheme, an in-page anchor, or a site-relative path.
function isValidUrlValue(value: string) {
  const v = (value ?? '').trim();
  if (v === '') return true;
  return /^(https?:|mailto:|tel:)/i.test(v) || v.startsWith('#') || v.startsWith('/');
}

type TextFieldProps = {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'url';
  required?: boolean | (() => boolean);
};

export function TextField({ label, help, value, onChange, multiline, type = 'text', required }: TextFieldProps) {
  const isUrl = type === 'url';
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const registrar = useFormValidationRegistrar();

  const isRequired = () => (typeof required === 'function' ? required() : !!required);
  const computeOk = (v: string) => {
    const empty = v.trim() === '';
    return (isRequired() ? !empty : true) && isValidUrlValue(v);
  };

  useEffect(() => {
    if (!isUrl || !registrar) return undefined;
    return registrar({
      validate: () => {
        setTouched(true);
        return computeOk(value);
      },
      focus: () => inputRef.current?.focus(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUrl, registrar, value]);

  const ok = isUrl ? computeOk(value) : true;
  const invalid = touched && !ok;

  const shared = {
    className: `input${invalid ? ' is-invalid' : ''}`,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onBlur: () => setTouched(true),
  };

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {help && <span className="field-help">{help}</span>}
      {multiline ? (
        <textarea ref={inputRef} {...shared} />
      ) : (
        <input ref={inputRef} type="text" {...shared} />
      )}
      {isUrl && (
        <span className="field-error" hidden={!invalid}>
          {isRequired()
            ? 'Este enlace es obligatorio y debe empezar con https://'
            : 'El enlace debe empezar con https:// (o déjalo vacío)'}
        </span>
      )}
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
};

// Legacy keeps opts.numeric inputs as type="text" (min/step are set but
// inert on a text input) — matched here for behavioral parity, not just
// swapped for a native <input type="number"> which would change the
// editing UX (spinner, browser numeric validation quirks).
export function NumberField({ label, help, value, onChange, min = 1, step = 1 }: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {help && <span className="field-help">{help}</span>}
      <input
        type="text"
        inputMode="numeric"
        className="input"
        value={value === undefined || value === null ? '' : String(value)}
        min={min}
        step={step}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </label>
  );
}
