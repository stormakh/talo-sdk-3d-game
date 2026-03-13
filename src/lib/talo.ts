import { TaloClient } from "talo-pay";

export const talo = new TaloClient({
  clientId: process.env.TALO_CLIENT_ID!,
  clientSecret: process.env.TALO_CLIENT_SECRET!,
  userId: process.env.TALO_USER_ID!,
  environment: (process.env.TALO_ENVIRONMENT as "sandbox" | "production") ?? "sandbox",
});
