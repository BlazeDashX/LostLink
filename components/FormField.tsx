import React,{ useState } from "react";
import { StyleSheet,Text,TextInput,View,TextInputProps,Pressable } from "react-native";

import { COLORS } from "@/constants/colors";

import { Ionicons } from "@expo/vector-icons"

interface FormFieldProps extends TextInputProps{
    label: string;
    showPasswordToggle?:boolean;
}

export default function FormField({
    label,
    showPasswordToggle=false,
    ...textInputProps
}:FormFieldProps){
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    return (
        
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry={
                        showPasswordToggle
                        ? !isPasswordVisible
                        : textInputProps.secureTextEntry
                    }
                    {...textInputProps}
                />
                {showPasswordToggle &&(
                    <Pressable
                    onPress={()=> setIsPasswordVisible(!isPasswordVisible)}
                    style={{paddingLeft:8}}>

                        <Ionicons
                            name = {isPasswordVisible ? "eye-off-outline" : "ear-outline"}
                            size={22}
                            color={COLORS.textSecondary}
                        />
                   </Pressable> 
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        marginBottom:20,
    },

    label:{
        fontSize: 15,
        fontWeight: "600",
        color:COLORS.textPrimary,
        marginBottom:8,
    },

    input:{
        flex:1,
        height:52,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
});