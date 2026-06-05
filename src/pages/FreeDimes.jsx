import { RewardedAdButton } from "../components/RewardedAdButton";

export function FreeDimes() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-12 text-center">
      <div className="space-y-4 mb-8">
        <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white">
          Get More $Dimes
        </h2>
        <p className="text-white/60 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed">
          Watch a short ad to instantly claim 100 $Dimes to your bankroll.
        </p>
      </div>

      <div className="glass-card p-10 md:p-16 flex flex-col items-center justify-center min-h-[300px]">
        <RewardedAdButton />
      </div>
    </div>
  );
}
