"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Breeding, breedingStage, pregnancyCheckDates } from "@sowcycle/core";
import DialogComponent from "../DrawerDialog";
import { Button } from "../ui/button";
import {
  Check,
  ChevronRight,
  Calendar,
  PiggyBank,
  Heart,
  Dna,
  CircleAlert,
} from "lucide-react";
import { FarrowForm } from "./Form";
import { cn, formatDateTH } from "@/lib/utils";
import BoarDetailsCard from "../Boar/DetailsCard";
import { AddToCalendarButton } from "../AddToCalendarButton";
import BreedingDrawer from "./Drawer";
import InfoIcon from "../InfoIcon";

export default function BreedingCard({
  breeding,
  index,
}: {
  breeding: Breeding;
  index: number;
}) {
  if (!breeding) return null;

  const isPregnant = breedingStage(breeding) === "pregnant";
  const isCompleted = !!breeding.actual_farrow_date;

  const breedDate = new Date(breeding.breed_date);
  const [checkDate21, checkDate42] = pregnancyCheckDates(breedDate);
  const today = new Date();
  const isCheck21Passed = today >= checkDate21;
  const isCheck42Passed = today >= checkDate42;

  const getDaysRemaining = (dateStr: string) => {
    const diffTime = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysDiffFromExpected = (actual: string, expected: string) => {
    const diffTime = new Date(expected).getTime() - new Date(actual).getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (days > 0) return `ก่อนกำหนด ${days} วัน`;
    if (days < 0) return `หลังกำหนด ${Math.abs(days)} วัน`;
    return "ตรงตามกำหนด";
  };

  return (
    <DialogComponent
      title={`ผสมครั้งที่ ${index}`}
      dialogTriggerButton={
        <Card className="w-full overflow-hidden text-left transition-all bg-white border-none shadow-none cursor-pointer rounded-2xl md:hover:bg-gray-50">
          <CardContent className="p-4 pb-2">
            {/* Header */}
            <div className="flex justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={cn(
                    "text-lg font-semibold",
                    isPregnant ? "text-primary" : "text-black",
                  )}
                >
                  ผสมครั้งที่ {index}
                </h3>
                {isPregnant && (
                  <span className="text-sm font-normal text-pink-400">
                    (คลอดภายใน {getDaysRemaining(breeding.expected_farrow_date)}{" "}
                    วัน)
                  </span>
                )}
                {breeding.is_aborted && (
                  <span className="text-red-500">(แท้ง)</span>
                )}
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </div>

            <div className="flex flex-col gap-4">
              {/* Breeding Date */}
              <InfoIcon
                icon={<Heart size={24} />}
                label="ผสมเมื่อ"
                className={cn(
                  isPregnant ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="font-semibold text-gray-900">
                  {formatDateTH(breeding.breed_date, true, true, true)}
                </span>
              </InfoIcon>

              {/* Breeding Check Dates (21 and 42 days) - only when pregnant */}
              {isPregnant && (
                <>
                  {/* 21-day check */}
                  <InfoIcon
                    icon={<CircleAlert size={24} />}
                    label="กลับสัดครั้งที่ 1"
                    className={
                      isCheck21Passed ? "text-green-600" : "text-amber-500"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatDateTH(
                          checkDate21.toISOString(),
                          true,
                          true,
                          true,
                        )}
                      </span>
                      {!isCheck21Passed && (
                        <span className="text-sm text-amber-500 font-medium">
                          อีก {getDaysRemaining(checkDate21.toISOString())} วัน
                        </span>
                      )}
                    </div>
                  </InfoIcon>

                  {/* 42-day check */}
                  <InfoIcon
                    icon={<CircleAlert size={24} />}
                    label="กลับสัดครั้งที่ 2"
                    className={
                      isCheck42Passed ? "text-green-600" : "text-amber-500"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatDateTH(
                          checkDate42.toISOString(),
                          true,
                          true,
                          true,
                        )}
                      </span>
                      {!isCheck42Passed && (
                        <span className="text-sm text-amber-500 font-medium">
                          อีก {getDaysRemaining(checkDate42.toISOString())} วัน
                        </span>
                      )}
                    </div>
                  </InfoIcon>
                </>
              )}

              {/* Farrow Date / Expected Date */}
              <InfoIcon
                icon={<Calendar size={24} />}
                label={isCompleted ? "คลอดเมื่อ" : "กำหนดคลอด"}
                className={cn(
                  isPregnant ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-gray-900">
                    {isCompleted
                      ? formatDateTH(
                          breeding.actual_farrow_date!,
                          true,
                          true,
                          true,
                        )
                      : formatDateTH(
                          breeding.expected_farrow_date,
                          true,
                          true,
                          true,
                        )}
                  </span>
                  {isCompleted && (
                    <span className="text-sm text-muted-foreground">
                      {getDaysDiffFromExpected(
                        breeding.actual_farrow_date!,
                        breeding.expected_farrow_date,
                      )}
                    </span>
                  )}
                </div>
              </InfoIcon>

              {/* Boar Info */}
              {breeding.boars && (
                <div onClick={(e) => e.stopPropagation()} className="w-full">
                  <DialogComponent
                    title={breeding.boars.breed}
                    dialogTriggerButton={
                      <div className="flex items-center justify-between w-full p-3 cursor-pointer bg-secondary rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 p-2 bg-white text-muted-foreground rounded-2xl">
                            <Dna />
                          </div>
                          <div className="flex flex-col text-left">
                            <p className="text-xs text-muted-foreground">
                              พ่อพันธุ์
                            </p>
                            <span className="font-semibold text-gray-900">
                              {breeding.boars.breed}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground"
                        />
                      </div>
                    }
                  >
                    <BoarDetailsCard boar={breeding.boars} />
                  </DialogComponent>
                </div>
              )}

              {/* Piglets Info (Only if completed) */}
              {isCompleted && (
                <div className="flex items-start gap-4 p-4 !mb-2 bg-secondary rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 p-2 bg-white text-muted-foreground rounded-2xl">
                    <PiggyBank size={24} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-muted-foreground text-sm mb-0.5">
                      จำนวนลูกเกิดรอด
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {breeding.piglets_born_count} ตัว
                      </span>
                      <div className="flex gap-1 ml-2">
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          ผู้ {breeding.piglets_male_born_alive}
                        </span>
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                          เมีย {breeding.piglets_female_born_alive}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {isPregnant && (
            <CardFooter className="flex flex-col gap-2 p-4 pt-2">
              <div onClick={(e) => e.stopPropagation()} className="w-full">
                <DialogComponent
                  title="บันทึกการคลอด"
                  dialogTriggerButton={
                    <Button
                      size="lg"
                      className="w-full h-12 bg-primary shadow-none md:hover:bg-pink-600"
                    >
                      <Check className="w-5 h-5 mr-2" /> บันทึกการคลอด
                    </Button>
                  }
                >
                  <FarrowForm breeding={breeding} />
                </DialogComponent>
              </div>

              <div className="w-full" onClick={(e) => e.stopPropagation()}>
                <AddToCalendarButton
                  title={`กำหนดคลอด`}
                  startDate={new Date(breeding.expected_farrow_date)}
                  className="w-full h-12 font-medium"
                />
              </div>
            </CardFooter>
          )}
        </Card>
      }
    >
      <BreedingDrawer breeding={breeding} index={index} />
    </DialogComponent>
  );
}
