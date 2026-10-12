import { Heart } from "lucide-react";
import SowList from "@/components/Sow/List";
import { type Sow } from "@sowcycle/core";

interface PregnantSowsSectionProps {
  sows: Sow[];
}

export function PregnantSowsSection({ sows }: PregnantSowsSectionProps) {
  return (
    <div className="space-y-4">
      {/*<div className="flex items-center gap-2">*/}
      {/*<Heart className="h-5 w-5 text-primary" />*/}
      <h2 className="text-xl font-semibold">
        แม่พันธุ์ตั้งครรภ์ ({sows.length})
      </h2>
      {/*</div>*/}

      {sows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Heart className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg font-medium mb-1">
            ไม่มีแม่พันธุ์ตั้งครรภ์
          </p>
          <p className="text-gray-400 text-sm">
            ข้อมูลจะปรากฏที่นี่เมื่อมีแม่พันธุ์ตั้งครรภ์
          </p>
        </div>
      ) : (
        <SowList sows={sows} />
      )}
    </div>
  );
}
