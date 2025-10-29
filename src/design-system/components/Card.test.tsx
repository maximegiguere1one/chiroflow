import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'border', 'border-neutral-200');
  });

  it('applies outlined variant styling', () => {
    const { container } = render(<Card variant="outlined">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-transparent', 'border-2', 'border-neutral-300');
  });

  it('applies elevated variant styling', () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'shadow-lg', 'border-neutral-100');
  });

  it('applies correct padding', () => {
    const { container: containerNone } = render(<Card padding="none">Content</Card>);
    const { container: containerSm } = render(<Card padding="sm">Content</Card>);
    const { container: containerMd } = render(<Card padding="md">Content</Card>);
    const { container: containerLg } = render(<Card padding="lg">Content</Card>);

    expect(containerNone.firstChild).not.toHaveClass('p-3', 'p-6', 'p-8');
    expect(containerSm.firstChild).toHaveClass('p-3');
    expect(containerMd.firstChild).toHaveClass('p-6');
    expect(containerLg.firstChild).toHaveClass('p-8');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard interactions', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hover:shadow-md', 'cursor-pointer');
  });
});

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders title correctly', () => {
    render(<CardTitle>Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
  });
});

describe('CardDescription', () => {
  it('renders description correctly', () => {
    render(<CardDescription>Card description</CardDescription>);
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders content correctly', () => {
    render(<CardContent>Card body content</CardContent>);
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders footer correctly', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
