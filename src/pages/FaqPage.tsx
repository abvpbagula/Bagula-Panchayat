import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { GoBackButton } from "@/components/GoBackButton";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { CitizenFaqSection } from "@/components/citizen/CitizenFaqSection";

export default function FaqPage() {
  const navigate = useNavigate();

  const handleSelectServiceGuide = (serviceKey: string) => {
    if (serviceKey === "birth-digitization") {
      navigate("/birth-digitization-form");
      return;
    }
    if (serviceKey === "warish") {
      navigate("/apply/warish");
      return;
    }
    if (serviceKey === "dependent") {
      navigate("/apply/dependent");
      return;
    }
    if (serviceKey === "linkage") {
      navigate("/apply/linkage");
      return;
    }
    navigate("/delayed-registration");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Helmet>
        <title>Cyber Cafe &amp; Assisted Service FAQ — Bagula 2 No Gram Panchayat</title>
        <meta
          name="description"
          content="Frequently asked questions and documentation procedures for Cyber Cafe operators and Bagula 2 No Gram Panchayat residents."
        />
      </Helmet>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <GoBackButton fallbackUrl="/cyber-cafe" label="Back to Cyber Cafe Hub" className="-ml-2" />

        <PageSectionHeader
          kicker="Bagula 2 No Gram Panchayat · Documentation & SOP"
          title="Frequently Asked Questions &amp; Assisted Service Guides"
          bengaliTitle="সাইবার ক্যাফে এবং নাগরিক পরিষেবা সংক্রান্ত সাধারণ জিজ্ঞাস্য"
          description="Step-by-step document requirements, statutory timelines, and Cyber Cafe operator instructions for Warish, Dependent, Linkage, and Birth/Death applications."
        />

        <CitizenFaqSection onSelectServiceGuide={handleSelectServiceGuide} />
      </main>
    </div>
  );
}
