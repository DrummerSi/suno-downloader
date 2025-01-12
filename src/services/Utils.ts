import classes from "../styles/notifications.module.css";
import { notifications } from "@mantine/notifications";

export const stringToArrayBuffer = (str: string) => {
    // Convert the string to a Uint8Array
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);

    // Return the underlying ArrayBuffer
    return uint8Array.buffer;
}

export const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const showError = (message: string, title?: string) => {
    notifications.show({
        color: "red",
        title: title || "An error occured",
        message: message,
        position: "bottom-center",
        classNames: classes
    })
}

export const showSuccess = (message: string, title?: string) => {
    notifications.show({
        color: "green",
        title: title || "Success",
        message: message,
        position: "bottom-center",
        classNames: classes
    })
}

export const getRandomBetween = (min: number, max: number) => {
    return Math.random() * (max - min) + min
}