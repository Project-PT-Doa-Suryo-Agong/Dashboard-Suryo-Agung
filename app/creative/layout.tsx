import { headers } from "next/headers";
import CreativeClientLayout from "@/components/layouts/CreativeLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function CreativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "Super Admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <CreativeClientLayout>{children}</CreativeClientLayout>;
}
