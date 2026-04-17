import { headers } from "next/headers";
import OfficeClientLayout from "@/components/layouts/OfficeLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "Super Admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <OfficeClientLayout>{children}</OfficeClientLayout>;
}
