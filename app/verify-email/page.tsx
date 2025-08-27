import React, { Suspense } from "react";
import VerifyEmailForm from "../../components/VerifyEmailForm";
import {Spinner} from "@heroui/spinner";

export default function VerifyEmailPage() {
  return (
    <div className="flex h-screen flex-col items-center  bg-muted justify-center">
      <Suspense fallback={<Spinner color="primary" label="Loading..." />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}