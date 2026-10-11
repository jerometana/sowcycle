import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { LitterFormData } from "@sowcycle/core";

interface PigletsSectionProps {
  form: UseFormReturn<LitterFormData>;
  totalBornPiglets: number;
}

export function PigletsSection({ form, totalBornPiglets }: PigletsSectionProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm">จำนวนลูกหมู</p>
      <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="piglets_male_born_alive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ตัวผู้</FormLabel>
                <FormControl>
                  <Input
                    className="bg-white"
                    type="number"
                    min={0}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="piglets_female_born_alive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ตัวเมีย</FormLabel>
                <FormControl>
                  <Input
                    className="bg-white"
                    type="number"
                    min={0}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel>รวม</FormLabel>
          <FormControl>
            <Input
              className="bg-white"
              type="number"
              disabled
              value={totalBornPiglets}
              min={0}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>
    </div>
  );
}