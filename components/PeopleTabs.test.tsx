import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PeopleTabs } from './PeopleTabs';
import type { PeopleGroup } from '../content/types';

const groups: PeopleGroup[] = [
  { id: 'g0', label: '헤더진', sortOrder: 0, members: [] },
  { id: 'g1', label: '스탭진', sortOrder: 1, members: [] },
  { id: 'g2', label: '배우', sortOrder: 2, members: [] },
];

describe('PeopleTabs', () => {
  it('renders the three tabs from the design', () => {
    render(<PeopleTabs groups={groups} activeLabel="헤더진" />);
    for (const label of ['헤더진', '스탭진', '배우']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('marks only the active tab', () => {
    render(<PeopleTabs groups={groups} activeLabel="스탭진" />);
    expect(screen.getByRole('link', { name: '스탭진' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '배우' })).not.toHaveAttribute('aria-current');
  });

  it('encodes the label into the tab query so the URL is shareable', () => {
    render(<PeopleTabs groups={groups} activeLabel="헤더진" />);
    expect(screen.getByRole('link', { name: '배우' })).toHaveAttribute(
      'href',
      `/people?tab=${encodeURIComponent('배우')}`,
    );
  });
});
