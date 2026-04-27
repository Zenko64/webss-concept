import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import schemas from "@webss/types";
import type z from "zod";
import { useRoomMutation } from "@/hooks/queries/room";

const schema = schemas.roomData.pick({ name: true });

export function useRoomForm() {
  const { mutateAsync } = useRoomMutation();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "" },
  });

  const submit = async (payload: z.infer<typeof schema>) => {
    await mutateAsync(payload);
    form.reset();
  };

  return { form, submit };
}
