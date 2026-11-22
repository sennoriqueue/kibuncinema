import { notFound } from "next/navigation";
import { Projector } from "@/components/art/Projector";
import { Finder } from "@/components/Finder";
import { getDict, isLocale } from "@/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <Projector />
      <p className="lead">{getDict(locale).home.lead}</p>
      <Finder />
    </>
  );
}
