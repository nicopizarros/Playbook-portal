'use client';

import { createContext, forwardRef, useContext, useImperativeHandle, useRef } from 'react';

// Legacy's dashboard.js validates every url input right before a save by
// querying the DOM directly (querySelectorAll('input[type="url"]')). This
// context is the React-appropriate equivalent: each TextField with url
// validation registers a validate()+focus() pair here instead of the parent
// needing to know about every field in every tab. AdminDashboard holds a
// ref to the provider and calls runValidation() once before saving — same
// "block save, focus the first bad field" UX as legacy, without DOM queries
// or a window global.
type Validator = () => boolean;
type Registration = { validate: Validator; focus: () => void };

const FormValidationContext = createContext<((entry: Registration) => () => void) | null>(null);

export type FormValidationHandle = { runValidation: () => boolean };

export const FormValidationProvider = forwardRef<FormValidationHandle, { children: React.ReactNode }>(
  function FormValidationProvider({ children }, ref) {
    const registrations = useRef<Registration[]>([]);

    const register = (entry: Registration) => {
      registrations.current.push(entry);
      return () => {
        registrations.current = registrations.current.filter(e => e !== entry);
      };
    };

    useImperativeHandle(ref, () => ({
      runValidation: () => {
        let firstInvalidFocus: (() => void) | null = null;
        for (const entry of registrations.current) {
          const ok = entry.validate();
          if (!ok && !firstInvalidFocus) firstInvalidFocus = entry.focus;
        }
        if (firstInvalidFocus) firstInvalidFocus();
        return !firstInvalidFocus;
      },
    }));

    return <FormValidationContext.Provider value={register}>{children}</FormValidationContext.Provider>;
  },
);

// Fields call this with their own validate()/focus() pair. Returns nothing —
// registration/cleanup happens via a plain effect in the caller.
export function useFormValidationRegistrar() {
  return useContext(FormValidationContext);
}
