import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./actions', () => ({ savePeople: vi.fn() }));
import { PeopleEditor } from './PeopleEditor';

const initial = [{ id: 'g0', label: '헤더진', members: [{ id: 'g0m0', role: '연출', name: '정은수', bio: '' }] }];

describe('PeopleEditor', () => {
  it('그룹 라벨과 멤버 값, 저장 버튼을 렌더한다', () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getByDisplayValue('헤더진')).toBeInTheDocument();
    expect(screen.getByDisplayValue('정은수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('연출')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('멤버 추가/삭제가 동작한다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getAllByLabelText('이름').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 멤버 추가' }));
    expect(screen.getAllByLabelText('이름').length).toBe(2);
    await userEvent.click(screen.getAllByRole('button', { name: '멤버 삭제' })[1]);
    expect(screen.getAllByLabelText('이름').length).toBe(1);
  });

  it('그룹 추가가 동작한다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getAllByLabelText('그룹 이름').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 그룹 추가' }));
    expect(screen.getAllByLabelText('그룹 이름').length).toBe(2);
  });

  it('약력 항목을 추가할 수 있다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.queryAllByLabelText('약력 항목').length).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: '+ 약력 항목' }));
    expect(screen.getAllByLabelText('약력 항목').length).toBe(1);
  });
});

describe('PeopleEditor — 그룹마다 끊어 보기', () => {
  const group = (id: string, label: string, n: number) => ({
    id,
    label,
    members: Array.from({ length: n }, (_, i) => ({
      id: `${id}m${i}`,
      role: i % 2 === 0 ? '음향·음악팀' : '기획팀',
      team: '',
      name: `사람${i}`,
      tagline: '',
      bio: '',
      photo_url: null,
    })),
  });

  const saved = (container: HTMLElement) =>
    JSON.parse((container.querySelector('input[name="groups"]') as HTMLInputElement).value);

  it('그룹마다 따로 센다 — 한 덩어리로 묶으면 그룹 경계가 흐려진다', () => {
    render(<PeopleEditor initialGroups={[group('g0', '헤더진', 8), group('g1', '스탭진', 18)]} />);
    expect(screen.getByText(/^8개$/)).toBeInTheDocument();
    expect(screen.getByText(/^18개$/)).toBeInTheDocument();
  });

  it('18명짜리 그룹은 끊어서 보여준다', () => {
    render(<PeopleEditor initialGroups={[group('g1', '스탭진', 18)]} />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getAllByLabelText('이름')).toHaveLength(10);
  });

  it('안 보이는 멤버도 저장에 그대로 들어간다', async () => {
    const user = userEvent.setup();
    const { container } = render(<PeopleEditor initialGroups={[group('g1', '스탭진', 18)]} />);
    await user.type(screen.getByRole('searchbox'), '기획팀');

    expect(screen.getByText(/18개 중 9개 보임/)).toBeInTheDocument();
    expect(saved(container)[0].members).toHaveLength(18);
  });

  it('찾기는 이름뿐 아니라 역할로도 걸린다', async () => {
    const user = userEvent.setup();
    render(<PeopleEditor initialGroups={[group('g1', '스탭진', 18)]} />);
    await user.type(screen.getByRole('searchbox'), '사람3');
    expect(screen.getByText(/18개 중 1개 보임/)).toBeInTheDocument();
  });

  it('거른 상태에서 ↑ 는 보이는 이웃과 자리를 바꾼다', async () => {
    const user = userEvent.setup();
    const { container } = render(<PeopleEditor initialGroups={[group('g1', '스탭진', 6)]} />);
    // 기획팀 = 홀수 번호(m1, m3, m5). 그중 둘째(m3)를 올리면 m1 과 자리가 바뀐다
    await user.type(screen.getByRole('searchbox'), '기획팀');
    await user.click(screen.getAllByRole('button', { name: '멤버 위로' })[1]);

    const ids = saved(container)[0].members.map((m: { id: string }) => m.id);
    expect(ids.indexOf('g1m3')).toBeLessThan(ids.indexOf('g1m1'));
    expect(ids).toHaveLength(6);
  });
});