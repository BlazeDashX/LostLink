import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import usersData from "@/data/users.json";
import itemsData from "@/data/items.json";
import messagesData from "@/data/message.json";
import claimsData from "@/data/claims.json";
import notificationsData from "@/data/notifications.json";

import {
  User,
  Item,
  Message,
  Claim,
  Notification,
  ClaimAnswers,
} from "@/types";

interface SubmitClaimData {
  itemId: string;
  answers: ClaimAnswers;
  handoverMethod: string;
}

interface ActionResponse {
  ok: boolean;
  message: string;
  claimId?: string;
}

interface AppContextType {
  currentUserId: string;

  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;

  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;

  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

  claims: Claim[];
  setClaims: React.Dispatch<React.SetStateAction<Claim[]>>;

  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

  // Item Actions
  addItem: (data: Omit<Item, "id" | "reporterId" | "status" | "createdAt">) => ActionResponse;

  // Claim Actions
  submitClaim: (data: SubmitClaimData) => ActionResponse;
  approveClaim: (claimId: string) => ActionResponse;
  rejectClaim: (claimId: string) => ActionResponse;
  getClaimById: (claimId: string) => Claim | undefined;
  getClaimsByItem: (itemId: string) => Claim[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUserId] = useState("U001");

  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setUsers(usersData as User[]);
    setItems(itemsData as Item[]);
    setMessages(messagesData as Message[]);
    setClaims(claimsData as Claim[]);
    setNotifications(notificationsData as Notification[]);
  }, []);

  const submitClaim = (data: SubmitClaimData): ActionResponse => {
    const item = items.find((i) => i.id === data.itemId);
    if (!item) return { ok: false, message: "Item not found." };
    if (item.reporterId === currentUserId) {
      return { ok: false, message: "The reporter cannot claim their own item." };
    }

    const existingClaim = claims.find(
      (c) => c.itemId === data.itemId && c.claimantId === currentUserId && ["Pending", "Approved"].includes(c.status)
    );
    if (existingClaim) return { ok: false, message: "You already have an active claim for this item." };

    const newClaim: Claim = {
      id: `CLM${Date.now()}`,
      itemId: data.itemId,
      claimantId: currentUserId,
      answers: data.answers,
      handoverMethod: data.handoverMethod,
      status: "Pending",
      reviewedBy: null,
      createdAt: new Date().toISOString(),
    };

    setClaims((prev) => [...prev, newClaim]);
    
    if (item.status === "Active") {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "Pending Claim" } : i)));
    }

    return { ok: true, message: "Claim submitted successfully.", claimId: newClaim.id };
  };

  const approveClaim = (claimId: string): ActionResponse => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { ok: false, message: "Claim not found." };

    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) return { ...c, status: "Approved", reviewedBy: currentUserId };
        if (c.itemId === claim.itemId && c.status === "Pending") return { ...c, status: "Rejected", reviewedBy: currentUserId };
        return c;
      })
    );

    setItems((prev) => prev.map((i) => (i.id === claim.itemId ? { ...i, status: "Reserved" } : i)));

    return { ok: true, message: "Claim approved. Item is now reserved." };
  };

  const rejectClaim = (claimId: string): ActionResponse => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { ok: false, message: "Claim not found." };

    setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, status: "Rejected", reviewedBy: currentUserId } : c)));

    const otherActiveClaims = claims.filter(
      (c) => c.itemId === claim.itemId && c.id !== claimId && ["Pending", "Approved"].includes(c.status)
    );
    
    if (otherActiveClaims.length === 0) {
      setItems((prev) => prev.map((i) => (i.id === claim.itemId ? { ...i, status: "Active" } : i)));
    }

    return { ok: true, message: "Claim rejected." };
  };

  const getClaimById = (claimId: string): Claim | undefined => {
    return claims.find(c => c.id === claimId);
  };

  const addItem = (data: Omit<Item, "id" | "reporterId" | "status" | "createdAt">): ActionResponse => {
    const newItem: Item = {
      id: `I${String(items.length + 1).padStart(3, "0")}`,
      ...data,
      reporterId: currentUserId,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
    return { ok: true, message: "Item reported successfully.", claimId: newItem.id };
  };

  const getClaimsByItem = (itemId: string): Claim[] => {
    return claims.filter(c => c.itemId === itemId);
  };

  return (
    <AppContext.Provider
      value={{
        currentUserId,
        users,
        setUsers,
        items,
        setItems,
        messages,
        setMessages,
        claims,
        setClaims,
        notifications,
        setNotifications,
        addItem,
        submitClaim,
        approveClaim,
        rejectClaim,
        getClaimById,
        getClaimsByItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider.");
  }
  return context;
}
