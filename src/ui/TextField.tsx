import { CircleAlert } from "lucide-react";
import { type InputHTMLAttributes, useId } from "react";

const ERROR_ICON_SIZE = 16;

type TextFieldProps = { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>;

export function TextField({
  label,
  error,
  id,
  className = "",
  "aria-describedby": describedBy,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const describedByIds = [describedBy, error ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-8">
      <label htmlFor={inputId} className="text-label text-muted">
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds || undefined}
        className={`h-[52px] rounded-input border border-line-input bg-stage px-[18px] text-body text-white placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`.trim()}
      />
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-8 text-label font-normal text-white">
          <CircleAlert size={ERROR_ICON_SIZE} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
