"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { addToast } from "@heroui/toast";
import Image from "next/image";
import { Eye, EyeClosed, Link as LinkIcon } from "lucide-react";
import { Card } from "@heroui/card";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const { login } = useAuth();
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
        await login(data.token); // update context and fetch user
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
    <div className="w-full mx-auto flex justify-center">
      <Card className="p-10">
        <Form
          className="flex flex-col w-80 gap-3"
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
            <Link
              className="text-blue-600 underline underline-offset-4 dark:text-blue-500"
              href="#"
              size="sm"
            >
              <p className="mr-1">Forgot password?</p> <LinkIcon size={13} />
            </Link>
          </div>

          <Button
            className="w-full"
            color="success"
            variant="flat"
            type="submit"
            isDisabled={loading}
            isLoading={loading}
          >
            {loading ? "Loading..." : "Sign In"}
          </Button>
        </Form>

        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="text-tiny text-default-500 my-1 shrink-0">OR</p>
          <Divider className="flex-1" />
        </div>

        <div className="flex flex-col mb-5 gap-2">
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
      </Card>
    </div>
  );
}
