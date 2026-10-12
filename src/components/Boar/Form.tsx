"use client";

import { createBoar, deleteBoar, updateBoar } from "@/services/boar";
import { useBoarStore } from "@/stores/useBoarStore";
import { Boar } from "@sowcycle/core";
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
  breed: z.string().nonempty("กรุณากรอกสายพันธุ์"),
  description: z.string().optional(),
});

export default function BoarForm({ editingBoar, setDialog }: any) {
  const [boar, setBoar] = useState<Boar>({} as Boar);
  const { setIsLoading } = useLoading();
  const { addBoar, updateBoar: updateBoarState, removeBoar } = useBoarStore();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      breed: editingBoar?.breed || "",
      description: editingBoar?.description || "",
    },
  });

  const handleCreateBoar = async (
    boar: Boar,
    values: z.infer<typeof formSchema>
  ) => {
    let res = await createBoar({ ...boar, ...values });
    if (res) {
      addBoar(res);
      form.reset();
      toast({
        title: "เพิ่มข้อมูลเรียบร้อย",
        description: "ข้อมูลของสายพันธุ์ถูกเพิ่มเรียบร้อยแล้ว",
      });
      setDialog(false);
    }
  };

  const handleUpdateBoar = async (
    boar: Boar,
    values: z.infer<typeof formSchema>
  ) => {
    let data: any = {
      ...boar,
      ...values,
      updated_at: new Date().toISOString(),
      breedings: undefined,
      medical_records: undefined,
    };
    let res = await updateBoar(data);
    if (res) {
      updateBoarState(res);
      toast({
        title: "แก้ไขข้อมูลเรียบร้อย",
        description: "ข้อมูลของสายพันธุ์ถูกแก้ไขเรียบร้อยแล้ว",
      });
    }
  };

  const onDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteBoar(id);
    } catch (err) {
      console.error(`Error deleting boar: ${err}`);
    } finally {
      setIsLoading(false);
    }

    removeBoar(id);
    router.push("/boars");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (editingBoar) {
      await handleUpdateBoar(boar, values);
      return;
    }
    await handleCreateBoar(boar, values);
  };

  useEffect(() => {
    if (editingBoar) {
      setBoar(editingBoar);
    }
  }, []);

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="breed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>สายพันธุ์</FormLabel>
              <FormControl>
                <Input placeholder="พิมพ์ชื่อสายพันธุ์" {...field} />
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
                  placeholder="เขียนอธิบายสายพันธุ์"
                  className="bg-white resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between w-full gap-2">
          {boar.id && (
            <DialogComponent
              title="ลบสายพันธุ์"
              dialogTriggerButton={
                <Button
                  type="button"
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
                คุณแน่ใจหรือไม่ที่จะลบสายพันธุ์{" "}
                <span className="font-bold">{boar.breed}</span>
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => onDelete(boar.id)}
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
