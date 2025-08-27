"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@heroui/link";

import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { addToast } from "@heroui/toast";
import Image from "next/image";
import { setToken } from "@/lib/auth";
import { Eye, EyeClosed } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        router.push("/dashboard");
      } else {
        addToast({
          title: "Login failed",
          description: "Invalid credentials, please try again.",
          color: "danger",
        });
      }
    } catch {
      addToast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast provider fixed at top-right */}
      <div className="fixed z-[100]">
      
      </div>

      <div className="w-full mx-auto flex justify-center">
        <div className="rounded-large bg-content dark:bg-neutral-900 shadow-small flex w-full max-w-sm flex-col gap-4 px-8 pt-10 pb-10">
          <Form
            className="flex flex-col gap-3"
            validationBehavior="native"
            onSubmit={handleSubmit}
          >
            <Input
              isRequired
              label="Email Address"
              name="email"
              placeholder="Enter your email"
              type="email"
              variant="bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              isRequired
              endContent={
                <button type="button" onClick={toggleVisibility}>
                  {isVisible ? <EyeClosed /> : <Eye />}
                </button>
              }
              label="Password"
              name="password"
              placeholder="Enter your password"
              type={isVisible ? "text" : "password"}
              variant="bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex w-full items-center justify-between px-1 py-2">
              <Checkbox name="remember" size="sm">
                Remember me
              </Checkbox>
              <Link className="text-default-500" href="#" size="sm">
                Forgot password?
              </Link>
            </div>

            {loading ? (
              <Button isLoading disabled color="success" className="w-full">
                Loading...
              </Button>
            ) : (
              <Button
                className="w-full"
                color="success"
                variant="shadow"
                type="submit"
                isDisabled={loading}
              >
                Sign In
              </Button>
            )}
          </Form>

          <div className="flex items-center gap-4 py-2">
            <Divider className="flex-1" />
            <p className="text-tiny text-default-500 shrink-0">OR</p>
            <Divider className="flex-1" />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              startContent={
                <Image
                  src="/google-color-icon.svg"
                  alt="Google icon"
                  width={20}
                  height={20}
                />
              }
              variant="bordered"
            >
              Continue with Google
            </Button>
          </div>

          <p className="text-small text-center">
            Need to create an account?&nbsp;
            <Link href="/register" size="sm" color="success">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
