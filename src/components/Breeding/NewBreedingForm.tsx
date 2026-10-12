import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Heart, Loader2 } from "lucide-react";
import { expectedFarrowDate, Breeding, newBreedingFormSchema, NewBreedingFormData } from "@sowcycle/core";
import { useBreedingOperations } from "@/hooks/useBreedingOperations";
import { 
  SowSelectField, 
  BoarSelectField, 
  BreedDateField, 
  ExpectedFarrowDateField 
} from "./FormFields";
import DeleteDialog from "./DeleteDialog";

interface NewBreedingFormProps {
  id?: string;
  breeding?: Breeding;
  setDialog?: (open: boolean) => void;
}

export function NewBreedingForm({ id, breeding, setDialog }: NewBreedingFormProps) {
  const { createBreeding, updateBreeding } = useBreedingOperations();

  const form = useForm<NewBreedingFormData>({
    resolver: zodResolver(newBreedingFormSchema),
    defaultValues: breeding
      ? {
          sow_id: breeding.sow_id.toString(),
          boar_id: breeding.boars?.id || null,
          breed_date: new Date(breeding.breed_date),
        }
      : {
          sow_id: id,
          boar_id: null,
          breed_date: new Date(),
        },
  });

  const expectedDate = useMemo(() => {
    const breedDate = form.watch("breed_date");
    if (!breedDate) return undefined;
    
    return expectedFarrowDate(breedDate);
  }, [form.watch("breed_date")]);

  const onSubmit = async (values: NewBreedingFormData) => {
    try {
      const breedingData = {
        sow_id: Number(values.sow_id),
        boar_id: values.boar_id,
        breed_date: values.breed_date.toISOString(),
        expected_farrow_date: expectedDate!.toISOString(),
      };

      if (breeding) {
        await updateBreeding({ ...breeding, ...breedingData });
      } else {
        await createBreeding(breedingData);
      }
      
      setDialog?.(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SowSelectField form={form} disabled={!!breeding?.id} />
        <BoarSelectField form={form} disabled={form.formState.isSubmitting} />

        <div className="flex w-full gap-2">
          <BreedDateField form={form} />
          <ExpectedFarrowDateField expectedDate={expectedDate} />
        </div>

        <div className={cn(
          breeding ? "justify-between" : "justify-end",
          "w-full flex"
        )}>
          {breeding && (
            <DeleteDialog
              isSubmitting={form.formState.isSubmitting}
              breeding={breeding}
              setDialog={setDialog}
            />
          )}
          <Button disabled={form.formState.isSubmitting} size="lg" className="w-full" type="submit">
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                กำลังบันทึก
              </>
            ) : breeding ? (
              <>
                <Check />
                บันทึก
              </>
            ) : (
              <>
                <Heart />
                เพิ่มประวัติผสม
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}