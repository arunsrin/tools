import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

function ModalHarness({ onCloseSpy }: { onCloseSpy?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open Dialog
      </button>
      <Modal
        isOpen={open}
        onClose={() => {
          onCloseSpy?.();
          setOpen(false);
        }}
        title="Dialog Title"
      >
        <p>Dialog content</p>
      </Modal>
    </div>
  );
}

describe('Modal', () => {
  it('renders nothing when closed and renders accessible dialog when open', () => {
    render(<ModalHarness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const heading = screen.getByRole('heading', { level: 2, name: 'Dialog Title' });
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('closes on Escape, close button, and backdrop click, and restores focus to trigger', () => {
    const onCloseSpy = vi.fn();
    render(<ModalHarness onCloseSpy={onCloseSpy} />);

    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onCloseSpy).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    const backdrop = document.querySelector('.shared-modal-backdrop') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCloseSpy).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when clicking inside the dialog surface', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Stay Open">
        <p>Inner text</p>
      </Modal>
    );

    fireEvent.click(screen.getByText('Inner text'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
