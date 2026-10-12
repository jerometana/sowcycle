"use client";

import { Boar } from "@sowcycle/core";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronRight, Dna } from "lucide-react";
import DialogComponent from "../DrawerDialog";
import BoarDetailsCard from "./DetailsCard";
import { Button } from "../ui/button";
import BoarForm from "./Form";

export default function BoarCard({ boar }: { boar: Boar }) {
  return (
    <DialogComponent
      title={`${boar.breed}`}
      dialogTriggerButton={
        <div className="w-full cursor-pointer">
          <Card className="bg-secondary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{boar.breed}</h3>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
              <p className="mt-4 text-muted-foreground">
                {boar.description || "ไม่มีคำอธิบาย"}
              </p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <BoarForm editingBoar={boar} />
    </DialogComponent>
  );
}
