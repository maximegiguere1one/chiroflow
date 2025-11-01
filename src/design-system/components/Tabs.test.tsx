import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

describe('Tabs', () => {
  const TestTabs = ({ onValueChange }: { onValueChange?: (value: string) => void }) => (
    <Tabs defaultValue="tab1" onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" disabled>
          Tab 3
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );

  it('renders tabs with default value', () => {
    render(<TestTabs />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    const tab2 = screen.getByText('Tab 2');
    await user.click(tab2);

    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('calls onValueChange when tab changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TestTabs onValueChange={handleChange} />);

    const tab2 = screen.getByText('Tab 2');
    await user.click(tab2);

    expect(handleChange).toHaveBeenCalledWith('tab2');
  });

  it('does not switch to disabled tab', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    const tab3 = screen.getByText('Tab 3');
    await user.click(tab3);

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(<TestTabs />);
    const tab1Button = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1Button).toHaveAttribute('aria-selected', 'true');
  });
});
