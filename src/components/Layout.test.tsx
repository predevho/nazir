import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout', () => {
  it('renders nav links and footer brand', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>본문</div>
        </Layout>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: '대하여' })).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getAllByText('나지르').length).toBeGreaterThan(0);
  });
});
