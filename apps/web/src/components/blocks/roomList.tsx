import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { RoomCard } from "./roomCard";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export function RoomList({ query }: { query?: string }) {
  const rooms = useSelector((state: RootState) => state.rooms.list);
  const isLoading = useSelector((state: RootState) => state.rooms.loading);
  const isError = useSelector((state: RootState) => state.rooms.error);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive">Failed to load rooms.</div>
    );
  }

  if (!rooms?.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No rooms yet.</div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-2">
        {rooms.map((room) => (
          <RoomCard key={room.nanoid} room={room} />
        ))}
      </div>
    </ScrollArea>
  );
}
