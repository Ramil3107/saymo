import { CircleAlert } from "lucide-react";
import { type InputHTMLAttributes, useId } from "react";

type TextFieldProps = { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, error, id, className = "", ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-8">
      <label htmlFor={inputId} className="text-label text-muted">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-[52px] rounded-input border border-line-input bg-stage px-[18px] text-body text-white placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`.trim()}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="flex items-center gap-8 text-label font-normal text-white">
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
