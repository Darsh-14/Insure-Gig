import { useState } from "react";
import { toast } from "sonner";
import { useRazorpay } from "../../hooks/useRazorpay";
import { useTranslation } from "react-i18next";

interface Props {
  premiumAmount: number;
  delivererName?: string;
  period?: string;
  planName?: string;
  onSuccess?: (paymentId: string) => void;
}

export function PayNowButton({
  premiumAmount,
  delivererName = "Gig Worker",
  period = "week",
  planName = "Premium",
  onSuccess,
}: Props) {
  const { openPayment, isConfigured } = useRazorpay();
  const [loadingGateway, setLoadingGateway] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { t } = useTranslation();

  const translatedPeriod = t(period);

  const handleGatewayPay = async () => {
    setLoadingGateway(true);
    await openPayment({
      amount: premiumAmount,
      name: delivererName,
      description: `InsureGig ${planName} Plan - ₹${premiumAmount}/${period}`,
      onSuccess: (paymentId) => {
        setLoadingGateway(false);
        toast.success(t("paymentSuccess", { id: paymentId }));
        if (onSuccess) onSuccess(paymentId);
      },
      onFailure: () => {
        setLoadingGateway(false);
        toast.error(t("paymentFailed"));
      },
    });
  };

  const handleDemoPay = () => {
    setLoadingDemo(true);
    window.setTimeout(() => {
      const paymentId = `demo_pay_${Date.now()}`;
      setLoadingDemo(false);
      toast.success(t("paymentSuccess", { id: paymentId }));
      if (onSuccess) onSuccess(paymentId);
    }, 600);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleGatewayPay}
        disabled={loadingGateway || loadingDemo || !isConfigured}
        className="flex w-full justify-center items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md"
      >
        <span>{loadingGateway ? "..." : "RZP"}</span>
        {loadingGateway
          ? t("openingRazorpay")
          : t("payWithRazorpay", {
              amount: premiumAmount,
              period: translatedPeriod,
            })}
      </button>

      <button
        onClick={handleDemoPay}
        disabled={loadingGateway || loadingDemo}
        className="flex w-full justify-center items-center gap-2 border border-brand-200 bg-white hover:bg-brand-50 disabled:opacity-60 text-brand-700 px-6 py-3 rounded-xl font-semibold transition-all"
      >
        <span>{loadingDemo ? "..." : "Test"}</span>
        {loadingDemo
          ? t("completingDemoPayment")
          : t("useDemoPayment", {
              amount: premiumAmount,
              period: translatedPeriod,
            })}
      </button>

      {!isConfigured && (
        <p className="text-center text-xs text-amber-700">
          Add `VITE_RAZORPAY_KEY_ID` and restart the app to enable the real
          Razorpay window.
        </p>
      )}
    </div>
  );
}
