import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalTitle, ConfirmModal } from './Modal';

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} showCloseButton={true}>
        <div>Modal content</div>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Fermer');
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument();
  });

  it('applies correct size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        <div>Modal content</div>
      </Modal>
    );

    const modalContent = container.querySelector('.max-w-2xl');
    expect(modalContent).toBeInTheDocument();
  });
});

describe('ModalHeader', () => {
  it('renders header content correctly', () => {
    render(<ModalHeader>Header content</ModalHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('ModalTitle', () => {
  it('renders title correctly', () => {
    render(<ModalTitle>Modal Title</ModalTitle>);
    const title = screen.getByText('Modal Title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H2');
  });
});

describe('ConfirmModal', () => {
  it('renders with title and description', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Action"
        description="Are you sure?"
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Confirm"
        confirmText="Yes"
      />
    );

    const confirmButton = screen.getByText('Yes');
    await user.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Confirm"
        cancelText="No"
      />
    );

    const cancelButton = screen.getByText('No');
    await user.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isLoading is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        isLoading={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
