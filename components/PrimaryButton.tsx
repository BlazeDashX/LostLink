import React from "react";
import { ActivityIndicator,Pressable,StyleSheet,Text } from "react-native";

import { COLORS } from "@/constants/colors";

interface PrimaryButtonProps{
    title: string;
    onPress?:()=>void;
    disabled?:boolean;
    loading?:boolean;
}

export default function PrimaryButton({
    title,
    onPress,
    disabled =false,
    loading =false,
}:PrimaryButtonProps){
    return(
        <Pressable
        style={({pressed})=>
        [styles.button,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.white}/>
            ):(
                <Text style={styles.buttonText}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 12,

        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});