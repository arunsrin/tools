import type { KeyboardEvent } from 'react';
import type { SegmentedControlProps } from './types';
import './SegmentedControl.css';

export default function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  mode = 'group',
  className = '',
}: SegmentedControlProps<T>) {
  const isTablist = mode === 'tablist';

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isTablist || options.length === 0) {
      return;
    }

    let step = 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      step = 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      step = -1;
    } else if (event.key === 'Home') {
      const firstEnabled = options.find((opt) => !opt.disabled);
      if (firstEnabled) {
        event.preventDefault();
        onChange(firstEnabled.value);
      }
      return;
    } else if (event.key === 'End') {
      const lastEnabled = [...options].reverse().find((opt) => !opt.disabled);
      if (lastEnabled) {
        event.preventDefault();
        onChange(lastEnabled.value);
      }
      return;
    } else {
      return;
    }

    event.preventDefault();
    for (let offset = 1; offset <= options.length; offset++) {
      const nextIdx = (index + step * offset + options.length) % options.length;
      const candidate = options[nextIdx];
      if (candidate && !candidate.disabled) {
        onChange(candidate.value);
        break;
      }
    }
  };

  return (
    <div
      role={isTablist ? 'tablist' : 'group'}
      aria-label={ariaLabel}
      className={`shared-segmented-control ${className}`.trim()}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const sharedProps = isTablist
          ? { role: 'tab' as const, 'aria-selected': isSelected }
          : { 'aria-pressed': isSelected };

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-label={option.ariaLabel}
            className={`shared-segmented-btn ${isSelected ? 'is-selected' : ''}`.trim()}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            {...sharedProps}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
