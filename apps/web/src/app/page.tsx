import { Finder } from "@/components/Finder";

export default function HomePage() {
  return (
    <>
      <p className="lead">4つの質問に答えると、今の気分に合う映画を3本えらびます。</p>
      <Finder />
    </>
  );
}
