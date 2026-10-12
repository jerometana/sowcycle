import { useEffect, useState } from "react";
import { useLitterStore } from "@/stores/useLitterStore";
// import { useBoarStore } from "@/stores/useBoarStore";
import { getAllLitters } from "@/services/litter";
// import { getAllBoars } from "@/services/boar";

export function useLitterData() {
  const { litters, setLitters } = useLitterStore();
  // const { boars: breeds, setBoars: setBreeds } = useBoarStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // const littersWithBreeds = useMemo(() => {
  //   return addBreedNamesToLitters(litters, breeds);
  // }, [litters, breeds]);

  useEffect(() => {
    fetchLitterData();
  }, [setLitters]);

  async function fetchLitterData() {
    try {
      setIsLoading(true);
      setError(null);

      const littersPromise = getAllLitters();
      // const breedsPromise = !breeds.length
      //   ? getAllBoars()
      //   : Promise.resolve(null);

      const [littersData] = await Promise.all([
        littersPromise,
        // breedsPromise,
      ]);

      // if (breedsData) {
      //   setBreeds(breedsData);
      // }

      setLitters(littersData);
    } catch (error) {
      console.error("Error fetching litters data:", error);
      setError("Failed to fetch litters data");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    litters,
    isLoading,
    error,
  };
}

// function addBreedNamesToLitters(litters: Litter[], breeds: Boar[]) {
//   return litters.map((litter) => {
//     const sowBreedNames = getSowBreedNames(litter.sows, breeds);
//     return {
//       ...litter,
//       sows: {
//         ...litter.sows,
//         breeds: sowBreedNames,
//       },
//     };
//   });
// }

// function getSowBreedNames(sow: Sow | undefined, breeds: Boar[]): string[] {
//   if (!sow?.breed_ids) return [];

//   return sow.breed_ids
//     .map((breedId) => {
//       const breed = breeds.find((b) => b.id === breedId);
//       return breed ? breed.breed : "";
//     })
//     .filter(Boolean);
// }
