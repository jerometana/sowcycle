import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/DatePicker";
import { cn, formatDateTH } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { LitterFormData } from "@sowcycle/core";

interface FatteningSectionProps {
  form: UseFormReturn<LitterFormData>;
  calculatedSaleableDate?: Date;
}

export function FatteningSection({
  form,
  calculatedSaleableDate,
}: FatteningSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="fattening_at"
        render={({ field }) => (
          <FormItem className="flex flex-col w-full">
            <FormLabel>เริ่มขุนเมื่อ</FormLabel>
            <DatePicker field={field} />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormItem className="flex flex-col w-full">
        <FormLabel>จะพร้อมขายช่วง</FormLabel>
        <FormControl>
          <Button
            variant={"outline"}
            disabled
            size="lg"
            className={cn(
              "w-full px-4 text-base text-left font-normal",
              !calculatedSaleableDate && "text-muted-foreground"
            )}
          >
            {calculatedSaleableDate ? (
              formatDateTH(calculatedSaleableDate.toISOString())
            ) : (
              <span>เลือกวันที่เริ่มขุน</span>
            )}
            <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
          </Button>
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
}
