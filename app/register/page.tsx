import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex h-screen flex-col items-center  bg-muted justify-center">
      <div className="flex flex-col items-center pb-6">
        <Image
          src="/as-logo.png"
          alt="Logo"
          width={250}
          height={250}
          className="mx-auto mb-4 dark:invert dark:brightness-0"
          priority
        />

     <p className="text-lg  text-muted-foreground">
          Register for an account to continue
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
