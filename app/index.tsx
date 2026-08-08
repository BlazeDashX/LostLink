import { Redirect } from "expo-router";

import { useApp } from "@/context/AppContext";

export default function IndexScreen() {
  const { isAuthenticated, currentUserId, users } = useApp();

  if (isAuthenticated) {
    const currentUser = users.find((user) => user.id === currentUserId);
    if (currentUser?.role === "Admin") {
      return <Redirect href="/(admin)" />;
    }
    return <Redirect href="/(tab)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

