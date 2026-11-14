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
        <title>Public Service FAQ — Bagula 2 No Gram Panchayat</title>
        <meta
          name="description"
          content="Frequently asked questions and documentation procedures for Bagula 2 No Gram Panchayat residents."
        />
      </Helmet>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <GoBackButton fallbackUrl="/" label="Back to Home" className="-ml-2" />

        <PageSectionHeader
          kicker="Bagula 2 No Gram Panchayat · Public Help & FAQ"
          title="Frequently Asked Questions"
          bengaliTitle="নাগরিক পরিষেবা সংক্রান্ত সাধারণ জিজ্ঞাস্য"
          description="Step-by-step document requirements and statutory timelines for Warish, Dependent, Linkage, and Birth/Death applications."
        />

        <CitizenFaqSection onSelectServiceGuide={handleSelectServiceGuide} />
      </main>
    </div>
  );
}
