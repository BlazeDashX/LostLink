import { Redirect } from "expo-router";

import { useApp } from "@/context/AppContext";

export default function IndexScreen() {

  const { isAuthenticated } = useApp();

  if(isAuthenticated){
    return <Redirect href="/(tab)/home"/>
  }
  
  return <Redirect href="/(auth)/login" />;
}
