import { Button } from "@/components/ui/button";

interface SubmitSectionProps {
  gps: string;
  submitError: string | null;
  submitting: boolean;
  otpVerified: boolean;
}

export default function SubmitSection({ gps, submitError, submitting, otpVerified }: SubmitSectionProps) {
  return (
    <>
      {/* GPS Hidden Field */}
      <input type="hidden" name="gps" value={gps} />

      {/* Submit */}
      <div className="opacity-0 animate-slide-up stagger-4 pt-2 space-y-3">
        {/* API error banner */}
        {submitError && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-red-500 text-base leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-red-700">Submission failed</p>
              <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || !otpVerified}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-brand-emergency to-red-700 hover:from-red-700 hover:to-brand-emergency transition-all duration-300 shadow-lg shadow-brand-emergency/25 hover:shadow-xl hover:shadow-brand-emergency/30"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting Report...
            </div>
          ) : (
            <>🚨 Submit Emergency Report</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-1">
          Your location and report will be shared with emergency responders
        </p>
      </div>

      {/* Footer branding */}
      <div className="opacity-0 animate-fade-in stagger-5 border-t border-border/50 pt-4 mt-8">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">JS</span>
          </div>
          <span>Powered by Jan Setu Support</span>
        </div>
      </div>
    </>
  );
}

