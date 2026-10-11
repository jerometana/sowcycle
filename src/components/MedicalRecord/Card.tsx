import { Card, CardContent } from "@/components/ui/card";
import DialogComponent from "../DrawerDialog";
import { Syringe, Activity, ChevronRight, Asterisk } from "lucide-react";
import { MedicalRecordForm } from "./Form";
import { MedicalRecord, Medicine } from "@sowcycle/core";
import InfoIcon from "../InfoIcon";
import { formatDateTH } from "@/lib/utils";

export default function MedicalRecordCard({
  medicalRecord,
  index,
}: {
  medicalRecord: MedicalRecord & { medicines: Medicine };
  index: number;
}) {
  if (!medicalRecord) return null;
  return (
    <DialogComponent
      title="แก้ไขประวัติใช้ยา"
      dialogTriggerButton={
        <Card>
          <CardContent className="p-4 space-y-6">
            <div className="flex justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">
                  {medicalRecord.medicines?.title ||
                    medicalRecord.medicine ||
                    "ไม่ระบุ"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateTH(medicalRecord.used_at, true, true, true)}
                </p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <InfoIcon label="อาการ" icon={<Activity size={22} />}>
                  {medicalRecord?.symptoms
                    ? medicalRecord.symptoms
                    : "ไม่มีข้อมูล"}
                </InfoIcon>
                {/* {medicalRecord?.medicines && (
                  <div className="p-3 bg-muted rounded-xl">
                    <InfoIcon
                      label="ยาที่ใช้"
                      icon={<Syringe size={22} />}
                      className="!bg-white"
                    >
                      <span className="flex flex-col">
                        <span>{medicalRecord.medicines.title}</span>
                        <span className="text-muted-foreground">
                          {medicalRecord.medicines.description}
                        </span>
                      </span>
                    </InfoIcon>
                  </div>
                )} */}
                {medicalRecord?.medicine && (
                  <InfoIcon label="ยาที่ใช้" icon={<Syringe size={22} />}>
                    {medicalRecord.medicine}
                  </InfoIcon>
                )}
                {medicalRecord.notes && (
                  <InfoIcon label="หมายเหตุ" icon={<Asterisk size={22} />}>
                    {medicalRecord.notes}
                  </InfoIcon>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <MedicalRecordForm medicalRecord={medicalRecord} />
    </DialogComponent>
  );
}
