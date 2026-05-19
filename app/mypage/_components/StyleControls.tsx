"use client";

import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { useNodes } from "@/context/nodes-context";
import type { Node } from "@/lib/nodes";

interface StyleControlsProps {
  node: Node;
}

export function StyleControls({ node }: StyleControlsProps) {
  const { updateStyle } = useNodes();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground">카드 꾸미기:</span>
      <IconPicker
        value={node.iconName}
        onChange={(iconName) => updateStyle(node.id, { iconName })}
      />
      <ColorPicker
        value={node.cardColor}
        onChange={(cardColor) => updateStyle(node.id, { cardColor })}
      />
    </div>
  );
}
