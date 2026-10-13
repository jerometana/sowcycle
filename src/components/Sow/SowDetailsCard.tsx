import { Card, CardContent, CardHeader } from "@/components/ui/card";
import InfoIcon from "@/components/InfoIcon";
import CountdownBadge from "@/components/CountdownBadge";
import PigletCountChart from "@/components/Sow/PigletCountChart";
import AvgWeightChart from "@/components/Sow/AvgWeightChart";
import { formatDateTH, getSoldLitters } from "@/lib/utils";
import { Sow, Breeding, Litter, Boar, countsTowardLitterStats } from "@sowcycle/core";
import {
  ArrowDown,
  Cake,
  ChevronRight,
  Dna,
  HandHeart,
  Heart,
  Home,
  Milk,
  Pen,
  PiggyBank,
  X,
} from "lucide-react";
import DialogComponent from "../DrawerDialog";
import BoarDetailsCard from "../Boar/DetailsCard";
import { Button } from "../ui/button";
import SowForm from "./Form";

interface SowDetailsCardProps {
  sow: Sow & { boars: Boar[] };
  breedings: Breeding[];
  litters: Litter[];
  averagePigletsBornCount: number;
  averageWeightChart: number;
}

export default function SowDetailsCard({
  sow,
  breedings,
  litters,
  averagePigletsBornCount,
  averageWeightChart,
}: SowDetailsCardProps) {
  const validBreedingsCount = breedings.filter(
    countsTowardLitterStats).length;

  const soldLittersCount = getSoldLitters(litters).length;

  return (
    <div className="!mt-4 space-y-2">
      <Card>
        {/* <CardHeader><p className="font-bold">รายละเอียด</p></CardHeader> */}
        <CardContent className="pt-4">
          <div className="flex flex-col gap-6">
            <InfoIcon
              label="สถานะ"
              icon={
                sow.is_active ? (
                  sow.is_available ? (
                    <PiggyBank size={22} />
                  ) : (
                    <Heart size={22} />
                  )
                ) : (
                  <X size={22} />
                )
              }
              className="text-muted-foreground"
            >
              {sow.is_active ? (
                sow.is_available ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    พร้อมผสม
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-primary">
                      ตั้งครรภ์
                    </span>
                    <CountdownBadge date={breedings[0]?.expected_farrow_date} />
                  </span>
                )
              ) : (
                <span>ไม่อยู่</span>
              )}
            </InfoIcon>

            <InfoIcon
              label="จำนวนเต้านม"
              icon={<Milk size={22} />}
              className="text-muted-foreground"
            >
              {sow.breasts_count ? sow.breasts_count + " เต้า" : "-"}
            </InfoIcon>

            <InfoIcon
              label="วันเกิด"
              icon={<Cake size={22} />}
              className="text-muted-foreground"
            >
              {sow.birth_date ? (
                <>
                  {formatDateTH(sow.birth_date)}{" "}
                  <span className="text-muted-foreground">
                    (
                    {`อายุ 
                  ${Math.floor(
                    (new Date().getTime() -
                      new Date(sow.birth_date!).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )} วัน`}
                    )
                  </span>
                </>
              ) : (
                "-"
              )}
            </InfoIcon>

            <InfoIcon
              label="รับเข้าเมื่อ"
              icon={<Home size={22} />}
              className="text-muted-foreground"
            >
              {sow.add_date ? formatDateTH(sow.add_date) : "-"}
            </InfoIcon>

            <div className="flex flex-col gap-2">
              {sow.boars.length > 0 ? (
                sow.boars.map((boar, index) => (
                  <DialogComponent
                    key={boar?.id || index}
                    title={boar.breed}
                    dialogTriggerButton={
                      <div className="flex gap-4 p-3 bg-muted rounded-xl cursor-pointer">
                        <InfoIcon
                          label="สายพันธุ์"
                          icon={<Dna size={22} />}
                          className="text-muted-foreground !bg-white"
                        >
                          {boar.breed || "ไม่ระบุ"}
                        </InfoIcon>
                        <ChevronRight
                          size={20}
                          className="ml-auto text-muted-foreground"
                        />
                      </div>
                    }
                  >
                    <BoarDetailsCard boar={boar} />
                  </DialogComponent>
                ))
              ) : (
                <div className="flex flex-col gap-4 p-3 bg-muted rounded-xl">
                  <InfoIcon
                    label="สายพันธุ์"
                    icon={<Dna size={22} />}
                    className="text-muted-foreground !bg-white"
                  >
                    ไม่ระบุ
                  </InfoIcon>
                </div>
              )}
            </div>
            <DialogComponent
              title="แก้ไขแม่พันธุ์"
              dialogTriggerButton={
                <Button size="lg" variant={"secondary"} className="w-full">
                  <Pen /> แก้ไขแม่พันธุ์
                </Button>
              }
            >
              <SowForm editingSow={sow} />
            </DialogComponent>
          </div>
        </CardContent>
      </Card>
      {validBreedingsCount > 1 && (
        <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              จำนวนลูกเกิดรอดเฉลี่ย
            </p>
            <p className="text-xl font-semibold">
              {averagePigletsBornCount} ตัว
            </p>
          </div>
          <PigletCountChart breedings={breedings} />
        </div>
      )}

      {soldLittersCount > 1 && (
        <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">น้ำหนักขายเฉลี่ย</p>
            <p className="text-xl font-semibold">
              {averageWeightChart} กิโลกรัม
            </p>
          </div>
          <AvgWeightChart litters={litters} />
        </div>
      )}
    </div>
  );
}
