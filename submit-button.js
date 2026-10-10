'use client';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, pendingText = 'Saving…', className = 'btn btn-primary' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
