import schemas from "@webss/types";
import type z from "zod";

const { roomData, roomScreens, roomUsers } = schemas;
export type RoomData = z.infer<typeof roomData>;
export type RoomUserData = z.infer<typeof roomUsers>;
export type RoomScreenData = z.infer<typeof roomScreens>;
