import { headers } from "next/headers";
import ManagementClientLayout from "@/components/layouts/ManagementLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "Super Admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <ManagementClientLayout>{children}</ManagementClientLayout>;
}
