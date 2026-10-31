import { redirect } from "next/navigation";

import { redirectIfSignedIn } from "./(auth)/_lib/signed-in";

export default async function RootPage() {
  await redirectIfSignedIn();
  redirect("/login");
}
