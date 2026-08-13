import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('toggles content when the header is clicked', async () => {
    render(
      <Accordion label="헤더진" defaultOpen={false}>
        <p>연출 정은수</p>
      </Accordion>
    );
    expect(screen.queryByText('연출 정은수')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /헤더진/ }));
    expect(screen.getByText('연출 정은수')).toBeInTheDocument();
  });
});
