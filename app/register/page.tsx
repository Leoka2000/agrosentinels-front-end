import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
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
       
        <p className="text-2xl text-default-800">
          Register for an account to continue
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
