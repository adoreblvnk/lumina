import LuminaLanding from "@/components/LuminaLanding";
import { Lumina } from "@/components/Lumina";

export default function Home() {
  return (
    <div className="flex flex-col w-full items-center">
      <LuminaLanding />
      <div id="discussion" className="w-full flex items-center justify-center py-16">
        <div className="max-w-6xl w-full px-6">
          <Lumina />
        </div>
      </div>
    </div>
  );
}
