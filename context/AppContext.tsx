import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import usersData from "@/data/users.json";
import itemsData from "@/data/items.json";
import messagesData from "@/data/message.json";
import claimsData from "@/data/claims.json";
import notificationsData from "@/data/notifications.json";

import {
  User,
  SafeUser,
  Item,
  Message,
  Claim,
  Notification,
  ClaimAnswers,
} from "@/types";

import { api } from "@/services/api";

interface SubmitClaimData {
  itemId: string;
  answers: ClaimAnswers;
  handoverMethod: string;
}

interface ActionResponse {
  ok: boolean;
  message: string;
  claimId?: string;
  user?: SafeUser;
}

/*
 * users.json is only a temporary local seed source.
 * The password field is removed before users enter client state.
 */
type LocalUser = User & {
  password?: string;
};

interface AppContextType {
  currentUserId: string | null;
  currentUser: SafeUser | null;

  setCurrentUserId: React.Dispatch<
    React.SetStateAction<string | null>
  >;

  users: SafeUser[];
  setUsers: React.Dispatch<React.SetStateAction<SafeUser[]>>;

  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;

  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

  claims: Claim[];
  setClaims: React.Dispatch<React.SetStateAction<Claim[]>>;

  notifications: Notification[];
  setNotifications: React.Dispatch<
    React.SetStateAction<Notification[]>
  >;

  // Item Actions
  addItem: (
    data: Omit<Item, "id" | "reporterId" | "status" | "createdAt">
  ) => ActionResponse;

  // Claim Actions
  submitClaim: (data: SubmitClaimData) => Promise<ActionResponse>;
  approveClaim: (claimId: string) => Promise<ActionResponse>;
  rejectClaim: (claimId: string) => Promise<ActionResponse>;
  getClaimById: (claimId: string) => Claim | undefined;
  getClaimsByItem: (itemId: string) => Claim[];

