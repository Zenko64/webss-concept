import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const selectRoomState = (state: RootState) => state.room;

export const selectRoomData = createSelector([selectRoomState], (r) => r.data);

export const selectScreens = createSelector(
  [selectRoomData],
  (data) => data?.screens ?? {}
);

export const selectRoomUsers = createSelector(
  [selectRoomData],
  (data) => data?.users ?? {}
);

export const selectRoomNanoid = createSelector(
  [selectRoomData],
  (data) => data?.nanoid ?? null
);
