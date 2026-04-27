import client, { assertOk } from "@/lib/client";
import socket from "@/lib/socket";
import { useMutation } from "@tanstack/react-query";
import type { InferRequestType } from "hono";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { removeRoom, setRooms } from "@/redux/slices/roomsSlice";

type InputData = InferRequestType<typeof client.api.rooms.$post>["json"];

export function useDeleteRoomMutation() {
  const dispatch = useDispatch();
  const rooms = useSelector((state: RootState) => state.rooms.list);

  return useMutation({
    mutationFn: async (nanoid: string) => {
      const res = await client.api.rooms[":nanoid"].$delete({
        param: { nanoid },
      });
      assertOk(res);
    },
    onMutate: (nanoid) => {
      const previous = rooms;
      dispatch(removeRoom(nanoid));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Room deleted.");
    },
    onError: (err, _, ctx) => {
      if (ctx?.previous) dispatch(setRooms(ctx.previous));
      toast.error(err.message);
    },
  });
}

export function useRoomMutation() {
  return useMutation({
    mutationFn: async (data: InputData) => {
      const res = await client.api.rooms.$post({ json: data });
      assertOk(res);
      return res.json();
    },
    onSuccess: () => {
      socket.emit("fetch-rooms");
      toast.success("Room created.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useLeaveRoomMutation() {
  const dispatch = useDispatch();
  const rooms = useSelector((state: RootState) => state.rooms.list);

  return useMutation({
    mutationFn: async (nanoid: string) => {
      const res = await client.api.rooms[":nanoid"].$delete({
        param: { nanoid },
      });
      assertOk(res);
    },
    onMutate: (nanoid) => {
      const previous = rooms;
      dispatch(removeRoom(nanoid));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Left room.");
    },
    onError: (err, _, ctx) => {
      if (ctx?.previous) dispatch(setRooms(ctx.previous));
      toast.error(err.message);
    },
  });
}
