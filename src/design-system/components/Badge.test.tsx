import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    const { container } = render(<Badge>Badge</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-neutral-100', 'text-neutral-700');
  });

  it('applies primary variant styling', () => {
    const { container } = render(<Badge variant="primary">Badge</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-primary-50', 'text-primary-700');
  });

  it('applies success variant styling', () => {
    const { container } = render(<Badge variant="success">Badge</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('applies correct size', () => {
    const { container: containerSm } = render(<Badge size="sm">Badge</Badge>);
    const { container: containerMd } = render(<Badge size="md">Badge</Badge>);
    const { container: containerLg } = render(<Badge size="lg">Badge</Badge>);

    expect(containerSm.firstChild).toHaveClass('text-xs', 'px-2');
    expect(containerMd.firstChild).toHaveClass('text-sm', 'px-2.5');
    expect(containerLg.firstChild).toHaveClass('text-base', 'px-3');
  });

  it('renders with dot indicator', () => {
    const { container } = render(<Badge dot>Badge</Badge>);
    const dot = container.querySelector('span span');
    expect(dot).toHaveClass('rounded-full', 'bg-neutral-500');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
