import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RoomData } from "@webss/types";

export interface RoomState {
  data: RoomData | null;
  requestedNanoid: string | null;
  error: string | null;
}

const initialState: RoomState = {
  data: null,
  requestedNanoid: null,
  error: null,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    requestRoom: (state, action: PayloadAction<string>) => {
      state.requestedNanoid = action.payload;
      state.data = null;
      state.error = null;
    },
    setRoom: (state, action: PayloadAction<RoomData>) => {
      if (state.requestedNanoid !== action.payload.nanoid) return;
      state.data = action.payload;
      state.error = null;
    },
    clearRoom: (state) => {
      state.data = null;
      state.requestedNanoid = null;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { requestRoom, setRoom, clearRoom, setError } = roomSlice.actions;
export default roomSlice.reducer;
