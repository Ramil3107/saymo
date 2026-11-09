import { redirect } from "next/navigation";
import { getUser } from "@/features/auth";

export default async function RootPage() {
  redirect((await getUser()) ? "/home" : "/sign-in");
}
