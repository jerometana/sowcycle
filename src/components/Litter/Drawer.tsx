"use client";

import { Litter, Sow, litterStage } from "@sowcycle/core";
import { Button } from "../ui/button";
import {
  Check,
  PiggyBank,
  Beef,
  Banknote,
  Gauge,
  Plus,
  Cake,
  ChevronRight,
  Dna,
  Pencil,
  Trash2,
  Clock,
  List,
} from "lucide-react";
import DrawerDialog from "../DrawerDialog";
import { LitterForm } from "./Form";
import { AddToCalendarButton } from "../AddToCalendarButton";
import BoarDetailsCard from "../Boar/DetailsCard";
import { DeleteDialog } from "./DeleteDialog";
import { useMemo } from "react";
import { SowTags } from "../Sow/SowTags";
import { formatDateTH } from "@/lib/utils";
import InfoIcon from "../InfoIcon";
import Link from "next/link";

interface ExtendedLitter extends Litter {
  sows: Sow | undefined;
}

interface LitterDrawerProps {
  litter: ExtendedLitter;
  index: number;
}

export default function LitterDrawer({ litter, index }: LitterDrawerProps) {
  const ageInDays = useMemo(() => {
    const endDate = litter.sold_at ? new Date(litter.sold_at) : new Date();
    const birthDate = new Date(litter.birth_date!);
    return Math.floor(
      (endDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [litter.birth_date, litter.sold_at]);

  const stage = litterStage(litter);

  return (
    <div className="flex flex-col gap-4">
      <InfoIcon icon={<Clock size={24} />} label="อายุ">
        <span className="font-semibold text-gray-900">{ageInDays} วัน</span>
      </InfoIcon>
      <InfoIcon icon={<List size={24} />} label="สถานะ">
        {stage === "sold" ? (
          <span className="font-semibold text-green-600">ขายแล้ว</span>
        ) : stage === "fattening" ? (
          <span className="font-semibold text-orange-500">กำลังขุน</span>
        ) : (
          <span className="font-semibold text-gray-900">คลอดแล้ว</span>
        )}
      </InfoIcon>
      {/* Count Stats */}
      <InfoIcon
        icon={<PiggyBank size={24} />}
        label="จำนวน"
        className="bg-gray-100 rounded-2xl w-12 h-12 flex items-center justify-center"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {litter.piglets_born_count} ตัว
          </span>
          <div className="flex gap-1">
            <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
              ผู้ {litter.piglets_male_born_alive}
            </span>
            <span className="px-2 py-1 text-xs font-semibold text-white bg-primary rounded-full">
              เมีย {litter.piglets_female_born_alive}
            </span>
          </div>
        </div>
      </InfoIcon>

      {/* Weight Stats (Only if Sold) */}
      {stage === "sold" && litter.avg_weight && (
        <InfoIcon
          icon={<Gauge size={24} />}
          label="น้ำหนักขายเฉลี่ย"
          className="bg-gray-100 rounded-2xl w-12 h-12 flex items-center justify-center"
        >
          <span className="font-semibold text-gray-900">
            {litter.avg_weight} kg
          </span>
        </InfoIcon>
      )}

      {/* Parents Info */}
      {/* Sow */}
      {litter.sows && (
        <Link href={`/sows/${litter.sow_id}`}>
          <div className="flex justify-between w-full p-3 bg-secondary rounded-xl">
            <InfoIcon
              icon={<PiggyBank size={24} />}
              label="แม่พันธุ์"
              className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center"
            >
              <span className="font-semibold text-gray-900">
                {litter.sows.name}
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                <SowTags
                  breeds={litter.sows.boars}
                  breastsCount={litter.sows.breasts_count}
                />
              </div>
            </InfoIcon>
            <ChevronRight size={20} className="text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Boar */}
      {litter.boars && (
        <DrawerDialog
          title={litter.boars.breed}
          dialogTriggerButton={
            <div className="flex justify-between w-full p-3 cursor-pointer bg-secondary rounded-xl">
              <div className="flex items-center gap-4">
                <InfoIcon
                  icon={<Dna size={24} />}
                  label="พ่อพันธุ์"
                  className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center"
                >
                  <span className="font-semibold text-gray-900">
                    {litter.boars.breed}
                  </span>
                </InfoIcon>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </div>
          }
        >
          <BoarDetailsCard boar={litter.boars} />
        </DrawerDialog>
      )}

      {/* Timeline */}
      <div className="relative flex flex-col gap-4 p-4 bg-secondary rounded-xl">
        {/* Vertical Line */}
        {stage !== "nursing" && (
          <div className="absolute left-10 top-6 bottom-6 w-[2px] bg-gray-200 -z-0" />
        )}

        {/* Born */}
        <div className="relative flex items-start gap-4">
          <div className="flex flex-col gap-4 justify-center">
            {/* Birthday */}
            <InfoIcon
              icon={<Cake size={24} />}
              label="คลอดเมื่อ"
              className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center"
            >
              <span className="font-semibold text-gray-900">
                {formatDateTH(litter.birth_date!, true, true, true)}
              </span>
            </InfoIcon>

            {/* Fattening */}
            {stage !== "nursing" && (
              <div className="relative">
                <InfoIcon
                  icon={<Beef size={24} />}
                  label="เริ่มขุนเมื่อ"
                  className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center"
                >
                  <span className="font-semibold text-gray-900">
                    {litter.fattening_at
                      ? formatDateTH(litter.fattening_at, true, true, true)
                      : "ไม่ระบุ"}{" "}
                  </span>
                </InfoIcon>
              </div>
            )}

            {/* Sale */}
            {stage !== "nursing" && (
              <div className="relative">
                <InfoIcon
                  icon={<Banknote size={24} />}
                  label={stage === "sold" ? "ขายแล้วเมื่อ" : "กำหนดขาย"}
                  className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center"
                >
                  <span className="font-semibold text-gray-900">
                    {stage === "sold"
                      ? formatDateTH(litter.sold_at!, true, true, true)
                      : formatDateTH(litter.saleable_at!, true, true, true)}
                  </span>
                </InfoIcon>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-3">
        {/* Record Fattening Button */}
        {stage === "nursing" && (
          <DrawerDialog
            title="เพิ่มวันเริ่มขุน"
            dialogTriggerButton={
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" /> เพิ่มวันเริ่มขุน
              </Button>
            }
          >
            <LitterForm litter={litter} mode="fattening" />
          </DrawerDialog>
        )}

        {/* Record Sale Button */}
        {stage === "fattening" && (
          <DrawerDialog
            title="บันทึกวันขาย"
            dialogTriggerButton={
              <Button className="w-full h-12 text-base font-medium text-white bg-lime-500 rounded-full shadow-none hover:bg-[#65a30d]">
                <Check className="w-5 h-5 mr-2" /> บันทึกวันขาย
              </Button>
            }
          >
            <LitterForm litter={litter} mode="sale" />
          </DrawerDialog>
        )}

        {/* Add to Calendar */}
        {stage === "fattening" && litter.saleable_at && (
          <AddToCalendarButton
            title={`กำหนดจับหมูขุน แม่${litter.sows?.name}`}
            startDate={new Date(litter.saleable_at)}
            className="w-full h-12 text-base font-medium"
          />
        )}

        {/* Edit Button */}
        <DrawerDialog
          title="แก้ไขข้อมูล"
          dialogTriggerButton={
            <Button
              variant="secondary"
              className="w-full h-12 text-base font-medium border-gray-200 rounded-full"
            >
              <Pencil className="w-4 h-4 mr-2" /> แก้ไขข้อมูล
            </Button>
          }
        >
          <LitterForm litter={litter} mode="edit" />
        </DrawerDialog>

        {/* Delete Button */}
        {/* <DeleteDialog
          litter={litter}
          isSubmitting={false}
          trigger={
            <Button
              variant="ghost"
              className="w-full h-12 text-base font-medium text-red-500 rounded-full hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" /> ลบข้อมูล
            </Button>
          }
        /> */}
      </div>
    </div>
  );
}
