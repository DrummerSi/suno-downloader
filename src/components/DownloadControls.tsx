import { ActionIcon, Button, Flex, Popover, Text, TextInput } from "@mantine/core";
import SectionHeading from "./SectionHeading";
import { IconFolderFilled, IconHelpCircle } from "@tabler/icons-react";

type Props = {
    hasPlaylist: boolean;
    isGettingPlaylist: boolean;
    isDownloading: boolean;
    saveFolder: string;
    onDownloadPlaylist: () => void;
    onSelectOutputFolder: () => void;
};

export default function DownloadControls(props: Props) {
    const {
        hasPlaylist,
        isGettingPlaylist,
        isDownloading,
        saveFolder,
        onDownloadPlaylist,
        onSelectOutputFolder,
    } = props;

    return (
        <>
            <SectionHeading number="3" title="Select folder and download">
                <Popover position="bottom-start" withArrow shadow="lg">
                    <Popover.Target>
                        <ActionIcon variant="subtle" size="sm" color="gray">
                            <IconHelpCircle />
                        </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown w={240}>
                        <Text>
                            In the selected directory, a new folder will be created with the playlist name. This folder
                            will contain the downloaded songs.
                        </Text>
                    </Popover.Dropdown>
                </Popover>
            </SectionHeading>

            <Flex gap="sm" direction="row" mb={20}>
                <TextInput
                    flex={1}
                    value={saveFolder}
                    disabled={isDownloading}
                    readOnly
                    onClick={onSelectOutputFolder}
                    leftSection={<IconFolderFilled />}
                    style={{ cursor: "pointer" }}
                />
                <Button
                    variant="filled"
                    disabled={isGettingPlaylist || isDownloading || !hasPlaylist}
                    loading={isDownloading}
                    onClick={onDownloadPlaylist}
                >
                    Download songs
                </Button>
            </Flex>
        </>
    );
}