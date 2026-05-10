import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function PasswordInput({
  id,
  className = '',
  inputClassName = '',
  leadingIcon = null,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <div
      className={`password-input-control ${leadingIcon ? 'has-leading-icon' : ''} ${className}`.trim()}
    >
      {leadingIcon && (
        <span className="password-leading-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        {...props}
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={inputClassName}
      />
      <button
        type="button"
        className="password-toggle-button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <ToggleIcon size={17} />
      </button>
    </div>
  );
}

export default PasswordInput;
