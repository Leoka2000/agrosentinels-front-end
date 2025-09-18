"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { addToast } from "@heroui/toast";
import { Card } from "@heroui/card";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      addToast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        color: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const text = await res.text();

      if (res.ok) {
        router.push("/verify-email?email=" + encodeURIComponent(email));
      } else {
        if (text.includes("Username already exists")) {
          addToast({
            title: "Registration failed",
            description: "This username is already taken.",
            color: "danger",
          });
        } else if (text.includes("Email already exists")) {
          addToast({
            title: "Registration failed",
            description: "An account with this email already exists.",
            color: "danger",
          });
        } else {
          addToast({
            title: "Registration failed",
            description: text,
            color: "danger",
          });
        }
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
          className="flex flex-col w-80 mb-3 gap-3"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Input
            isRequired
            label="Username"
            placeholder="Choose a username"
            variant="bordered"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            isRequired
            label="Email Address"
            placeholder="Enter your email"
            type="email"
            variant="bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            isRequired
            label="Password"
            placeholder="Enter your password"
            type="password"
            variant="bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            isRequired
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
            variant="bordered"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            className="w-full mt-3"
            color="success"
            variant="flat"
            type="submit"
            isDisabled={loading}
            isLoading={loading}
          >
            {loading ? "Please wait..." : "Register"}
          </Button>
        </Form>

        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <Divider className="flex-1" />
        </div>

        <p className="text-small text-center">
          Already have an account?&nbsp;
          <Link href="/login" size="sm" color="success">
            Log In
          </Link>
        </p>
      </Card>
    </div>
  );
}
