"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useSowDetailData } from "@/hooks/useSowDetailData";
import { useSowDetailCalculations } from "@/hooks/useSowDetailCalculations";

import SowHeader from "@/components/Sow/SowHeader";
import SowDetailsCard from "@/components/Sow/SowDetailsCard";
import SowHistorySection from "@/components/Sow/SowHistorySection";
import { LoadingPageSkeleton } from "@/components/Sow/LoadingSkeleton";
import TopBar from "@/components/TopBar";
import TabsComponent from "@/components/TabsComponent";
import { Sow, Boar } from "@sowcycle/core";

interface SowPageProps {
  params: Promise<{ id: string }>;
}

export default function SowPage({ params }: SowPageProps) {
  const [id, setId] = useState<number | null>(null);

  const { sow, breedings, litters, medicalRecords, isLoading, error } =
    useSowDetailData(id);

  const { averagePigletsBornCount, averageWeightChart } =
    useSowDetailCalculations(breedings, litters);

  useEffect(() => {
    const getParamsId = async () => {
      const { id } = await params;
      setId(parseInt(id));
    };
    getParamsId();
  }, [params]);

  useEffect(() => {
    if (error) {
      redirect("/404");
    }
  }, [error]);

  if (isLoading) {
    return <LoadingPageSkeleton />;
  }

  if (!sow) {
    return null;
  }

  return (
    <>
      <TopBar title={sow.name} hasBack />
      <main className="space-y-8 p-4 pt-0 md:pb-8 md:p-8">
        <TabsComponent
          tabOptions={[
            {
              label: "รายละเอียด",
              value: "details",
              content: (
                <SowDetailsCard
                  sow={sow as Sow & { boars: Boar[] }}
                  breedings={breedings}
                  litters={litters}
                  averagePigletsBornCount={averagePigletsBornCount}
                  averageWeightChart={averageWeightChart}
                />
              ),
              default: true,
            },
            {
              label: "บันทึกประวัติ",
              value: "history",
              content: (
                <SowHistorySection
                  sow={sow}
                  breedings={breedings}
                  medicalRecords={medicalRecords}
                />
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
