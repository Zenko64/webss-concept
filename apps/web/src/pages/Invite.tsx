import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import client, { assertOk } from "@/lib/client";
import { useJoinInviteMutation } from "@/hooks/queries/invites";
import { fetchRooms } from "@/socket/manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";

export default function Invite() {
  const { secret } = useParams<{ secret: string }>();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const { data: room, isLoading, error } = useQuery({
    queryKey: ["invite", secret],
    queryFn: async () => {
      const res = await client.api.invite[":secret"].$get({
        param: { secret: secret! },
      });
      assertOk(res);
      return res.json();
    },
    enabled: !!secret,
  });

  const joinMutation = useJoinInviteMutation();

  const handleJoin = async () => {
    if (!session) {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: `/invite/${secret}`,
      });
      return;
    }

    joinMutation.mutate(secret!, {
      onSuccess: () => {
        fetchRooms();
        navigate("/");
      },
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const memberCount = Object.keys(room.users).length;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{room.name}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <Users className="size-3" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session && (
            <p className="text-sm text-muted-foreground">
              You need to sign in before joining.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : session ? (
              "Join Room"
            ) : (
              "Sign in to Join"
            )}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
