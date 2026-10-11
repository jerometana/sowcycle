import { Button } from "@/components/ui/button";
import DialogComponent from "@/components/DrawerDialog";
import SowForm from "@/components/Sow/Form";
import { Sow } from "@sowcycle/core";
import { Pen, PiggyBankIcon } from "lucide-react";

interface SowHeaderProps {
  sow: Sow;
}

export default function SowHeader({ sow }: SowHeaderProps) {
  return (
    <div className="flex justify-between mb-4">
      <div className="relative">
        <h1 className="text-2xl inline-flex items-center gap-3">
          <PiggyBankIcon size={32} className="inline" />
          {sow.name}
        </h1>
        {sow.is_active && (
          <div>
            <div className="absolute top-0 -right-3 w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <div className="absolute top-0 -right-3 w-2 h-2 rounded-full bg-green-500" />
          </div>
        )}
      </div>
      <div className="flex">
        <DialogComponent
          title="แก้ไขแม่พันธุ์"
          dialogTriggerButton={
            <Button variant={"ghost"}>
              <Pen /> แก้ไขแม่พันธุ์
            </Button>
          }
        >
          <SowForm editingSow={sow} />
        </DialogComponent>
      </div>
    </div>
  );
}