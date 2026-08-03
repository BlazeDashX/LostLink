import { Tabs,Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function TabLayout() {

  const { isAuthenticated } = useApp();

  if(!isAuthenticated){
    return <Redirect href="/(auth)/login"/>
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
      <Tabs.Screen name="Inbox" options={{ title: "Inbox" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}