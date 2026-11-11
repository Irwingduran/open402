import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { CLERK_ENABLED } from "../../../lib/clerk";

export default function SignInPage() {
  if (!CLERK_ENABLED) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
