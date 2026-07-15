import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { useFocusTrap } from './useFocusTrap';

function TrapHarness({ isActive }: { isActive: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(isActive);
  return (
    <div>
      <button type="button">outside before</button>
      {isActive ? (
        <div ref={ref}>
          <button type="button">first</button>
          <button type="button">last</button>
        </div>
      ) : null}
      <button type="button">outside after</button>
    </div>
  );
}

function ToggleHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        trigger
      </button>
      <TrapHarness isActive={open} />
      {open ? (
        <button type="button" onClick={() => setOpen(false)}>
          close
        </button>
      ) : null}
    </div>
  );
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', () => {
    render(<TrapHarness isActive />);
    expect(screen.getByText('first')).toHaveFocus();
  });

  it('does not steal focus when inactive', () => {
    render(<TrapHarness isActive={false} />);
    expect(document.body).toHaveFocus();
  });

  it('wraps Tab from the last element back to the first', () => {
    render(<TrapHarness isActive />);
    const last = screen.getByText('last');
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(screen.getByText('first')).toHaveFocus();
  });

  it('wraps Shift+Tab from the first element back to the last', () => {
    render(<TrapHarness isActive />);
    const first = screen.getByText('first');
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('last')).toHaveFocus();
  });

  it('restores focus to the previously focused element on deactivate', () => {
    render(<ToggleHarness />);
    const trigger = screen.getByText('trigger');
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByText('first')).toHaveFocus();

    fireEvent.click(screen.getByText('close'));
    expect(trigger).toHaveFocus();
  });
});
