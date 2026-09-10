import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PeopleGrid } from './PeopleGrid';
import type { PeopleMember } from '../content/types';

const member = (over: Partial<PeopleMember> = {}): PeopleMember => ({
  id: 'g0m0',
  role: '연출',
  team: '',
  name: '정은수',
  tagline: '',
  bio: '',
  photoUrl: null,
  sortOrder: 0,
  ...over,
});

describe('PeopleGrid', () => {
  it('links each card to the person page (Figma comment #37)', () => {
    render(<PeopleGrid members={[member()]} />);
    expect(screen.getByRole('link', { name: /정은수/ })).toHaveAttribute('href', '/people/g0m0');
  });

  it('shows role for 헤더진 and team for 스탭진', () => {
    render(
      <PeopleGrid
        members={[member(), member({ id: 'g1m0', role: '', team: '기획팀', name: '김은성' })]}
      />,
    );
    expect(screen.getByText('연출')).toBeInTheDocument();
    expect(screen.getByText('기획팀')).toBeInTheDocument();
  });

  it('falls back to a placeholder when there is no photo', () => {
    render(<PeopleGrid members={[member()]} />);
    expect(screen.getByText('사진')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the photo with the name as alt text', () => {
    render(<PeopleGrid members={[member({ photoUrl: 'https://example.test/a.jpg' })]} />);
    expect(screen.getByRole('img', { name: '정은수' })).toBeInTheDocument();
  });

  it('shows an empty state instead of a bare grid', () => {
    render(<PeopleGrid members={[]} />);
    expect(screen.getByText('등록된 구성원이 없습니다.')).toBeInTheDocument();
  });
});
