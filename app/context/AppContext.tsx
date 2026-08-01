import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

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
} from "@/types";

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
  setNotifications: React.Dispatch<
    React.SetStateAction<Notification[]>
  >;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentUserId] = useState("U001");

  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  useEffect(() => {
    setUsers(usersData as User[]);
    setItems(itemsData as Item[]);
    setMessages(messagesData as Message[]);
    setClaims(claimsData as Claim[]);
    setNotifications(notificationsData as Notification[]);
  }, []);

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