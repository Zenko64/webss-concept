"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Copy, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useListInvitesQuery,
  useCreateInviteMutation,
  useDeleteInviteMutation,
} from "@/hooks/queries/invites";
import { useQueryClient } from "@tanstack/react-query";

const EXPIRATION_PRESETS = {
  "1h": { label: "1 Hour", seconds: 3600 },
  "24h": { label: "24 Hours", seconds: 86400 },
  "7d": { label: "7 Days", seconds: 604800 },
  never: { label: "Never", seconds: undefined },
};

export default function ShareDialogContent({
  roomNanoid,
}: {
  roomNanoid: string;
}) {
  const queryClient = useQueryClient();
  const [expiration, setExpiration] = useState<keyof typeof EXPIRATION_PRESETS>(
    "24h"
  );

  const { data: invites = [], isLoading } = useListInvitesQuery(roomNanoid);

  const createMutation = useCreateInviteMutation(roomNanoid);
  const deleteMutation = useDeleteInviteMutation();

  const handleCreateInvite = async () => {
    const expirationSeconds = EXPIRATION_PRESETS[expiration].seconds;
    createMutation.mutate(expirationSeconds, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["invites", roomNanoid],
        });
        setExpiration("24h");
      },
    });
  };

  const handleCopyUrl = (secret: string) => {
    const url = `${window.location.origin}/invite/${secret}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const handleDeleteInvite = (secret: string) => {
    deleteMutation.mutate(secret, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["invites", roomNanoid],
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Create Invite Section */}
      <div className="flex gap-2">
        <Select
          value={expiration}
          onValueChange={(v) => setExpiration(v as keyof typeof EXPIRATION_PRESETS)}
          disabled={createMutation.isPending}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXPIRATION_PRESETS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreateInvite} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
      </div>

      {/* Invites List */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Active Invites</label>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active invites</p>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.secretKey}
                className="flex items-center gap-2 p-2 border rounded text-sm"
              >
                <div className="flex-1 min-w-0">
                  <Input
                    readOnly
                    value={`${window.location.origin}/invite/${invite.secretKey}`}
                    className="text-xs h-8"
                  />
                  {invite.expiresAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires:{" "}
                      {new Date(invite.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyUrl(invite.secretKey)}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteInvite(invite.secretKey)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
