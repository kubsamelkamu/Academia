'use client';

import { useCallback, useEffect, useState } from 'react';
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
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { loginSchema, LoginFormData } from '@/validations/auth';
import { getDashboardRoleSlug, getPrimaryRoleFromBackendRoles } from '@/lib/auth/dashboard-role-paths';

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

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, tenantDomain, user } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Helper function to handle role-based redirection
  const redirectToDashboard = useCallback((userRoles?: string[]) => {
    const primaryRole = getPrimaryRoleFromBackendRoles(userRoles);
    if (primaryRole) {
      router.push(`/dashboard/${getDashboardRoleSlug(primaryRole)}`);
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      redirectToDashboard(user.roles);
      return;
    }
  }, [user, redirectToDashboard]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);

      const state = useAuthStore.getState();
      redirectToDashboard(state.user?.roles);
    } catch {
      // Error handled by store
    }
  };

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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access your institution&apos;s academic management dashboard
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Features Section */}
          <motion.div
            className="space-y-6"
            variants={itemVariants}
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Dashboard Features
              </h3>
              <ul className="space-y-3">
                {[
                  "Real-time project tracking and management",
                  "Automated defense scheduling system",
                  "Multi-role user management",
                  "Comprehensive reporting and analytics",
                  "Secure multi-tenant architecture"
                ].map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BarChart3 className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Powerful Analytics</h3>
              <p className="text-purple-100">
                Get insights into your institution&apos;s academic performance with comprehensive analytics and reporting tools.
              </p>
            </motion.div>
          </motion.div>

          {/* Login Form */}
          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <LogIn className="w-6 h-6 text-purple-500" />
                  Sign In
                </CardTitle>
                <CardDescription className="text-center">
                  Access your academic institution dashboard
                  {tenantDomain && (
                    <div className="mt-2 text-sm text-gray-600">
                      Institution: <span className="font-medium text-purple-600">{tenantDomain}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="john.doe@university.edu"
                      className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                    />
                    {errors.email && (
                      <motion.p
                        className="text-sm text-red-600 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="••••••••"
                        className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                      >
                        {isPasswordVisible ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    {errors.password && (
                      <motion.p
                        className="text-sm text-red-600 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.password.message}
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
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing In...
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center gap-2"
                          whileHover={{ x: 2 }}
                        >
                          Sign In
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div
                  className="mt-6 pt-6 border-t text-center"
                  variants={itemVariants}
                >
                  <p className="text-sm text-gray-600 mb-2">
                    Don&apos;t have an account?
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => router.push('/register')}
                      variant="outline"
                      className="border-purple-200 hover:bg-purple-50 text-purple-600"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Register your institution
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}