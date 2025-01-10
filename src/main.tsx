import '@mantine/core/styles.css';

import { MantineProvider, createTheme } from '@mantine/core';

import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";

const theme = createTheme({
    /** Put your mantine theme override here */
    primaryColor: "blue",
});


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider theme={theme} forceColorScheme="dark">
            <App />
        </MantineProvider>
    </React.StrictMode>,
);
