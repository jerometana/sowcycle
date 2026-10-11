"use client";

import {
  createMedicine,
  deleteMedicine,
  updateMedicine,
} from "@/services/medicine";
import { useMedicineStore } from "@/stores/useMedicineStore";
import { Medicine } from "@sowcycle/core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import DialogComponent from "../DrawerDialog";
import { Check, Loader2, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/stores/useLoading";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  title: z.string().nonempty("กรุณากรอกชื่อยาหรือวัคซีน"),
  description: z.string().optional(),
  stock_count: z.coerce.number().optional(),
});

export default function MedicineForm({ editingMedicine, setDialog }: any) {
  const [medicine, setMedicine] = useState<Medicine>({} as Medicine);
  const { setIsLoading } = useLoading();
  const {
    addMedicine,
    updateMedicine: updateMedicineState,
    removeMedicine,
  } = useMedicineStore();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingMedicine?.title || "",
      description: editingMedicine?.description || "",
      stock_count: editingMedicine?.stock_count || 0,
    },
  });

  const handleCreateMedicine = async (
    medicine: Medicine,
    values: z.infer<typeof formSchema>
  ) => {
    let res = await createMedicine({
      ...medicine,
      ...values,
      stock_count: Number(values.stock_count),
    });
    if (res) {
      addMedicine(res);
      form.reset();
      toast({
        title: "เพิ่มข้อมูลเรียบร้อย",
        description: "ข้อมูลของยาถูกเพิ่มเรียบร้อยแล้ว",
      });
      setDialog(false);
    }
  };

  const handleUpdateMedicine = async (
    medicine: Medicine,
    values: z.infer<typeof formSchema>
  ) => {
    let data: any = {
      ...medicine,
      ...values,
      updated_at: new Date().toISOString(),
      stock_count: Number(values.stock_count),
      medical_records: undefined,
    };
    let res = await updateMedicine(data);
    if (res) {
      updateMedicineState(res);
      toast({
        title: "แก้ไขข้อมูลเรียบร้อย",
        description: "ข้อมูลของยาถูกแก้ไขเรียบร้อยแล้ว",
      });
      setDialog(false);
    }
  };

  const onDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteMedicine(id);
    } catch (err) {
      console.error(`Error deleting medicine: ${err}`);
    } finally {
      setIsLoading(false);
    }

    removeMedicine(id);
    router.push("/medicines");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (editingMedicine) {
      await handleUpdateMedicine(medicine, values);
      return;
    }
    await handleCreateMedicine(medicine, values);
  };

  useEffect(() => {
    if (editingMedicine) {
      setMedicine(editingMedicine);
    }
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อยาหรือวัคซีน</FormLabel>
              <FormControl>
                <Input placeholder="พิมพ์ชื่อยาหรือวัคซีน" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>คำอธิบาย</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="เขียนอธิบายยาหรือวัคซีน"
                  className="bg-white resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stock_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>จำนวนที่มี</FormLabel>
              <FormControl>
                <Input type="number" placeholder="กรอกจำนวนที่มี" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between w-full gap-2">
          {medicine.id && (
            <DialogComponent
              title="ลบยา"
              dialogTriggerButton={
                <Button
                  disabled={form.formState.isSubmitting}
                  variant="ghost"
                  size="lg"
                  className="text-red-500 hover:text-red-500"
                >
                  <Trash /> ลบ
                </Button>
              }
            >
              <p>
                คุณแน่ใจหรือไม่ที่จะลบยานี้{" "}
                <span className="font-bold">{medicine.title}</span>
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => onDelete(medicine.id)}
                >
                  <Trash /> ลบ
                </Button>
              </div>
            </DialogComponent>
          )}
          <Button
            disabled={form.formState.isSubmitting}
            size="lg"
            className="w-full"
            type="submit"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                กำลังบันทึก
              </>
            ) : (
              <>
                <Check />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
