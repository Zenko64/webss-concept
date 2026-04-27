ALTER TABLE "rooms" DROP CONSTRAINT "rooms_owner_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_rooms" DROP CONSTRAINT "users_rooms_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_rooms" DROP CONSTRAINT "users_rooms_room_id_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_rooms" ADD CONSTRAINT "users_rooms_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_rooms" ADD CONSTRAINT "users_rooms_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;