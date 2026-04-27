import client, { assertOk } from "@/lib/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { InferResponseType } from "hono";

type ListInvitesResponse = InferResponseType<
  typeof client.api.invite.$get
>;

export function useListInvitesQuery(roomNanoid: string, enabled = true) {
  return useQuery<ListInvitesResponse>({
    queryKey: ["invites", roomNanoid],
    queryFn: async () => {
      const res = await client.api.invite.$get({
        query: { roomNanoid },
      });
      assertOk(res);
      return res.json();
    },
    enabled,
  });
}

export function useCreateInviteMutation(roomNanoid: string) {
  return useMutation({
    mutationFn: async (expiration: number | undefined) => {
      const res = await client.api.invite.$post({
        json: { roomNanoid, expiration },
      });
      assertOk(res);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Invite created.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useJoinInviteMutation() {
  return useMutation({
    mutationFn: async (secret: string) => {
      const res = await client.api.invite[":secret"].join.$post({
        param: { secret },
      });
      assertOk(res);
      return res.json();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteInviteMutation() {
  return useMutation({
    mutationFn: async (secret: string) => {
      const res = await client.api.invite[":secret"].$delete({
        param: { secret },
      });
      assertOk(res);
    },
    onSuccess: () => {
      toast.success("Invite deleted.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
