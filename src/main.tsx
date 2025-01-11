import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'

import { MantineProvider, createTheme } from '@mantine/core';

import App from "./App";
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import React from "react";
import ReactDOM from "react-dom/client";

const theme = createTheme({
    /** Put your mantine theme override here */
    primaryColor: "blue",
});


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider theme={theme} forceColorScheme="dark">
            <ModalsProvider>
                <Notifications />
                <App />
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>,
);
