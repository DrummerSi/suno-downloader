import { MantineProvider, createTheme } from '@mantine/core';

import App from "./App";
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import React from "react";
import ReactDOM from "react-dom/client";
import { ContextMenuProvider } from 'mantine-contextmenu'

import '@mantine/core/styles.layer.css'
import '@mantine/notifications/styles.layer.css'
import 'mantine-contextmenu/styles.layer.css'
import './styles/layout.css'

const theme = createTheme({
    /** Put your mantine theme override here */
    primaryColor: "blue",
});


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider theme={theme} forceColorScheme="dark">
            <ModalsProvider>
                <Notifications />
                <ContextMenuProvider shadow="xl" borderRadius="sm">
                    <App />
                </ContextMenuProvider>
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>,
);
