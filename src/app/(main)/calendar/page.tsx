"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { FarrowEventList } from "@/components/Calendar/FarrowEventList";
import { SaleableEventList } from "@/components/Calendar/SaleableEventList";
import { useCalendarData } from "@/hooks/useCalendarData";
import TopBar from "@/components/TopBar";

// Main component
export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const { data, loading, error, refetch } = useCalendarData();
  const { farrowEvents, saleableEvents } = data;

  // Memoized filtered events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return { farrow: [], saleable: [] };

    return {
      farrow: farrowEvents.filter((event) =>
        isSameDay(event.actualFarrowDate || event.expectedDate, selectedDate)
      ),
      saleable: saleableEvents.filter((event) => {
        if (event.soldDate) {
          return isSameDay(event.soldDate, selectedDate);
        }
        return isSameDay(event.saleableDate, selectedDate);
      }),
    };
  }, [selectedDate, farrowEvents, saleableEvents]);

  // Memoized calendar modifiers
  const calendarModifiers = useMemo(
    () => ({
      hasEvent: (date: Date) =>
        farrowEvents.some((event) =>
          isSameDay(event.actualFarrowDate || event.expectedDate, date)
        ),
      overdue: (date: Date) =>
        farrowEvents.some(
          (event) =>
            !event.actualFarrowDate &&
            isSameDay(event.expectedDate, date) &&
            event.isOverdue
        ),
      hasSaleableEvent: (date: Date) =>
        saleableEvents.some((event) => {
          if (event.soldDate) return isSameDay(event.soldDate, date);
          return isSameDay(event.saleableDate, date);
        }),
      saleablePastDue: (date: Date) =>
        saleableEvents.some(
          (event) =>
            !event.soldDate &&
            isSameDay(event.saleableDate, date) &&
            event.isPastDue
        ),
    }),
    [farrowEvents, saleableEvents]
  );

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <TopBar title="กำหนดการ" />
      <main className="space-y-4 p-4 pt-0 md:pb-8 md:p-8">
        <div className="grid grid-cols-1 gap-8">
          <div className="lg:col-span-1">
            <div className="p-1 bg-white rounded-2xl overflow-hidden">
              <Calendar
                mode="single"
                disabled={loading}
                numberOfMonths={1}
                selected={selectedDate}
                onSelect={handleDateSelect}
                defaultMonth={new Date()}
                className={cn(
                  "w-full flex justify-center",
                  loading && "animate-pulse"
                )}
                modifiers={calendarModifiers}
                modifiersClassNames={{
                  hasEvent: "bg-primary text-white",
                  overdue: "bg-primary/50 text-white",
                  hasSaleableEvent: "bg-lime-500 text-white",
                  saleablePastDue: "bg-lime-500/50 text-white",
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Skeleton className="w-48 h-8" />
                  <Skeleton className="w-full h-32 rounded-xl" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="w-48 h-8" />
                  <Skeleton className="w-full h-32 rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">
                  {selectedDate?.toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <div className="space-y-2">
                  {selectedDateEvents.farrow.length > 0 && (
                    <div>
                      <FarrowEventList
                        events={selectedDateEvents.farrow}
                        onSuccess={refetch}
                      />
                    </div>
                  )}
                  {selectedDateEvents.saleable.length > 0 && (
                    <div>
                      <SaleableEventList
                        events={selectedDateEvents.saleable}
                        onSuccess={refetch}
                      />
                    </div>
                  )}
                  {selectedDateEvents.farrow.length === 0 &&
                    selectedDateEvents.saleable.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 border-gray-200">
                        <p className="text-muted-foreground">
                          ไม่มีรายการในวันที่นี้
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
