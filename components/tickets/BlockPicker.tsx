// /components/tickets/BlockPicker.tsx
// Generic block-selection grid — renders whatever groups the caller passes in.
// Source of truth used to be a static venue preset; with the dynamic resolver
// the parent fetches groups from /api/tickets/lookup and passes them through.
'use client';

import { useMemo } from 'react';
import type { BlockSpec } from '@/lib/tickets/firestoreSchema';

export type BlockPickerGroup = {
  title: string;
  blocks: BlockSpec[];
};

type Props = {
  groups: BlockPickerGroup[];
  value: BlockSpec[];
  onChange: (next: BlockSpec[]) => void;
};

export function BlockPicker({ groups, value, onChange }: Props) {
  const selected = useMemo(() => new Set(value.map(b => b.code)), [value]);

  if (!groups || groups.length === 0) {
    return <p className="text-sm text-gray-500">표시할 블록 정보가 없습니다.</p>;
  }

  function toggle(spec: BlockSpec) {
    if (selected.has(spec.code)) onChange(value.filter(b => b.code !== spec.code));
    else onChange([...value, spec]);
  }

  function toggleGroup(blocks: BlockSpec[], allOn: boolean) {
    const codes = new Set(blocks.map(b => b.code));
    if (allOn) onChange(value.filter(b => !codes.has(b.code)));
    else {
      const merged = [...value];
      for (const b of blocks) if (!selected.has(b.code)) merged.push(b);
      onChange(merged);
    }
  }

  return (
    <div className="space-y-4">
      {groups.map(group => {
        const allOn = group.blocks.every(b => selected.has(b.code));
        return (
          <fieldset key={group.title} className="border rounded-md p-3">
            <legend className="px-2 text-sm font-medium flex items-center gap-2">
              {group.title}
              <button
                type="button"
                onClick={() => toggleGroup(group.blocks, allOn)}
                className="text-xs text-blue-600 hover:underline"
              >
                {allOn ? '전체 해제' : '전체 선택'}
              </button>
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
              {group.blocks.map(b => (
                <label
                  key={b.code}
                  className={`flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer ${
                    selected.has(b.code) ? 'bg-blue-50 border-blue-400' : 'bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(b.code)}
                    onChange={() => toggle(b)}
                    className="accent-blue-600"
                  />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
