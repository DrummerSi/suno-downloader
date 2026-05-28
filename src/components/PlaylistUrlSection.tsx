import { ActionIcon, Flex, Group, Popover, Image, Text, TextInput, Button } from "@mantine/core";
import SectionHeading from "./SectionHeading";
import { IconHelpCircle, IconLink } from "@tabler/icons-react";
import SettingsPanel from "./OptionsModal";

type Props = {
    playlistUrl: string;
    isGettingPlaylist: boolean;
    isDownloading: boolean;
    onGetPlaylist: () => void;
    onPlaylistUrlChange: (value: string) => void;
};

export default function PlaylistUrlSection(props: Props) {
    const { playlistUrl, isGettingPlaylist, isDownloading, onGetPlaylist, onPlaylistUrlChange } = props;

    return (
        <>
            <Flex justify="space-between">
                <SectionHeading number="1" title="Paste playlist link">
                    <Popover position="bottom-start" withArrow shadow="lg">
                        <Popover.Target>
                            <ActionIcon variant="subtle" size="sm" color="gray">
                                <IconHelpCircle />
                            </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Group w={240} gap={4}>
                                <Image radius="md" src="./assets/copy-playlist.png" />
                                <Text>Navigate to your Suno playlist, and click the 'Copy playlist' button as shown</Text>
                            </Group>
                        </Popover.Dropdown>
                    </Popover>
                </SectionHeading>

                <SettingsPanel />
            </Flex>

            <Flex gap="sm" direction="row" mb={20}>
                <TextInput
                    flex={1}
                    value={playlistUrl}
                    onChange={(event) => onPlaylistUrlChange(event.currentTarget.value)}
                    rightSection={<IconLink />}
                    disabled={isGettingPlaylist || isDownloading}
                />
                <Button
                    variant="filled"
                    loading={isGettingPlaylist}
                    onClick={onGetPlaylist}
                    disabled={isGettingPlaylist || isDownloading}
                >
                    Get playlist songs
                </Button>
            </Flex>
        </>
    );
}

