import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

const mockOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3', disabled: true },
];

describe('Dropdown', () => {
  it('renders with placeholder when no value is selected', () => {
    render(
      <Dropdown
        options={mockOptions}
        onChange={vi.fn()}
        placeholder="Select an option"
      />
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders with selected value', () => {
    render(
      <Dropdown
        options={mockOptions}
        value="1"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        options={mockOptions}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('calls onChange when option is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Dropdown
        options={mockOptions}
        onChange={handleChange}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    const option = screen.getByText('Option 2');
    await user.click(option);

    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('does not call onChange for disabled option', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Dropdown
        options={mockOptions}
        onChange={handleChange}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    const disabledOption = screen.getByText('Option 3');
    await user.click(disabledOption);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders label when provided', () => {
    render(
      <Dropdown
        options={mockOptions}
        onChange={vi.fn()}
        label="Choose option"
      />
    );

    expect(screen.getByText('Choose option')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <Dropdown
        options={mockOptions}
        onChange={vi.fn()}
        error="Selection required"
      />
    );

    expect(screen.getByText('Selection required')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Dropdown
        options={mockOptions}
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Dropdown
        options={mockOptions}
        onChange={handleChange}
      />
    );

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
