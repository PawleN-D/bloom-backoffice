import { OrganizationDetailContainer } from "@/components/features/organizations/OrganizationDetailContainer";

type OrganizationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <OrganizationDetailContainer organizationId={id} initialTab={tab} />;
}
