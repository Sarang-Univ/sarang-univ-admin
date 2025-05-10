"use client";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { createContext, useContext, useState, ReactNode } from "react";

type AlertDialogContextType = {
  show: (options: {
    title: string;
    description: string;
    onConfirm: () => void;
  }) => void;
};

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(
  undefined
);

export function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return context;
}

export function AlertDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});

  const show = ({
    title,
    description,
    onConfirm,
  }: {
    title: string;
    description: string;
    onConfirm: () => void;
  }) => {
    setTitle(title);
    setDescription(description);
    setOnConfirm(() => onConfirm);
    setIsOpen(true);
  };

  return (
    <AlertDialogContext.Provider value={{ show }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm();
                setIsOpen(false);
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext.Provider>
  );
}
