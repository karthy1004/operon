import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getCustomerByUserId, getCustomerDashboardData } from "@/lib/domain/customer-queries";
import { CustomerDashboardClient } from "./customer-dashboard-client";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const customer = await getCustomerByUserId(user.id);

  if (!customer) {
    redirect("/welcome");
  }

  const { applications } = await getCustomerDashboardData(customer.id);

  return (
    <CustomerDashboardClient
      customerName={user.firstName || "there"}
      applications={applications}
    />
  );
}
