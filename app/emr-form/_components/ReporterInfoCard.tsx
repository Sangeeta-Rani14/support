import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { UserProfile } from "@/lib/emergency-channel";

interface ReporterInfoCardProps {
  name: string;
  mobile: string;
  otp: string;
  otpSent: boolean;
  otpVerified: boolean;
  userProfile: UserProfile | null;
  onNameChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
}

export default function ReporterInfoCard({
  name,
  mobile,
  otp,
  otpSent,
  otpVerified,
  userProfile,
  onNameChange,
  onMobileChange,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
}: ReporterInfoCardProps) {
  return (
    <Card className="opacity-0 animate-slide-up stagger-3 border-0 shadow-lg shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
            3
          </span>
          Your Information
          {userProfile && (
            <Badge
              className="ml-auto text-[10px] bg-brand-success/10 text-brand-success border-brand-success/20"
              variant="outline"
            >
              <User className="w-2.5 h-2.5 mr-1" />
              Auto-filled
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">Help responders contact you if needed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter your name"
              className="text-sm"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-sm font-medium">
              Mobile Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="text-sm flex-1"
                disabled={otpVerified}
                value={mobile}
                onChange={(e) => onMobileChange(e.target.value)}
              />
              {!otpVerified && (
                <Button
                  type="button"
                  onClick={onSendOtp}
                  disabled={otpSent}
                  className="bg-brand-primary text-white text-xs whitespace-nowrap"
                >
                  {otpSent ? "OTP Sent" : "Send OTP"}
                </Button>
              )}
            </div>

            {otpSent && !otpVerified && (
              <div className="animate-in slide-in-from-top-2 fade-in mt-2 space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium">
                  Verify OTP
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => onOtpChange(e.target.value)}
                    placeholder="Enter 4-digit OTP"
                    className="text-sm"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    onClick={onVerifyOtp}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Verify
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Use 1234 for testing</p>
              </div>
            )}

            {otpVerified && (
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium animate-in fade-in">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Number Verified
              </div>
            )}
          </div>
        </div>

        {/* Show blood group if available from profile */}
        {userProfile && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <span className="text-red-500 text-sm">🩸</span>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Blood Group</p>
                <p className="text-sm font-bold text-red-600">{userProfile.bloodGroup}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
              <span className="text-brand-primary text-sm">📋</span>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Scanner No.</p>
                <p className="text-xs font-bold text-brand-primary">{userProfile.scannerNumber}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

