import { useStatus } from "@powersync/react-native";

export const useOnline = () => useStatus().connected;
