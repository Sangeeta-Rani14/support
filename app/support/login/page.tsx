"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Loader2,
    ShieldCheck,
    KeyRound,
    Mail,
    ArrowRight,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


export default function SupportLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validations
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        // Simulate API call
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Success - Redirect to dashboard
            router.push("/support/dashboard");
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl translate-y-1/2" />
            </div>

            <Card className="w-full max-w-[400px] border-border/60 shadow-xl shadow-brand-primary/5 z-10 animate-slide-up">
                <CardHeader className="space-y-3 text-center pb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-2">
                        {/* Placeholder for Logo, using Shield as fallback or main icon */}
                        <ShieldCheck className="w-8 h-8 text-brand-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-sm mt-2">
                            Sign in to the Jan Setu Support Dashboard
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handeSubmit} className="space-y-4">

                        {error && (
                            <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-9 h-10 border-input bg-white/50 focus:bg-white transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a
                                    href="#"
                                    className="text-[10px] items-center font-medium text-brand-primary hover:underline hover:text-brand-primary-dark"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9 h-10 border-input bg-white/50 focus:bg-white transition-all font-mono text-sm tracking-widest"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 mt-2 bg-brand-primary hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 border-t border-border/40 pt-6 pb-6 bg-muted/20">
                    <div className="text-center text-xs text-muted-foreground">
                        Protected by Jan Setu Admin Security. <br />
                        Unauthorized access is prohibited.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
