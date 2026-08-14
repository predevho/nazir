import { content as localContent } from '../content/data';
import type { AllContent, SiteContent, TimelineStatus } from '../content/types';
import { createServerClient } from './supabase';

type Rows = {
  blocks: { key: string; value: string }[];
  facts: { id: string; key: string; value: string; sort_order: number }[];
  characters: { id: string; name: string; description: string; photo_url: string | null; sort_order: number }[];
  timeline: { id: string; period: string; title: string; status: string; sort_order: number }[];
  budget: { id: string; name: string; sort_order: number }[];
  prayers: { id: string; text: string; sort_order: number }[];
  groups: { id: string; label: string; sort_order: number }[];
  members: { id: string; group_id: string; role: string; team: string; name: string; tagline: string; bio: string; photo_url: string | null; sort_order: number }[];
};

const byOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

/** 순수 함수: 원시 행 → AllContent. content_blocks는 로컬 site 위에 병합(누락 키는 로컬 기본값). */
export function assembleContent(rows: Rows): AllContent {
  const blocksMap = Object.fromEntries(rows.blocks.map((b) => [b.key, b.value])) as Partial<
    Record<keyof SiteContent, string>
  >;
  const site: SiteContent = {
    ...localContent.site,
    ...blocksMap,
    facts: [...rows.facts].sort(byOrder).map((f) => ({ key: f.key, value: f.value })),
  };
  return {
    site,
    characters: [...rows.characters].sort(byOrder).map((c) => ({
      id: c.id, name: c.name, description: c.description, photoUrl: c.photo_url, sortOrder: c.sort_order,
    })),
    timeline: [...rows.timeline].sort(byOrder).map((t) => ({
      id: t.id, period: t.period, title: t.title, status: t.status as TimelineStatus, sortOrder: t.sort_order,
    })),
    budget: [...rows.budget].sort(byOrder).map((b) => ({ id: b.id, name: b.name, sortOrder: b.sort_order })),
    prayers: [...rows.prayers].sort(byOrder).map((p) => ({ id: p.id, text: p.text, sortOrder: p.sort_order })),
    people: [...rows.groups].sort(byOrder).map((g) => ({
      id: g.id, label: g.label, sortOrder: g.sort_order,
      members: rows.members.filter((m) => m.group_id === g.id).sort(byOrder).map((m) => ({
        id: m.id, role: m.role, team: m.team, name: m.name, tagline: m.tagline, bio: m.bio, photoUrl: m.photo_url, sortOrder: m.sort_order,
      })),
    })),
  };
}

/** Supabase 우선, 미설정/실패 시 로컬 폴백. */
export async function getContent(): Promise<AllContent> {
  const client = createServerClient();
  if (!client) return localContent;
  try {
    const [blocks, facts, characters, timeline, budget, prayers, groups, members] = await Promise.all([
      client.from('content_blocks').select('key,value'),
      client.from('facts').select('id,key,value,sort_order'),
      client.from('characters').select('id,name,description,photo_url,sort_order'),
      client.from('timeline_events').select('id,period,title,status,sort_order'),
      client.from('budget_items').select('id,name,sort_order'),
      client.from('prayers').select('id,text,sort_order'),
      client.from('people_groups').select('id,label,sort_order'),
      client.from('people_members').select('id,group_id,role,team,name,tagline,bio,photo_url,sort_order'),
    ]);
    const err = blocks.error || facts.error || characters.error || timeline.error || budget.error || prayers.error || groups.error || members.error;
    if (err) throw err;
    return assembleContent({
      blocks: blocks.data ?? [], facts: facts.data ?? [], characters: characters.data ?? [],
      timeline: timeline.data ?? [], budget: budget.data ?? [], prayers: prayers.data ?? [],
      groups: groups.data ?? [], members: members.data ?? [],
    });
  } catch {
    return localContent;
  }
}
