import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "./slices/roomSlice";
import roomsReducer from "./slices/roomsSlice";

export const store = configureStore({
  reducer: {
    room: roomReducer,
    rooms: roomsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
