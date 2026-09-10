import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADMIN_FIELDS } from './adminFields';
import { content } from '@/content/data';

describe('ADMIN_FIELDS', () => {
  it('SiteContent의 문자열 필드(facts 제외)를 정확히 모두 덮는다', () => {
    const siteKeys = Object.keys(content.site).filter((k) => k !== 'facts').sort();
    const fieldKeys = ADMIN_FIELDS.map((f) => f.key).sort();
    expect(fieldKeys).toEqual(siteKeys);
  });
  it('키 중복이 없다', () => {
    const keys = ADMIN_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

/*
  관리자에 칸만 있고 화면에 그리는 곳이 없는 값이 실제로 세 개 있었다
  (`peopleIntro` · `qnaIntro` · `qnaUrl`). 운영진이 고쳐도 아무 데도 안 나오는 칸은
  비어 있는 것보다 나쁘다 — 고친 사람은 반영된 줄 안다.

  위의 "SiteContent를 모두 덮는다" 검사는 *칸이 있는지*만 본다. 여기서는 반대쪽,
  *그 값을 쓰는 곳이 있는지*를 본다. 소스에서 `.키이름` 을 찾는 방식이라 정교하지는
  않지만, 통째로 쓰이지 않는 값은 확실히 잡는다.
*/
function publicSource(): string {
  const roots = ['app', 'components'];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      // 관리자 화면은 세지 않는다. 편집 칸과 미리보기에는 당연히 나오므로,
      // 포함시키면 "공개 화면에 안 나온다"는 사실을 덮어 버린다.
      if (e.isDirectory()) {
        if (!p.includes('admin')) walk(p);
      } else if (/\.tsx?$/.test(e.name) && !e.name.includes('.test.')) {
        files.push(p);
      }
    }
  };
  roots.forEach(walk);
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

describe('ADMIN_FIELDS — 그리는 곳이 있는가', () => {
  const src = publicSource();

  it.each(ADMIN_FIELDS.map((f) => f.key))('%s 를 공개 화면에서 쓴다', (key) => {
    const used = new RegExp(`\\.${key}\\b`).test(src);
    expect(used, `'${key}' 는 관리자에서 고칠 수 있지만 공개 화면 어디에서도 쓰지 않는다`).toBe(true);
  });
});
