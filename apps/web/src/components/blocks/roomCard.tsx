import type { RoomListItem } from "@webss/types";
import { Edit2, LogOut, Share, Trash2, Users, XIcon } from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { authClient } from "@/lib/auth-client";
import {
  useDeleteRoomMutation,
  useLeaveRoomMutation,
} from "@/hooks/queries/room";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { joinRoom } from "@/socket/manager";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "../ui/avatar";
import { useState } from "react";
import ShareDialogContent from "./shareDialogContent";
import { Controller } from "react-hook-form";

export function RoomCard({ room }: { room: RoomListItem }) {
  const connectedCount = room.users.filter((u) => u.connected).length;

  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.id === room.ownerId;

  const { mutate: deleteRoom, isPending: isDeleting } = useDeleteRoomMutation();
  const { mutate: leaveRoom, isPending: isLeaving } = useLeaveRoomMutation();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const card = (
    <Card
      onClick={() => {
        joinRoom(room.nanoid);
      }}
      className="flex-1 card rounded-[calc(50px-2.5em)] cursor-pointer hover:bg-accent transition-colors"
    >
      <CardHeader>
        <CardTitle className="text-sm">{room.name}</CardTitle>
      </CardHeader>
      <CardFooter className="gap-1 text-xs text-muted-foreground">
        <Users className="size-3" />
        {connectedCount}Online
        <AvatarGroup className="w-7 h-7 p-0 m-0 bg-none border-none outline-none *:data-[slot=avatar]:ring-0">
          {room.users.slice(0, 5).map((u) => (
            <Avatar
              key={u.userId}
              className={`${u.connected && "bg-none outline-primary outline"}`}
            >
              <AvatarImage src={u.image || undefined} />
              <AvatarFallback>{u.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
          ))}
          {room.users.length > 5 && (
            <Avatar className="size-5">
              <AvatarFallback>+{room.users.length - 5}</AvatarFallback>
            </Avatar>
          )}
        </AvatarGroup>
      </CardFooter>
    </Card>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{card}</ContextMenuTrigger>
        <ContextMenuContent>
          {isOwner ? (
            <>
              <ContextMenuItem onClick={() => setShareOpen(true)}>
                <Share className="size-4" /> Share
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="size-4" /> Delete Room
              </ContextMenuItem>
            </>
          ) : (
            <ContextMenuItem
              onClick={() => setLeaveOpen(true)}
              className="text-destructive"
            >
              <LogOut className="size-4" /> Leave Room
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              <span className="block">
                Are you sure you want to delete this room?
              </span>
              <span className="block">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <XIcon className="size-4" /> Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => deleteRoom(room.nanoid)}
            >
              <Trash2 className="size-4" />{" "}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Room</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to leave this room?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <XIcon className="size-4" /> Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLeaving}
              onClick={() => leaveRoom(room.nanoid)}
            >
              <LogOut className="size-4" /> {isLeaving ? "Leaving..." : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Room</DialogTitle>
            <DialogDescription>
              Create and manage invite links for this room.
            </DialogDescription>
          </DialogHeader>
          <ShareDialogContent roomNanoid={room.nanoid} />
        </DialogContent>
      </Dialog>
    </>
  );
}
