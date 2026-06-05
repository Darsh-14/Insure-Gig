const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const useRazorpay = () => {
    const isConfigured = Boolean(RAZORPAY_KEY_ID);

    const openPayment = async ({
        amount,
        name,
        description,
        onSuccess,
        onFailure
    }: {
        amount: number;
        name: string;
        description: string;
        onSuccess: (paymentId: string) => void;
        onFailure: (error: Error) => void;
    }) => {
        const isLoaded = await loadRazorpayScript();

        if (!isLoaded) {
            onFailure(new Error("Failed to load Razorpay SDK. Please check your internet connection."));
            return;
        }

        if (!isConfigured) {
            onFailure(new Error("Razorpay key is missing. Add VITE_RAZORPAY_KEY_ID and restart the app."));
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: amount * 100, // Razorpay uses paise
            currency: "INR",
            name: "InsureGig",
            description: description,
            config: {
                display: {
                    sequence: ["upi", "card", "netbanking", "wallet"],
                    preferences: {
                        show_default_blocks: true,
                    },
                },
            },
            handler: function (response: any) {
                onSuccess(response.razorpay_payment_id);
            },
            prefill: {
                name: name,
                email: "",
                contact: ""
            },
            theme: {
                color: "#009AFD"
            }
        };

        const paymentObject = new (window as any).Razorpay(options);

        paymentObject.on("payment.failed", function (response: any) {
            onFailure(new Error(response.error.description || "Payment failed"));
        });

        paymentObject.open();
    };

    return { openPayment, isConfigured };
};
