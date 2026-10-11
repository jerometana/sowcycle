"use client";

import MedicineForm from "@/components/Medicine/Form";
import MedicineList from "@/components/Medicine/List";
import DialogComponent from "@/components/DrawerDialog";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAllMedicines } from "@/services/medicine";
import { useMedicineStore } from "@/stores/useMedicineStore";
import { getAllMedicalRecords } from "@/services/medicalRecord";
import { useMedicalRecordStore } from "@/stores/useMedicalRecordStore";
import MedicalRecordCard from "@/components/MedicalRecord/Card";
import { MedicalRecord, Medicine, Sow, Boar } from "@sowcycle/core";
import { ChevronDown, Filter, ListFilter, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TabsComponent from "@/components/TabsComponent";
import { MedicineHistoryCard } from "@/components/Medicine/Card";
import { MedicineLoadingSkeleton } from "@/components/Medicine/LoadingSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/animations/FadeIn";

export default function MedicinesPage() {
  return (
    <>
      <TopBar title="ยาและวัคซีน" />
      <main className="min-h-screen p-4 pt-0 md:pb-8 md:p-8">
        <TabsComponent
          tabOptions={[
            {
              label: "คลังยา",
              value: "details",
              content: <MedicineInventory />,
              default: true,
            },
            {
              label: "ประวัติใช้ยา",
              value: "history",
              content: <MedicineHistory />,
            },
          ]}
        />
      </main>
    </>
  );
}

function MedicineInventory() {
  const { medicines, setMedicines } = useMedicineStore();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => medicine.title.includes(search));
  }, [medicines, search]);

  useEffect(() => {
    const fetchData = async () => {
      const medicines = await getAllMedicines();
      if (!medicines) return;
      setMedicines(medicines);
      setIsLoading(false);
    };
    medicines.length === 0 ? fetchData() : setIsLoading(false);
  }, []);

  if (isLoading) {
    return <MedicineLoadingSkeleton />;
  }
  return (
    <div>
      <DialogComponent
        title="เพิ่มยาหรือวัคซีนใหม่"
        dialogTriggerButton={
          <div className="fixed z-10 flex items-center gap-2 p-4 text-white rounded-full shadow cursor-pointer bg-primary bottom-24 right-4">
            <Plus size={22} />
          </div>
        }
      >
        <MedicineForm />
      </DialogComponent>
      <div className="space-y-4 mt-4">
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={Search}
            placeholder="ค้นหาด้วยชื่อยาหรือวัคซีน"
            className="bg-white rounded-full"
          />
        </div>
        <MedicineList medicines={filteredMedicines} />
      </div>
    </div>
  );
}

function MedicineHistory() {
  const { medicalRecords, setMedicalRecords } = useMedicalRecordStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const records = await getAllMedicalRecords();
      if (!records) return;
      setMedicalRecords(records);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-52 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {medicalRecords.length > 0 ? (
        medicalRecords.map((record, index) => (
          <FadeIn key={index} delay={index * 0.1}>
            <MedicineHistoryCard
              key={index}
              medicalRecord={
                record as MedicalRecord & {
                  medicines: Medicine;
                  sows: Sow & { boars: Boar[] };
                }
              }
            />
          </FadeIn>
        ))
      ) : (
        <div className="py-10 text-center text-muted-foreground">
          ไม่พบประวัติการใช้ยา
        </div>
      )}
    </div>
  );
}
