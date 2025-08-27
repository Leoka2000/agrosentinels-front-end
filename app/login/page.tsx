import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex h-screen flex-col items-center  bg-muted justify-center">
      <div className="flex flex-col items-center pb-6">
        <Image
          src="/zanelogo.png"
          alt="Logo"
          width={124}
          height={124}
          className="mx-auto mb-4"
        />
        <p className="text-2xl font-medium">Welcome Back</p>
        <p className="text-small text-default-500">
          Log in to your account to continue
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
