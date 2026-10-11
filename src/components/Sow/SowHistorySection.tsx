import { useState } from "react";
import { Button } from "@/components/ui/button";
import DialogComponent from "@/components/DrawerDialog";
import TabsComponent from "@/components/TabsComponent";
import BreedingCard from "@/components/Breeding/Card";
import MedicalRecordCard from "@/components/MedicalRecord/Card";
import { NewBreedingForm } from "@/components/Breeding/Form";
import { MedicalRecordForm } from "@/components/MedicalRecord/Form";
import { Sow, Breeding, MedicalRecord, Medicine } from "@sowcycle/core";
import { Heart, Plus, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

interface SowHistorySectionProps {
  sow: Sow;
  breedings: Breeding[];
  medicalRecords: MedicalRecord[];
}

type FilterType = "all" | "breeding" | "medical";

export default function SowHistorySection({
  sow,
  breedings,
  medicalRecords,
}: SowHistorySectionProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const tabFormOptions = [
    {
      label: (
        <>
          <Heart size={12} />
          &nbsp;ประวัติผสม
        </>
      ),
      value: "breeding",
      content:
        breedings.length === 0 || breedings[0]?.actual_farrow_date ? (
          <div className="mt-2">
            <NewBreedingForm id={sow?.id?.toString()} />
          </div>
        ) : (
          <div className="py-20 text-sm text-center text-gray-400">
            ไม่สามารถเพิ่มประวัติผสม
            <br />
            เนื่องจากยังไม่มีการบันทึกวันคลอดของการผสมล่าสุด
          </div>
        ),
      default: true,
    },
    {
      label: (
        <>
          <Syringe size={12} />
          &nbsp;ประวัติใช้ยา
        </>
      ),
      value: "medical",
      content: (
        <div className="mt-4">
          <MedicalRecordForm id={sow?.id?.toString()} />
        </div>
      ),
    },
  ];

  const combinedHistory = [
    ...breedings.map((b, i) => ({
      type: "breeding" as const,
      date: new Date(b.breed_date),
      data: b,
      number: breedings.length - i,
    })),
    ...medicalRecords.map((m, i) => ({
      type: "medical" as const,
      date: new Date(m.used_at),
      data: m,
      number: medicalRecords.length - i,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredHistory = combinedHistory.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-2">
      {/* <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">ประวัติแม่พันธุ์</h2>
        <DialogComponent
          title="เพิ่มประวัติใหม่"
          dialogTriggerButton={
            <Button disabled={!sow.is_active} size="sm">
              <Plus className="w-4 h-4 mr-1" /> เพิ่มประวัติ
            </Button>
          }
        >
          <TabsComponent tabOptions={tabFormOptions} />
        </DialogComponent>
      </div> */}
      <div className="mt-4 overflow-auto no-scrollbar">
        <div className="flex flex-wrap gap-2 ">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm border border-card font-medium whitespace-nowrap transition-colors",
              filter === "all"
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card text-card-foreground"
            )}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilter("breeding")}
            className={cn(
              "px-4 py-2 rounded-full text-sm border border-card font-medium whitespace-nowrap transition-colors",
              filter === "breeding"
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card text-card-foreground"
            )}
          >
            <Heart className="inline w-3 h-3 mr-1" />
            การผสม ({breedings.length})
          </button>
          <button
            onClick={() => setFilter("medical")}
            className={cn(
              "px-4 py-2 rounded-full text-sm border border-card font-medium whitespace-nowrap transition-colors",
              filter === "medical"
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card text-card-foreground"
            )}
          >
            <Syringe className="inline w-3 h-3 mr-1" />
            การใช้ยา ({medicalRecords.length})
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => (
            <div key={`${item.type}-${item.data.id || index}`}>
              {item.type === "breeding" ? (
                <BreedingCard
                  index={item.number}
                  breeding={item.data as Breeding}
                />
              ) : (
                <MedicalRecordCard
                  index={item.number}
                  medicalRecord={
                    item.data as MedicalRecord & { medicines: Medicine }
                  }
                />
              )}
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            ไม่พบประวัติ
          </div>
        )}
      </div>
      <DialogComponent
        title="เพิ่มประวัติใหม่"
        dialogTriggerButton={
          <div className="fixed z-10 flex items-center gap-2 p-4 text-white rounded-full shadow cursor-pointer bg-primary bottom-24 right-4">
            <Plus size={22} />
          </div>
        }
      >
        <TabsComponent tabOptions={tabFormOptions} />
      </DialogComponent>
    </div>
  );
}
