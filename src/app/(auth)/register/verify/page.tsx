'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Mail,
  Shield,
  CheckCircle2,
  ArrowRight,
  Clock
} from 'lucide-react';
import { RegistrationProgress } from '@/components/auth/registration-progress';
import { useAuthStore } from '@/store/auth-store';
import { verifyOtpSchema, VerifyOtpFormData, resendOtpSchema, ResendOtpFormData } from '@/validations/auth';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function VerifyPage() {
  const router = useRouter();
  const {
    verifyEmailOtp,
    resendEmailOtp,
    isLoading,
    error,
    clearError,
    registration,
    tenantDomain,
  } = useAuthStore();

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  });

  const {
    register: registerResend,
    handleSubmit: handleResendSubmit,
  } = useForm<ResendOtpFormData>({
    resolver: zodResolver(resendOtpSchema),
  });

  useEffect(() => {
    if (!registration || !tenantDomain) {
      router.push('/register');
      return;
    }
  }, [registration, tenantDomain, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data: VerifyOtpFormData) => {
    if (!tenantDomain) return;

    try {
      clearError();
      await verifyEmailOtp({
        email: registration!.departmentHead.email,
        otp: data.otp,
      });
      router.push('/login');
    } catch (err) {
      // Error handled by store
    }
  };

  const onResend = async (data: ResendOtpFormData) => {
    if (!tenantDomain || countdown > 0) return;

    try {
      setResendLoading(true);
      await resendEmailOtp({
        email: data.email,
      });
      setResendMessage('OTP sent successfully! Check your email.');
      setCountdown(60); // 60 second cooldown
    } catch (err) {
      setResendMessage('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!registration) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          className="text-center mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Verify Your Email
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We've sent a verification code to secure your academic institution account
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Info Section */}
          <motion.div
            className="space-y-6"
            variants={itemVariants}
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                What happens next?
              </h3>
              <ul className="space-y-3">
                {[
                  "Check your email for the 6-digit verification code",
                  "Enter the code below to activate your account",
                  "Your institution will be ready for setup",
                  "Access your department head dashboard"
                ].map((step, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                      <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    {step}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CheckCircle2 className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Secure & Protected</h3>
              <p className="text-green-100">
                Your verification code ensures only authorized personnel can access your institution's academic management system.
              </p>
            </motion.div>
          </motion.div>

          {/* Verification Form */}
          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Mail className="w-6 h-6 text-green-500" />
                  Enter Verification Code
                </CardTitle>
                <CardDescription className="text-center">
                  We sent a code to <strong>{registration.departmentHead.email}</strong>
                </CardDescription>
                <RegistrationProgress currentStep="verify" />
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="otp" className="flex items-center gap-2 text-center justify-center">
                      <Shield className="w-4 h-4" />
                      6-Digit Verification Code
                    </Label>
                    <Input
                      id="otp"
                      {...register('otp')}
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                    />
                    {errors.otp && (
                      <motion.p
                        className="text-sm text-red-600 text-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.otp.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center gap-2"
                          whileHover={{ x: 2 }}
                        >
                          Verify Email
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Didn't receive the code?
                  </p>

                  <form onSubmit={handleResendSubmit(onResend)} className="space-y-2">
                    <Input
                      {...registerResend('email')}
                      defaultValue={registration.departmentHead.email}
                      placeholder="Enter your email"
                      disabled={countdown > 0}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full border-blue-200 hover:bg-blue-50"
                        disabled={resendLoading || countdown > 0}
                      >
                        {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {countdown > 0 ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Resend in {countdown}s
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Resend Code
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </form>

                  {resendMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Alert>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <AlertDescription>{resendMessage}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}