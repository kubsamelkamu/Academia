'use client';

import { useState } from 'react';
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
  Building2,
  GraduationCap,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { DEPARTMENT_NAME_OPTIONS, registerInstitutionSchema, RegisterInstitutionFormData } from '@/validations/auth';

const UNIVERSITY_SUGGESTIONS = [
  'Addis Ababa University',
  'Adama Science and Technology University',
  'Jimma University',
  'Bahir Dar University',
  'University of Gondar',
  'Hawassa University',
  'Mekelle University',
  'Haramaya University',
  'Arba Minch University',
  'Wollo University',
] as const;

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

export default function RegisterPage() {
  const router = useRouter();
  const { registerInstitution, isLoading, error, clearError } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInstitutionFormData>({
    resolver: zodResolver(registerInstitutionSchema),
  });

  const onSubmit = async (data: RegisterInstitutionFormData) => {
    try {
      clearError();
      await registerInstitution(data);
      setSuccessMessage(`Institution registered successfully! Check ${data.email} for verification code.`);
      // Navigate to verification page after a short delay
      setTimeout(() => {
        router.push('/register/verify');
      }, 2000);
    } catch (_err) {
      // Error is handled by the store
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Join Academia
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your institution with our comprehensive academic management platform
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div
            className="space-y-6"
            variants={itemVariants}
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Why Choose Academia?
              </h3>
              <ul className="space-y-3">
                {[
                  "Streamlined project management",
                  "Automated defense scheduling",
                  "Real-time progress tracking",
                  "Multi-role dashboard access",
                  "Secure multi-tenant architecture"
                ].map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <GraduationCap className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Ready to Get Started?</h3>
              <p className="text-blue-100">
                Join thousands of institutions already using Academia to manage their academic projects efficiently.
              </p>
            </motion.div>
          </motion.div>

          {/* Registration Form */}
          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  Register Institution
                </CardTitle>
                <CardDescription className="text-center">
                  Create your academic institution and department head account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Institution Details */}
                  <motion.div
                    className="space-y-4"
                    variants={itemVariants}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <h4 className="font-medium text-gray-900">Institution Details</h4>
                    </div>

                    <motion.div className="space-y-2" variants={itemVariants}>
                      <Label htmlFor="universityName" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        University Name
                      </Label>
                      <Input
                        id="universityName"
                        list="university-suggestions"
                        {...register('universityName')}
                        placeholder="Addis Ababa University"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <datalist id="university-suggestions">
                        {UNIVERSITY_SUGGESTIONS.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      {errors.universityName && (
                        <motion.p
                          className="text-sm text-red-600 flex items-center gap-1"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {errors.universityName.message}
                        </motion.p>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Department Details */}
                  <motion.div
                    className="space-y-4"
                    variants={itemVariants}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-purple-500" />
                      <h4 className="font-medium text-gray-900">Department Details</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.div className="space-y-2" variants={itemVariants}>
                        <Label htmlFor="departmentName">Department Name</Label>
                        <select
                          id="departmentName"
                          {...register('departmentName')}
                          defaultValue=""
                          className="border-input placeholder:text-muted-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                          aria-invalid={errors.departmentName ? 'true' : 'false'}
                        >
                          <option value="" disabled>
                            Select a department
                          </option>
                          {DEPARTMENT_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        {errors.departmentName && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errors.departmentName.message}
                          </motion.p>
                        )}
                      </motion.div>

                      <motion.div className="space-y-2" variants={itemVariants}>
                        <Label htmlFor="departmentCode">Department Code</Label>
                        <Input
                          id="departmentCode"
                          {...register('departmentCode')}
                          placeholder="CS"
                          className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                        />
                        {errors.departmentCode && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errors.departmentCode.message}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>

                    <motion.div className="space-y-2" variants={itemVariants}>
                      <Label htmlFor="departmentDescription">Department Description (Optional)</Label>
                      <Input
                        id="departmentDescription"
                        {...register('departmentDescription')}
                        placeholder="Brief description of the department"
                        className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                      />
                      {errors.departmentDescription && (
                        <motion.p
                          className="text-sm text-red-600"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {errors.departmentDescription.message}
                        </motion.p>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Department Head Details */}
                  <motion.div
                    className="space-y-4"
                    variants={itemVariants}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-green-500" />
                      <h4 className="font-medium text-gray-900">Department Head Details</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.div className="space-y-2" variants={itemVariants}>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...register('firstName')}
                          placeholder="John"
                          className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                        />
                        {errors.firstName && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errors.firstName.message}
                          </motion.p>
                        )}
                      </motion.div>

                      <motion.div className="space-y-2" variants={itemVariants}>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...register('lastName')}
                          placeholder="Doe"
                          className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                        />
                        {errors.lastName && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errors.lastName.message}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>

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
                        className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
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
                      <Input
                        id="password"
                        type="password"
                        {...register('password')}
                        placeholder="••••••••"
                        className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Must contain uppercase, lowercase, and number
                      </p>
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

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Alert>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <AlertDescription>{successMessage}</AlertDescription>
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
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Institution...
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center gap-2"
                          whileHover={{ x: 2 }}
                        >
                          Register Institution
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}