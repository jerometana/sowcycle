"use client";

import DialogComponent from "@/components/DrawerDialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Baby,
  PiggyBank,
  Fence,
  ListFilter,
  Check,
} from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import LitterCard from "@/components/Litter/Card";
import { FadeIn } from "@/components/animations/FadeIn";
import { useLitterData } from "@/hooks/useLitterData";
import { useLitterFilters } from "@/hooks/useLitterFilters";
import { Litter, Boar } from "@sowcycle/core";
import { cn } from "@/lib/utils";
import TopBar from "@/components/TopBar";
import { StatsCard } from "@/components/StatsCard";
import { LitterLoadingSkeleton } from "@/components/Litter/LoadingSkeleton";

// Types
interface FilterOption {
  label: string;
  value: Record<string, any>;
}

// Constants
const FILTER_OPTIONS: FilterOption[] = [
  { label: "ทั้งหมด", value: {} },
  { label: "ยังไม่ขุน", value: { fattening_at: "null", sold_at: "null" } },
  { label: "กำลังขุน", value: { fattening_at: "not_null", sold_at: "null" } },
  { label: "ขายแล้ว", value: { sold_at: "not_null" } },
];

const DEFAULT_FILTER = FILTER_OPTIONS[0];

const isSameFilterValue = (
  left: Record<string, any>,
  right: Record<string, any>
) => JSON.stringify(left) === JSON.stringify(right);

export default function LittersPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterOption[]>([DEFAULT_FILTER]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const { litters, isLoading, error } = useLitterData();

  const availableBreeds = useMemo(() => {
    const breedSet = new Set<string>();

    litters.forEach((litter) => {
      (litter.sows?.boars || []).forEach((boar: Boar) => {
        if (boar) breedSet.add(boar.breed);
      });
    });

    return Array.from(breedSet).sort((a, b) => a.localeCompare(b, "th-TH"));
  }, [litters]);

  const isDefaultFilterActive =
    filters.length === 0 ||
    (filters.length === 1 &&
      isSameFilterValue(filters[0].value, DEFAULT_FILTER.value));

  // Apply filters to litters
  const filteredLitters = useLitterFilters(litters, search).filter(
    (litter) => {
      const matchesStatus =
        isDefaultFilterActive ||
        filters.some((option) =>
          Object.entries(option.value).every(([key, value]) => {
            if (value === "null") {
              return litter[key] === null;
            }
            if (value === "not_null") {
              return litter[key] !== null;
            }
            return litter[key] === value;
          })
        );

      const matchesBreed =
        selectedBreeds.length === 0 ||
        (litter.sows?.breeds || []).some((breed: string) =>
          selectedBreeds.includes(breed)
        );

      return matchesStatus && matchesBreed;
    }
  );

  if (error) {
    return <ErrorState />;
  }

  if (isLoading) {
    return <LitterLoadingSkeleton />;
  }

  return (
    <>
      <TopBar title="ครอกลูกหมู" />
      <main className="min-h-screen p-4 pt-0 md:pb-8 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/*<PageHeader />*/}
          {/* <LitterStats litters={littersWithBreeds} /> */}
          <FilterControls
            search={search}
            setSearch={setSearch}
            filters={filters}
            setFilters={setFilters}
            selectedBreeds={selectedBreeds}
            setSelectedBreeds={setSelectedBreeds}
            availableBreeds={availableBreeds}
          />
          <LittersList litters={filteredLitters} />
        </div>
      </main>
    </>
  );
}

function LitterStats({ litters }: { litters: any[] }) {
  const totalPiglets = calculateTotalPiglets(litters);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <StatsCard
        icon={Fence}
        title="เกิดแล้วทั้งหมด"
        value={litters.length}
        iconColor="text-blue-500"
        unit="ครอก"
      />
      <StatsCard
        icon={PiggyBank}
        title="กำลังขุน"
        value={totalPiglets}
        iconColor="text-primary"
        unit="ตัว"
      />
    </div>
  );
}

function FilterControls({
  search,
  setSearch,
  filters,
  setFilters,
  selectedBreeds,
  setSelectedBreeds,
  availableBreeds,
}: {
  search: string;
  setSearch: (value: string) => void;
  filters: FilterOption[];
  setFilters: Dispatch<SetStateAction<FilterOption[]>>;
  selectedBreeds: string[];
  setSelectedBreeds: Dispatch<SetStateAction<string[]>>;
  availableBreeds: string[];
}) {
  const hasCustomStatusFilters =
    filters.length > 0 &&
    !filters.some((option) =>
      isSameFilterValue(option.value, DEFAULT_FILTER.value)
    );

  const hasBreedFilters = selectedBreeds.length > 0;
  const isFilterActive = hasCustomStatusFilters || hasBreedFilters;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          placeholder="ค้นหาด้วยชื่อแม่พันธุ์ หรือ สายพันธุ์"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-full"
        />
        <Search
          className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
          size={20}
        />
      </div>
      <DialogComponent
        title="กรองลูกหมู"
        dialogTriggerButton={
          <Button
            size="icon"
            variant="outline"
            className={cn(
              "flex items-center gap-2 size-12 rounded-full",
              isFilterActive &&
                "bg-primary/10 border border-primary !text-primary"
            )}
          >
            <ListFilter />
          </Button>
        }
      >
        <FilterOptionsList
          appliedStatusFilters={filters}
          onApplyStatus={setFilters}
          appliedBreeds={selectedBreeds}
          onApplyBreeds={setSelectedBreeds}
          availableBreeds={availableBreeds}
        />
      </DialogComponent>
    </div>
  );
}

