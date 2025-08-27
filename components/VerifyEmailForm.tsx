"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Divider } from "@heroui/divider";

import { Form } from "@heroui/form";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { Input } from "@heroui/input";

import Link from "next/link";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Countdown effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown((prev) => prev - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode }),
      });

      const text = await res.text();

      if (res.ok) {
        onOpen(); // open success modal
      } else {
        setError(text || "Verification failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend?email=${email}`, {
        method: "POST",
      });
      const text = await res.text();

      if (!res.ok) {
        setError(text || "Failed to resend code.");
      } else {
        setResendCooldown(30);
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <div className="w-full mx-auto flex justify-center">
        <div className="rounded-large bg-content dark:bg-neutral-900 shadow-small flex w-full max-w-md flex-col gap-4 px-8 pt-10 pb-10">
          <h2 className="text-xl font-semibold text-center">
            Email Verification
          </h2>
          <p className="text-small text-default-500 text-center">
            Enter the code sent to <span className="font-medium">{email}</span>
          </p>

          <Form
            className="flex flex-col gap-4"
            validationBehavior="native"
            onSubmit={handleVerify}
          >
            {error && (
              <Alert
                color="danger"
                variant="solid"
                title="Verification Error"
                className="w-full"
              >
                <p>{error}</p>
                <Link href="/login">
                  <Button size="sm"  color="primary" className="mt-2 w-full">
                    Back to Login
                  </Button>
                </Link>
              </Alert>
            )}

            <Input
              isRequired
              label="Verification Code"
              placeholder="Enter the code"
              variant="bordered"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />

            <Button
              type="submit"
              color="success"
              variant="shadow"
              className="w-full"
              isLoading={loading}
              isDisabled={loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <Button
              type="button"
              variant="flat"
              className="w-full text-sm"
              onPress={handleResend}
              isDisabled={resendLoading || resendCooldown > 0}
              isLoading={resendLoading}
            >
              {resendLoading
                ? "Resending..."
                : resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : "Resend Verification Code"}
            </Button>
          </Form>

          <Divider />
          <p className="text-small text-center text-default-500">
            Didn’t receive the code? Try resending.
          </p>
        </div>
      </div>

      {/* Success modal */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Verification Successful
              </ModalHeader>
              <ModalBody>
                <p className="text-center">
                  You have successfully verified your account. You can now log
                  in.
                </p>
              </ModalBody>
              <ModalFooter>
                <Link href="/login" className="w-full">
                  <Button color="success" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
