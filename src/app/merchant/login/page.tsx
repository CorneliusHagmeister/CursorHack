import { MerchantLoginForm } from "@/components/MerchantLoginForm";
import { safeMerchantNext, usingDemoMerchantPassword } from "@/lib/merchant-auth";

export const metadata = { title: "Merchant sign in · Indigo Lane" };

export default async function MerchantLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-stone-900">Sign in to the merchant desk</h1>
      <MerchantLoginForm next={safeMerchantNext(next)} demo={usingDemoMerchantPassword()} />
    </div>
  );
}