type FilterOptionsListProps = {
  appliedStatusFilters: FilterOption[];
  onApplyStatus: Dispatch<SetStateAction<FilterOption[]>>;
  appliedBreeds: string[];
  onApplyBreeds: Dispatch<SetStateAction<string[]>>;
  availableBreeds: string[];
  setDialog?: (open: boolean) => void;
  isDialogOpen?: boolean;
};

function FilterOptionsList({
  appliedStatusFilters,
  onApplyStatus,
  appliedBreeds,
  onApplyBreeds,
  availableBreeds,
  setDialog,
  isDialogOpen,
}: FilterOptionsListProps) {
  const [selectedStatusFilters, setSelectedStatusFilters] =
    useState<FilterOption[]>(appliedStatusFilters);
  const [selectedBreedFilters, setSelectedBreedFilters] =
    useState<string[]>(appliedBreeds);

  useEffect(() => {
    if (isDialogOpen) {
      setSelectedStatusFilters(appliedStatusFilters);
      setSelectedBreedFilters(appliedBreeds);
    }
  }, [isDialogOpen, appliedStatusFilters, appliedBreeds]);

  const toggleStatusOption = (option: FilterOption) => {
    setSelectedStatusFilters((prev) => {
      if (isSameFilterValue(option.value, DEFAULT_FILTER.value)) {
        return [DEFAULT_FILTER];
      }

      const withoutDefault = prev.filter(
        (item) => !isSameFilterValue(item.value, DEFAULT_FILTER.value)
      );

      const exists = withoutDefault.some((item) =>
        isSameFilterValue(item.value, option.value)
      );

      const next = exists
        ? withoutDefault.filter(
            (item) => !isSameFilterValue(item.value, option.value)
          )
        : [...withoutDefault, option];

      return next.length === 0 ? [DEFAULT_FILTER] : next;
    });
  };

  const handleApply = () => {
    onApplyStatus(
      selectedStatusFilters.length === 0
        ? [DEFAULT_FILTER]
        : selectedStatusFilters
    );
    onApplyBreeds(selectedBreedFilters);
    setDialog?.(false);
  };

  const handleClear = () => {
    setSelectedStatusFilters([DEFAULT_FILTER]);
    setSelectedBreedFilters([]);
    onApplyStatus([DEFAULT_FILTER]);
    onApplyBreeds([]);
  };

  const activeStatusCount = selectedStatusFilters.filter(
    (option) => !isSameFilterValue(option.value, DEFAULT_FILTER.value)
  ).length;
  const activeBreedCount = selectedBreedFilters.length;

  return (
    <div className="space-y-4">
      <div className="p-4 space-y-2 rounded-2xl bg-muted">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p className="font-semibold text-gray-800">สถานะ</p>
          <span>
            {activeStatusCount > 0
              ? `${activeStatusCount} เลือกแล้ว`
              : "เลือกได้หลายสถานะ"}
          </span>
        </div>
        <div className="grid gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isSelected = selectedStatusFilters.some((selected) =>
              isSameFilterValue(selected.value, option.value)
            );

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => toggleStatusOption(option)}
                className={cn(
                  "flex items-center justify-between rounded-full border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200",
                  isSelected
                    ? "border-primary bg-white text-primary"
                    : "border-transparent bg-white text-gray-600"
                )}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center",
                    isSelected && "text-primary bg-white"
                  )}
                >
                  {isSelected && <Check />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-3 border border-gray-100 rounded-2xl bg-muted">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p className="font-semibold text-gray-800">สายพันธุ์</p>
          <span>
            {activeBreedCount > 0
              ? `${activeBreedCount} เลือกแล้ว`
              : "เลือกได้หลายสายพันธุ์"}
          </span>
        </div>
        {availableBreeds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีข้อมูลสายพันธุ์สำหรับการกรอง
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableBreeds.map((breed) => {
              const isSelected = selectedBreedFilters.includes(breed);
              return (
                <button
                  key={breed}
                  type="button"
                  onClick={() =>
                    setSelectedBreedFilters((prev) =>
                      prev.includes(breed)
                        ? prev.filter((item) => item !== breed)
                        : [...prev, breed]
                    )
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200",
                    isSelected
                      ? "border-primary bg-white text-pink-600 shadow-sm"
                      : "border-transparent bg-white text-gray-600 hover:border-pink-200"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                        <Check size={10} />
                      </span>
                    )}
                    {breed}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size={"lg"}
          variant="ghost"
          className="flex-1"
          onClick={handleClear}
        >
          ล้างตัวกรอง
        </Button>
        <Button
          type="button"
          size={"lg"}
          className="flex-1"
          onClick={handleApply}
        >
          ใช้ตัวกรอง
        </Button>
      </div>
    </div>
  );
}

function LittersList({ litters }: { litters: any[] }) {
  if (litters.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      {litters.map((litter, index) => (
        <FadeIn key={litter.id} delay={index * 0.1}>
          <LitterCard litter={litter} index={litters.length - index} />
        </FadeIn>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Baby className="mx-auto mb-4 text-gray-400" size={48} />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          ยังไม่มีข้อมูลลูกหมู
        </h3>
        <p className="text-muted-foreground">
          ยังไม่มีการผสมพันธุ์ที่คลอดลูกแล้ว
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility functions
function calculateTotalPiglets(litters: Litter[]): number {
  return litters
    .filter((litter) => !litter.sold_at)
    .reduce((total, litter) => total + (litter.piglets_born_count || 0), 0);
}
