import { OrgUserManagerContainer } from "@/components/features/organizations/OrgUserManagerContainer";

export const runtime = "edge";

type OrganizationUsersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationUsersPage({ params }: OrganizationUsersPageProps) {
  const { id } = await params;
  return <OrgUserManagerContainer organizationId={id} />;
}
