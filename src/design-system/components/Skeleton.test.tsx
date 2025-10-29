import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from './Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('bg-neutral-200');
  });

  it('applies text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.firstChild).toHaveClass('h-4', 'rounded');
  });

  it('applies circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('applies rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toHaveClass('rounded-lg');
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    const element = container.firstChild as HTMLElement;
    expect(element.style.width).toBe('100px');
    expect(element.style.height).toBe('50px');
  });

  it('applies pulse animation by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('has accessibility attributes', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Chargement...')).toBeInTheDocument();
  });
});

describe('SkeletonText', () => {
  it('renders correct number of lines', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons).toHaveLength(3);
  });

  it('renders default 3 lines when not specified', () => {
    const { container } = render(<SkeletonText />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons).toHaveLength(3);
  });
});

describe('SkeletonCard', () => {
  it('renders card skeleton structure', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.p-6')).toBeInTheDocument();
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
  });
});

describe('SkeletonTable', () => {
  it('renders table skeleton with default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('[role="status"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders custom number of rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />);
    const rows = container.querySelectorAll('.flex.gap-4');
    expect(rows).toHaveLength(4);
  });
});
