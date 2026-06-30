import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import Divider from "../components/ui/Divider";
import GlassCard from "../components/ui/GlassCard";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Login() {
  const { login, loginWithGoogle, setProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please enter email and password");
    }

    setLoading(true);
    try {
      const loginResult = await login(email, password);
      
      // If it's a real Firebase user, verify if profile exists on backend
      if (loginResult && !loginResult.isMock) {
        await new Promise(resolve => setTimeout(resolve, 400));
        try {
          const profileRes = await api.get("/auth/me");
          setProfile(profileRes.data.user || profileRes.data);
          toast.success("Welcome back!");
          navigate("/");
        } catch (err) {
          if (err.response?.status === 404) {
            toast.success("Account authenticated. Please complete your registration details.");
            navigate("/register", { state: { email: email, googleUid: loginResult.user.uid } });
          } else {
            toast.success("Welcome back!");
            navigate("/");
          }
        }
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      const user = res.user;

      // Check if user profile already exists on backend
      try {
        const profileRes = await api.get("/auth/me");
        setProfile(profileRes.data.user || profileRes.data);
        toast.success(`Welcome, ${profileRes.data.name || "User"}!`);
        navigate("/");
      } catch (err) {
        if (err.response?.status === 404) {
          // Profile does not exist yet! Redirect to register with state to complete step 2/3/4
          toast.success("Google authenticated. Please complete your registration details.");
          navigate("/register", { state: { email: user.email, name: user.displayName, googleUid: user.uid } });
        } else {
          toast.error("Auth check failed. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mid relative">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-purple-300/40 via-lavender-200/20 to-blue-200/40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] z-10"
      >
        <GlassCard className="glass-elevated p-8 flex flex-col gap-6 bg-white/65 shadow-2xl relative border-white/50">
          {/* Logo brand */}
          <div className="flex flex-col items-center gap-2 select-none text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-2xl shadow-lg shadow-indigo-600/30">
              SC
            </div>
            <h1 className="text-2xl font-bold font-display text-primary mt-2">SamajConnect</h1>
            <p className="text-xs text-muted font-medium">Community Civic Tech Platform · Latur</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-primary">Welcome back</h2>
            <p className="text-xs text-muted">Sign in to report issues and access neighborhood hub services.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="name@latur.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Button type="submit" loading={loading} variant="primary" className="w-full py-2.5 mt-2">
              Sign In
            </Button>
          </form>

          <Divider label="or continue with" />

          {/* Google Login */}
          <Button 
            type="button" 
            onClick={handleGoogleLogin} 
            variant="ghost" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border-white/60 bg-white/40 text-primary hover:bg-white/80"
          >
            {/* Google Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign In with Google</span>
          </Button>

          <p className="text-center text-xs text-muted mt-2">
            New to SamajConnect?{" "}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">
              Create account →
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
