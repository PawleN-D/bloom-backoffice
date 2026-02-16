import { SubscriptionDetailContainer } from "@/components/features/subscriptions/SubscriptionDetailContainer";

type SubscriptionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { id } = await params;
  return <SubscriptionDetailContainer organizationId={id} />;
}
