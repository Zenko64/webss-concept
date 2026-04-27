import { Outlet, useLocation, Navigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from "../ui/sidebar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus, PlusCircle, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { RoomList } from "../blocks/roomList";
import { Controller } from "react-hook-form";
import { useRoomForm } from "@/hooks/forms/room";
import { Field, FieldError, FieldLabel } from "../ui/field";
import type { Route } from "@/types";
import { NavUser } from "../nav-user";
import { fetchRooms } from "@/socket/manager";
import { useState } from "react";

export function Layout({ routes }: { routes?: Route[] }) {
  const { data, isPending } = authClient.useSession();
  const { form, submit } = useRoomForm();
  const [query, setQuery] = useState("");
  const path = useLocation();

  const currentRoute = routes?.find((r) => r.path.includes(path.pathname));

  const showSidebar = currentRoute?.sidebar !== false;
  const isPublic = currentRoute?.public === true;

  if (isPending) return null;
  if (!data && !isPublic) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider className="absolute">
      {showSidebar && (
        <Sidebar className="flex flex-col flex-1 h-full justify-between">
          <SidebarHeader>
            <span className="flex flex-row gap-2">
              <Input 
                placeholder="Search..." 
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  fetchRooms(e.target.value);
                }}
              />
              <Dialog>
                <DialogTrigger
                  render={
                    <Button size="icon">
                      <PlusCircle />
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Room</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field className="gap-1.5">
                          <FieldLabel className="ml-1.25">Room Name</FieldLabel>
                          <Input
                            placeholder="Room Name"
                            {...field}
                          />
                          {fieldState.invalid && (
                            <FieldError
                              className="ml-2"
                              errors={[fieldState.error]}
                            />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button variant="outline">
                          <X /> Cancel
                        </Button>
                      }
                    />
                    <Button
                      onClick={() => form.handleSubmit(submit)()}
                      disabled={!form.formState.isValid}
                    >
                      <Plus />
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </span>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent className="overflow-hidden">
            <RoomList />
          </SidebarContent>
          <SidebarFooter className="flex flex-row">
            <NavUser
              user={{
                avatar: data?.user?.image || undefined,
                name: data?.user?.name || undefined,
                email: data?.user?.email || undefined,
              }}
            />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
      )}
      <main className="h-svh flex flex-col flex-1 overflow-hidden">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
