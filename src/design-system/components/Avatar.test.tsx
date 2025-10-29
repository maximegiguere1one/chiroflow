import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarGroup } from './Avatar';

describe('Avatar', () => {
  it('renders image avatar', () => {
    render(<Avatar src="/photo.jpg" alt="User" />);
    const img = screen.getByAltText('User');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/photo.jpg');
  });

  it('renders initials from name', () => {
    render(<Avatar name="Jean Dupont" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="Jean" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders fallback icon when no src or name', () => {
    const { container } = render(<Avatar />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container: containerSm } = render(<Avatar size="sm" name="User" />);
    const { container: containerLg } = render(<Avatar size="lg" name="User" />);

    expect(containerSm.firstChild).toHaveClass('w-8', 'h-8');
    expect(containerLg.firstChild).toHaveClass('w-12', 'h-12');
  });
});

describe('AvatarGroup', () => {
  it('renders all avatars when count is below max', () => {
    render(
      <AvatarGroup max={5}>
        <Avatar name="User 1" />
        <Avatar name="User 2" />
        <Avatar name="User 3" />
      </AvatarGroup>
    );

    expect(screen.getByText('U1')).toBeInTheDocument();
    expect(screen.getByText('U2')).toBeInTheDocument();
    expect(screen.getByText('U3')).toBeInTheDocument();
  });

  it('shows +N indicator when exceeding max', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="User 1" />
        <Avatar name="User 2" />
        <Avatar name="User 3" />
        <Avatar name="User 4" />
      </AvatarGroup>
    );

    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
