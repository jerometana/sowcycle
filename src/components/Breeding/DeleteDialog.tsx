import { Button } from "@/components/ui/button";
import DialogComponent from "@/components/DrawerDialog";
import { Trash } from "lucide-react";
import { useBreedingOperations } from "@/hooks/useBreedingOperations";
import { Breeding } from "@sowcycle/core";

interface DeleteDialogProps {
  breeding: Breeding;
  isSubmitting: boolean;
  setDialog?: (open: boolean) => void;
}

export default function DeleteDialog({
  breeding,
  isSubmitting,
  setDialog,
}: DeleteDialogProps) {
  const { deleteBreeding } = useBreedingOperations();

  const handleDelete = async () => {
    try {
      await deleteBreeding(
        breeding.id!,
        breeding.sow_id,
        !!breeding.actual_farrow_date
      );
      setDialog?.(false);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <DialogComponent
      title="ลบประวัติการผสม"
      dialogTriggerButton={
        <Button
          type="button"
          disabled={isSubmitting}
          variant="ghost"
          size="lg"
          className="text-red-500 hover:text-red-500 hover:bg-red-50"
        >
          <Trash /> ลบ
        </Button>
      }
    >
      <p>ต้องการลบข้อมูลการผสมนี้หรือไม่</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="destructive" onClick={handleDelete}>
          ลบ
        </Button>
      </div>
    </DialogComponent>
  );
}
