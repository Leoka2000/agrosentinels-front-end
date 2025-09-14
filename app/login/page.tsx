import LoginForm from "@/components/LoginForm";
import { BluetoothDeviceProvider } from "@/context/BluetoothDeviceContext";
import { BluetoothSensorProvider } from "@/context/useBluetoothSensor";
import Image from "next/image";

export default function LoginPage() {
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
   
            <p className="text-small text-default-500">
              Log in to your account to continue
            </p>
          </div>
          <LoginForm />
        </div>

  );
}
