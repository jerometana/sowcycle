"use client";

import { Dna, Milk } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boar } from "@sowcycle/core";

interface BreedTagsProps {
  breeds?: Boar[];
  breastsCount?: number;
  className?: string;
}

export function SowTags({ breeds, breastsCount, className }: BreedTagsProps) {
  const hasBreeds = breeds && breeds.length > 0;
  const hasBreasts = breastsCount !== undefined && breastsCount > 0;

  if (!hasBreeds && !hasBreasts) return null;

  return (
    <>
      {hasBreasts && (
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 text-xs font-medium bg-white rounded-full text-muted-foreground",
            className
          )}
        >
          <Milk size={14} />
          <span>{`${breastsCount} เต้า`}</span>
        </div>
      )}
      {hasBreeds &&
        breeds!.map((breed) => {
          return (
            <div
              key={breed.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1 text-xs font-medium bg-white rounded-full text-muted-foreground",
                className
              )}
            >
              <Dna size={16} />
              <span>{breed.breed}</span>
            </div>
          );
        })}
    </>
  );
}
