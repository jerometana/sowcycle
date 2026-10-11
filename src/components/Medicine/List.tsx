import { Medicine } from "@sowcycle/core";
import MedicineCard from "../Medicine/Card";
import { FadeIn } from "@/components/animations/FadeIn";

export default function MedicineList({ medicines }: { medicines: Medicine[] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {medicines.length > 0 ? (
        medicines.map((medicine, index) => (
          <FadeIn key={index} delay={index * 0.1} className="w-full">
            <MedicineCard medicine={medicine} />
          </FadeIn>
        ))
      ) : (
        <div className="text-gray-400 my-72">ไม่พบข้อมูล</div>
      )}
    </div>
  );
}
