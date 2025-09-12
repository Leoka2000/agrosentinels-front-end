"use client";

import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { getToken } from "@/lib/auth";
import { Alert } from "@heroui/alert";

export default function DeleteDeviceButton() {
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch active device on mount
  useEffect(() => {
    const fetchActiveDevice = async () => {
      const token = getToken();
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/device/active`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch active device");
        const data = await res.json();
        setDeviceId(data.deviceId);
      } catch (err) {
        console.error("Error fetching active device:", err);
        addToast({
          title: "Error",
          description: "Failed to fetch active device",
          color: "danger",
        });
      }
    };

    fetchActiveDevice();
  }, []);

  const handleDelete = async () => {
    if (!deviceId) return;

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/device/list/${deviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        addToast({
          title: "Success",
          description: "Device deleted successfully",
          color: "success",
        });
        setDeviceId(null);
        setIsOpen(false);
      } else {
        addToast({
          title: "Error",
          description: "Failed to delete device",
          color: "danger",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      addToast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        color={"danger"}
        variant={"faded"}

        className="w-58 border-default-200 "
        startContent={<Trash2 size={17} />}
        onPress={() => setIsOpen(true)}
        disabled={!deviceId}
      >
        Delete Device
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent>
          <ModalHeader>Delete Device</ModalHeader>
          <ModalBody>
            <Alert
              color={"warning"}
              title={`  Are you sure you want to delete this device? This action cannot be
            undone.`}
            />
          </ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button variant={"faded"} onPress={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDelete} isLoading={loading}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
