import { Boar } from "@sowcycle/core";
import BoarCard from "./Card";
import { FadeIn } from "@/components/animations/FadeIn";

export default function BoarList({ boars }: { boars: Boar[] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {boars.length > 0 ? (
        boars.map((boar, index) => (
          <FadeIn key={index} delay={index * 0.1} className="w-full">
            <BoarCard boar={boar} />
          </FadeIn>
        ))
      ) : (
        <div className="text-gray-400 my-72">ไม่พบข้อมูล</div>
      )}
    </div>
  );
}