  // Authentication
  isAuthenticated: boolean;
  authLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<ActionResponse>;

  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    null
  );

  const [authLoading, setAuthLoading] = useState(true);

  const [users, setUsers] = useState<SafeUser[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(
    []
  );

  useEffect(() => {
    setUsers(
      (usersData as LocalUser[]).map(
        ({ password: _password, ...user }) => user
      )
    );

    setItems(itemsData as Item[]);
    setMessages(messagesData as Message[]);
    setClaims(claimsData as Claim[]);
    setNotifications(notificationsData as Notification[]);

    // Automatically sync initial item statuses with claims
    const initialClaims = claimsData as Claim[];
    setItems((prevItems) =>
      prevItems.map((item) => {
        const matchingClaims = initialClaims.filter((c) => c.itemId === item.id);
        if (matchingClaims.some((c) => c.status === "Completed")) {
          return { ...item, status: "Solved" };
        }
        if (matchingClaims.some((c) => c.status === "Approved")) {
          return { ...item, status: "Reserved" };
        }
        if (matchingClaims.some((c) => c.status === "Pending") && item.status === "Active") {
          return { ...item, status: "Pending Claim" };
        }
        return item;
      })
    );

    const restoreSession = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem(
          "currentUserId"
        );

        if (!savedUserId) {
          return;
        }

        const response = await api.get(
          `/api/users/${savedUserId}`,
          {
            headers:{
              "x-user-id": savedUserId,
            },
          }
        );

        const restoredUser = response.data.data;

        setUsers((prev) => {
          const userExists = prev.some(
            (user) => user.id === restoredUser.id
          );

          if (userExists) {
            return prev.map((user) =>
              user.id === restoredUser.id
                ? {
                    ...user,
                    ...restoredUser,
                  }
                : user
            );
          }

          return [...prev, restoredUser];
        });

        setCurrentUserId(restoredUser.id);
      } catch (error) {
        console.log(
          "Failed to restore session:",
          error
        );

        await AsyncStorage.removeItem("currentUserId");
        setCurrentUserId(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<ActionResponse> => {
    try {
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const loggedInUser = response.data.user;

      const userForContext: SafeUser = {
        ...loggedInUser,
      };

      setUsers((prev) => {
        const userExists = prev.some(
          (user) => user.id === loggedInUser.id
        );

        if (userExists) {
          return prev.map((user) =>
            user.id === loggedInUser.id
              ? {
                  ...user,
                  ...loggedInUser,
                }
              : user
          );
        }

        return [...prev, userForContext];
      });

      setCurrentUserId(loggedInUser.id);

      await AsyncStorage.setItem(
        "currentUserId",
        loggedInUser.id
      );

      return {
        ok: true,
        message: response.data.message,
        user: userForContext,
      };
    } catch (error: any) {
      return {
        ok: false,
        message:
          error.response?.data?.message ||
          "Login failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("currentUserId");

      setCurrentUserId(null);
    } catch (error) {
      console.log(
        "Failed to clear session:",
        error
      );
    }
  };

  // Automatically synchronize item statuses when claims state changes
  useEffect(() => {
    if (claims.length === 0) return;
    setItems((prevItems) => {
      let changed = false;
      const updated = prevItems.map((item) => {
        const itemClaims = claims.filter((c) => c.itemId === item.id);
        if (itemClaims.length === 0) return item;

        let derived = item.status;
        if (itemClaims.some((c) => c.status === "Completed")) {
          derived = "Solved";
        } else if (itemClaims.some((c) => c.status === "Approved")) {
          derived = "Reserved";
        } else if (itemClaims.some((c) => c.status === "Pending") && item.status === "Active") {
          derived = "Pending Claim";
        }

        if (derived !== item.status) {
          changed = true;
          return { ...item, status: derived };
        }
        return item;
      });
      return changed ? updated : prevItems;
    });
  }, [claims]);

  const isAuthenticated = currentUserId !== null;

  const currentUser: SafeUser | null =
    users.find(
      (user) => user.id === currentUserId
    ) ?? null;

  const submitClaim = async (
    data: SubmitClaimData
  ): Promise<ActionResponse> => {
    if (!currentUserId) {
      return {
        ok: false,
        message: "Please login first.",
      };
    }

    try {
      const response = await api.post("/api/claims", {
        itemId: data.itemId,
        claimantId: currentUserId,
        answers: data.answers,
        handoverMethod: data.handoverMethod,
      });

      const newClaim: Claim = response.data.claim;

      if (newClaim) {
        setClaims((prev) => [newClaim, ...prev.filter((c) => c.id !== newClaim.id)]);
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === data.itemId && i.status === "Active"
            ? { ...i, status: "Pending Claim" }
            : i
        )
      );

      return {
        ok: true,
        message: response.data.message || "Claim submitted successfully.",
        claimId: newClaim?.id || `CL${Date.now()}`,
      };
    } catch (error: any) {
      return {
        ok: false,
        message:
          error.response?.data?.message ||
          "Failed to submit claim. Please check your connection and try again.",
      };
    }
  };

  const approveClaim = async (
    claimId: string
  ): Promise<ActionResponse> => {
    try {
      const response = await api.patch(`/api/claims/${claimId}`, {
        status: "Approved",
        reviewedBy: currentUserId,
      });

      const updatedClaim: Claim = response.data.claim;

      setClaims((prev) =>
        prev.map((c) => {
          if (c.id === claimId) {
            return updatedClaim || {
              ...c,
              status: "Approved",
              reviewedBy: currentUserId,
            };
          }

          if (
            c.itemId === (updatedClaim?.itemId || c.itemId) &&
            c.status === "Pending"
          ) {
            return {
              ...c,
              status: "Rejected",
              reviewedBy: currentUserId,
            };
          }

          return c;
        })
      );

      const targetItemId = updatedClaim?.itemId;
      if (targetItemId) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === targetItemId
              ? { ...i, status: "Reserved" }
              : i
          )
        );
      }

      return {
        ok: true,
        message: response.data.message || "Claim approved. Item is now reserved.",
      };
    } catch (error: any) {
      return {
        ok: false,
        message:
          error.response?.data?.message ||
          "Failed to approve claim. Please try again.",
      };
    }
  };

  const rejectClaim = async (
    claimId: string
  ): Promise<ActionResponse> => {
    try {
      const response = await api.patch(`/api/claims/${claimId}`, {
        status: "Rejected",
        reviewedBy: currentUserId,
      });

      const updatedClaim: Claim = response.data.claim;
      const newItemStatus = response.data.itemStatus;

      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? updatedClaim || {
                ...c,
                status: "Rejected",
                reviewedBy: currentUserId,
              }
            : c
        )
      );

      const targetItemId = updatedClaim?.itemId;
      if (targetItemId && newItemStatus) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === targetItemId
              ? { ...i, status: newItemStatus }
              : i
          )
        );
      }

      return {
        ok: true,
        message: response.data.message || "Claim rejected.",
      };
    } catch (error: any) {
      return {
        ok: false,
        message:
          error.response?.data?.message ||
          "Failed to reject claim. Please try again.",
      };
    }
  };

  const getClaimById = (
    claimId: string
  ): Claim | undefined => {
    return claims.find(
      (c) => c.id === claimId
    );
  };

  const addItem = (
    data: Omit<
      Item,
      "id" | "reporterId" | "status" | "createdAt"
    >
  ): ActionResponse => {
    if (!currentUserId) {
      return {
        ok: false,
        message: "Please login first.",
      };
    }

    const newItem: Item = {
      id: `I${String(
        items.length + 1
      ).padStart(3, "0")}`,
      ...data,
      reporterId: currentUserId,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    setItems((prev) => [
      newItem,
      ...prev,
    ]);

    return {
      ok: true,
      message:
        "Item reported successfully.",
      claimId: newItem.id,
    };
  };

  const getClaimsByItem = (
    itemId: string
  ): Claim[] => {
    return claims.filter(
      (c) => c.itemId === itemId
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUserId,
        currentUser,
        setCurrentUserId,
        isAuthenticated,
        authLoading,
        login,
        logout,
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
    throw new Error(
      "useApp must be used inside AppProvider."
    );
  }

  return context;
}