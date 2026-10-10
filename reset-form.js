'use client';
import { useRef } from 'react';

// A form that clears itself after its server action finishes.
export default function ResetForm({ action, children, className }) {
  const ref = useRef(null);
  return (
    <form
      ref={ref}
      className={className}
      action={async (formData) => {
        await action(formData);
        ref.current?.reset();
      }}
    >
      {children}
    </form>
  );
}
