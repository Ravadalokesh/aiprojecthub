import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { useAppSelector } from "../hooks/useRedux";
import PublicLayout from "../components/PublicLayout";

export default function PricingPage() {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);

  const handleGetStarted = () => {
    if (token) {
      navigate("/dashboard");
    } else {
      const event = new CustomEvent("openSignupModal");
      window.dispatchEvent(event);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for individuals and small teams",
      features: [
        "Up to 5 projects",
        "Up to 10 team members",
        "Basic analytics",
        "Email support",
        "1GB storage",
      ],
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "For growing teams",
      features: [
        "Unlimited projects",
        "Unlimited team members",
        "Advanced analytics",
        "Priority email support",
        "100GB storage",
        "AI-powered insights",
        "Custom integrations",
        "SSO & SAML",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Advanced security",
        "Custom SLA",
        "Unlimited storage",
        "On-premise option",
        "Custom development",
        "24/7 phone support",
      ],
      highlighted: false,
    },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your team. Always pay fairly for what
            you use.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
                  plan.highlighted
                    ? "ring-2 ring-primary-600 shadow-2xl"
                    : "border border-gray-200 shadow-lg"
                }`}
              >
                <div
                  className={`p-8 ${
                    plan.highlighted
                      ? "bg-primary-600 text-white"
                      : "bg-gray-50"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="bg-white text-primary-600 text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                      Most Popular
                    </div>
                  )}
                  <h2
                    className={`text-3xl font-bold mb-2 ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.name}
                  </h2>
                  <p
                    className={`text-sm mb-6 ${
                      plan.highlighted ? "text-primary-100" : "text-gray-600"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span
                      className={`text-4xl font-bold ${
                        plan.highlighted ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={`text-sm ml-2 ${
                          plan.highlighted
                            ? "text-primary-100"
                            : "text-gray-600"
                        }`}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleGetStarted}
                    className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      plan.highlighted
                        ? "bg-white text-primary-600 hover:bg-gray-100"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    Get Started <ArrowRight size={20} />
                  </button>
                </div>

                {/* Features */}
                <div className="p-8 space-y-4">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check
                        className={`text-green-500 mt-1 flex-shrink-0 ${
                          plan.highlighted ? "text-white" : ""
                        }`}
                        size={20}
                      />
                      <span
                        className={
                          plan.highlighted ? "text-white" : "text-gray-700"
                        }
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee if you're not satisfied with ProjectHub.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and wire transfers for enterprise plans.",
              },
              {
                q: "Is there an annual discount?",
                a: "Yes! Save 20% when you pay annually instead of monthly.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.q}
                </h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of teams using ProjectHub to manage their projects
            efficiently.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Start Your Free Trial <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 ProjectHub. All rights reserved.</p>
        </div>
      </footer>
    </PublicLayout>
  );
}
