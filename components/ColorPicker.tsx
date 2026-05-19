"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cardColorList, getCardColor } from "@/lib/card-colors";
import type { CardColor } from "@/lib/nodes";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value?: CardColor;
  onChange: (color: CardColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const active = value ?? "default";
  const activeStyle = getCardColor(active);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <span
              className={cn("h-3 w-3 rounded-full", activeStyle.swatch)}
            />
            <span className="text-[12px]">{active}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-fit p-2">
        <div className="flex flex-wrap gap-1.5">
          {cardColorList.map((c) => {
            const style = getCardColor(c);
            const isActive = active === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full ring-2 transition-all",
                  style.swatch,
                  isActive
                    ? "ring-foreground"
                    : "ring-border/40 hover:ring-foreground/40"
                )}
                title={c}
              >
                {isActive && <Check size={12} className="text-white" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
