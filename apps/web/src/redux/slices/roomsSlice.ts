import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RoomListItem } from "@webss/types";

export interface RoomsState {
  list: RoomListItem[];
  loading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  list: [],
  loading: true,
  error: null,
};

const roomsSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    
    setRooms: (state, action: PayloadAction<RoomListItem[]>) => {
      state.list = action.payload;
      state.loading = false;
      state.error = null;
    },
    addRoom: (state, action: PayloadAction<RoomListItem>) => {
      state.list.push(action.payload);
    },
    updateRoom: (state, action: PayloadAction<RoomListItem>) => {
      const idx = state.list.findIndex((r) => r.nanoid === action.payload.nanoid);
      if (idx === -1) {
        state.list.push(action.payload);
        return;
      }
      state.list[idx] = action.payload;
    },
    removeRoom: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((r) => r.nanoid !== action.payload);
    },
    setRoomsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setRooms,
  addRoom,
  updateRoom,
  removeRoom,
  setRoomsError,
} = roomsSlice.actions;
export default roomsSlice.reducer;
