"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Form } from "@heroui/form";
import { Tabs, Tab } from "@heroui/tabs";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { getToken } from "@/lib/auth";
import { AppUser } from "@/types/AppUser";
import { Save, Eye, EyeClosed, Loader2Icon, Trash2 } from "lucide-react";
import { Skeleton } from "@heroui/skeleton";
import { Alert } from "@heroui/alert";

export default function ProfileContent() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountFormData, setAccountFormData] = useState({
    username: "",
    email: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState({
    account: false,
    password: false,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getToken();
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setUser(userData);
        setAccountFormData({
          username: userData.username,
          email: userData.email,
        });
      } catch (error) {
        addToast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load account details",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting({ ...submitting, account: true });

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to update account details");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);

      addToast({
        title: "Success",
        description: "Account details updated successfully",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update account details",
        color: "danger",
      });
    } finally {
      setSubmitting({ ...submitting, account: false });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordFormData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast({
        title: "Error",
        description: "Please fill out all fields",
        color: "danger",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        title: "Error",
        description: "New password and confirmation do not match",
        color: "danger",
      });
      return;
    }

    setSubmitting({ ...submitting, password: true });

    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      addToast({
        title: "Success",
        description: "Password changed successfully",
        color: "success",
      });

      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to change password",
        color: "danger",
      });
    } finally {
      setSubmitting({ ...submitting, password: false });
    }
  };

  const togglePasswordVisibility = (field: keyof typeof isPasswordVisible) => {
    setIsPasswordVisible({
      ...isPasswordVisible,
      [field]: !isPasswordVisible[field],
    });
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col w-full max-w-2xl space-y-3">
          <Skeleton className="rounded-xl h-80" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="w-full max-w-2xl">
          <CardBody>
            <p className="text-danger">Failed to load account information</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-4">
      <div className="flex w-full flex-col">
        <Tabs color="secondary" variant={"bordered"} className="" aria-label="Account settings" isVertical={true}>
                  
          <Tab  key="account" title="Account Details">
            <Card className="">
              <CardBody className=" md:w-[30rem] w-full p-6 max-3xl">
                <Form
                  className="space-y-4"
                  onSubmit={handleAccountSubmit}
                  validationBehavior="native"
                >
                  <Input
                    isRequired
                    label="Username"
                    name="username"
                    value={accountFormData.username}
                    onChange={handleAccountInputChange}
                    variant="bordered"
                  />
                  <Input
                    isRequired
                    label="Email"
                    name="email"
                    type="email"
                    value={accountFormData.email}
                    onChange={handleAccountInputChange}
                    variant="bordered"
                  />
                  <Button
                    type="submit"
                    color="success"
                    variant="flat"
                    isLoading={submitting.account}
                    startContent={!submitting.account && <Save size={16} />}
                  >
                    {submitting.account ? "Saving..." : "Save Changes"}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="password" title="Change Password">
            <Card>
              <CardBody className=" md:w-[30rem] w-full p-6 max-3xl">
                <Form
                  className="space-y-4"
                  onSubmit={handlePasswordSubmit}
                  validationBehavior="native"
                >
                  <Input
                    isRequired
                    label="Current Password"
                    name="currentPassword"
                    type={isPasswordVisible.current ? "text" : "password"}
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordInputChange}
                    variant="bordered"
                    endContent={
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                      >
                        {isPasswordVisible.current ? (
                          <EyeClosed size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    }
                  />
                  <Input
                    isRequired
                    label="New Password"
                    name="newPassword"
                    type={isPasswordVisible.new ? "text" : "password"}
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordInputChange}
                    variant="bordered"
                    endContent={
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        {isPasswordVisible.new ? (
                          <EyeClosed size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    }
                  />
                  <Input
                    isRequired
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={isPasswordVisible.confirm ? "text" : "password"}
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    variant="bordered"
                    endContent={
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        {isPasswordVisible.confirm ? (
                          <EyeClosed size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    }
                  />
                  <Button
                    type="submit"
                 color="success"
                    variant="flat"
                    isLoading={submitting.password}
                    startContent={!submitting.password && <Save size={16} />}
                  >
                    {submitting.password ? "Changing..." : "Change Password"}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="delete" title="Delete Account">
            <Card>
              <CardBody className=" md:w-[30rem] w-full p-6 max-3xl">
                <Form className="space-y-4">
                  <div className="flex flex-col w-full">
                   
                      <div
                
                        className="w-full flex items-center my-3"
                      >
                        <Alert
                          color={"danger"}
                          title={` Warning: This action is permanent and cannot be undone. All your data will be permanently deleted.`}
                        />
                      </div>
             
                  </div>
                  <Input
                    isRequired
                    label="Enter your password to confirm"
                    name="confirmDeletePassword"
                    type="password"
                    variant="bordered"
                  />
                  <Button
                    type="submit"
                    color="danger"
                    variant="flat"
                    startContent={<Trash2 size={16} />}
                    isDisabled={true}
                  >
                    Delete Account (Not Implemented)
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
