import { Button, Divider, Flex, Group, Progress, Stack, Text } from "@mantine/core";
import Footer from "./Footer";
import { IconBrandGithub, IconCoffee } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";

type Props = {
    downloadPercentage: number;
    footerView: 1 | 2;
};

export default function AppFooter({ downloadPercentage, footerView }: Props) {
    return (
        <Footer
            firstComponent={
                <Group gap={6}>
                    <Button
                        leftSection={<IconBrandGithub />}
                        variant="subtle"
                        size="xs"
                        onClick={() => openUrl("https://github.com/DrummerSi/suno-downloader")}
                    >
                        Open source
                    </Button>
                    <Divider orientation="vertical" />
                    <Button
                        leftSection={<IconCoffee />}
                        variant="subtle"
                        size="xs"
                        onClick={() => openUrl("https://ko-fi.com/drummer_si")}
                    >
                        Buy me a coffee
                    </Button>
                </Group>
            }
            secondComponent={
                <Stack w="100%" h={140} gap={4} pb={10} mt={-5}>
                    <Flex>
                        <Text size="xs">{downloadPercentage}%</Text>
                    </Flex>
                    <Progress value={downloadPercentage} animated />
                </Stack>
            }
            currentView={footerView}
        />
    );
}