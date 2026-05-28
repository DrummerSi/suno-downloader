import { AppShell, Box, CloseButton, Flex, Group, Text } from "@mantine/core";
import { IconVinyl } from "@tabler/icons-react";
import { exit } from "@tauri-apps/plugin-process";

export default function AppHeader() {
    return (
        <AppShell.Header>
            <Box h="100%" data-tauri-drag-region>
                <Flex justify="space-between" h="100%" w="100%" data-tauri-drag-region>
                    <Flex
                        h="100%"
                        w="100%"
                        justify="center"
                        align="center"
                        style={{ userSelect: "none" }}
                        data-tauri-drag-region
                    >
                        <Group gap={6} ml={10}>
                            <IconVinyl />
                            <Text>Suno Music Downloader</Text>
                        </Group>
                    </Flex>
                    <CloseButton onClick={() => exit(1)} mt={6} mr={6} />
                </Flex>
            </Box>
        </AppShell.Header>
    );
}