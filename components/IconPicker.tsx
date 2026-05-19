"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { iconMap, iconNames, getIcon } from "@/lib/icon-map";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string | undefined) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const Current = getIcon(value);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Current size={14} />
            <span className="text-[12px]">{value ?? "기본"}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-6 gap-1">
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={cn(
              "flex h-8 items-center justify-center rounded text-[10px] text-muted-foreground transition-colors hover:bg-accent",
              !value && "bg-accent"
            )}
            title="기본"
          >
            기본
          </button>
          {iconNames.map((name) => {
            const Icon = iconMap[name];
            const isActive = value === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-accent",
                  isActive && "bg-accent ring-1 ring-foreground/20"
                )}
                title={name}
              >
                <Icon size={15} />
                {isActive && (
                  <Check
                    size={10}
                    className="absolute translate-x-2 translate-y-2 text-foreground/40"
                  />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
