"use client";

import { Sow } from "@sowcycle/core";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "../ui/button";
import {
  Check,
  ChevronRight,
  Dna,
  Heart,
  Milk,
  PiggyBank,
  Plus,
  X,
} from "lucide-react";

import { FarrowForm, NewBreedingForm } from "../Breeding/Form";
import DialogComponent from "../DrawerDialog";
import { cn, formatDateTH, getDaysDiff, getDaysRemaining } from "@/lib/utils";
import { AddToCalendarButton } from "../AddToCalendarButton";
import { SowTags } from "./SowTags";

export default function SowCard({ sow }: { sow: Sow }) {
  const latestBreeding = sow.breedings?.[0];
  const isPregnant = !sow.is_available && sow.is_active;

  return (
    <Card className="w-full overflow-hidden transition-all bg-white border-none shadow-none rounded-2xl">
      <Link href={`/sows/${sow.id}`}>
        <CardContent className="p-4 pb-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className={cn(
                "text-lg font-semibold",
                !sow.is_active
                  ? "text-muted-foreground"
                  : isPregnant
                  ? " text-primary"
                  : "text-black"
              )}
            >
              {sow.name}
            </h3>
            <ChevronRight size={20} className="text-muted-foreground" />
          </div>

          {/* Tags */}
          {((sow.boars && sow.boars.length > 0) ||
            (sow.breasts_count !== undefined && sow.breasts_count > 0)) && (
            <div className="flex flex-wrap gap-2 mb-4">
              <SowTags
                breeds={sow.boars}
                breastsCount={sow.breasts_count}
                className="bg-secondary px-4 py-1.5 text-sm"
              />
            </div>
          )}
          {/* Status Info */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-2 rounded-2xl flex items-center justify-center w-12 h-12 bg-gray-100",
                isPregnant ? " text-primary" : " text-muted-foreground"
              )}
            >
              {!sow.is_active ? (
                <X size={24} />
              ) : isPregnant ? (
                <Heart size={24} />
              ) : (
                <PiggyBank size={24} />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-muted-foreground text-sm mb-0.5">
                {isPregnant ? "กำหนดคลอด" : "คลอดล่าสุด"}
              </p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-gray-900">
                  {isPregnant
                    ? latestBreeding.expected_farrow_date &&
                      formatDateTH(latestBreeding.expected_farrow_date, true, true, false)
                    : latestBreeding?.actual_farrow_date
                    ? formatDateTH(latestBreeding.actual_farrow_date, true, true, false)
                    : "ไม่มีประวัติคลอด"}
                </span>

                {isPregnant && latestBreeding?.expected_farrow_date && (
                  <span className="text-sm font-medium text-primary">
                    ภายใน{" "}
                    {getDaysRemaining(latestBreeding.expected_farrow_date)} วัน
                  </span>
                )}

                {!isPregnant && latestBreeding?.actual_farrow_date && (
                  <span className="text-sm text-muted-foreground">
                    {getDaysDiff(latestBreeding.actual_farrow_date)} วันที่แล้ว
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="flex flex-col gap-3 p-4 pt-2 ">
        {isPregnant && latestBreeding ? (
          <div className="w-full space-y-2">
            <DialogComponent
              title="บันทึกการคลอด"
              dialogTriggerButton={
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-primary shadow-none hover:bg-pink-600"
                >
                  <Check className="w-5 h-5 mr-2" /> บันทึกการคลอด
                </Button>
              }
            >
              <FarrowForm breeding={latestBreeding} />
            </DialogComponent>

            <AddToCalendarButton
              title={`กำหนดคลอด ${sow.name}`}
              startDate={new Date(latestBreeding.expected_farrow_date!)}
              className="w-full h-12 text-base"
            />
          </div>
        ) : (
          <div className="w-full">
            <DialogComponent
              title="เพิ่มประวัติผสม"
              dialogTriggerButton={
                <Button
                  disabled={!sow.is_active}
                  size="lg"
                  variant="secondary"
                  className="w-full h-12 text-base"
                >
                  <Plus className="w-5 h-5 mr-2" /> เพิ่มประวัติผสม
                </Button>
              }
            >
              <NewBreedingForm id={sow.id.toString()} />
            </DialogComponent>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
