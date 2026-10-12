import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DialogComponent from "@/components/DrawerDialog";
import { useLitterStore } from "@/stores/useLitterStore";
import { useSowStore } from "@/stores/useSowStore";
import { deleteLitter } from "@/services/litter";
import { patchSow } from "@/services/sow";
import { Litter } from "@sowcycle/core";

interface DeleteDialogProps {
  litter: Litter;
  isSubmitting: boolean;
  setDialog?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function DeleteDialog({
  litter,
  isSubmitting,
  setDialog,
  trigger,
}: DeleteDialogProps) {
  const { toast } = useToast();
  const { removeLitter } = useLitterStore();
  const { updateSow } = useSowStore();

  const handleDelete = async () => {
    try {
      const res = await deleteLitter(litter.id!);

      if (res) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบข้อมูลครอกเรียบร้อย",
        });

        removeLitter(res.id);

        if (!res.birth_date) {
          const sowPatchResponse = await patchSow({
            id: litter.sow_id,
            is_available: true,
            updated_at: new Date().toISOString(),
          });

          if (sowPatchResponse) {
            toast({
              title: "เพิ่มสำเร็จ",
              description: "เพิ่มประวัติการคลอดเรียบร้อย",
            });
            updateSow(sowPatchResponse);
            setDialog?.(false);
          }
        }
        setDialog?.(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DialogComponent
      title="ลบข้อมูลครอก"
      dialogTriggerButton={
        trigger || (
          <Button
            disabled={isSubmitting}
            variant={"ghost"}
            size="lg"
            className="text-red-500 hover:text-red-500 hover:bg-red-50"
          >
            <Trash /> ลบ
          </Button>
        )
      }
    >
      <p>ต้องการลบข้อมูลครอกนี้หรือไม่</p>
      <div className="flex justify-end gap-2">
        <Button variant={"destructive"} size="lg" onClick={handleDelete}>
          ลบ
        </Button>
      </div>
    </DialogComponent>
  );
}
