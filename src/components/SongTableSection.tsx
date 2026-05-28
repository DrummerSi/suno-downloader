import { RefObject } from "react";
import { IPlaylistClip } from "../services/Suno";
import SectionHeading from "./SectionHeading";
import { Flex, Table } from "@mantine/core";
import SongRow from "./SongRow";
import { IconDownload, IconLink, IconTrash } from "@tabler/icons-react";
import { useContextMenu } from "mantine-contextmenu";
import { openUrl } from "@tauri-apps/plugin-opener";
import { SUNO_SONG_URL } from "../consts";

type Props = {
    clips: IPlaylistClip[];
    hasPlaylist: boolean;
    isDownloading: boolean;
    tableRef: RefObject<HTMLTableElement>;
    onDeleteClip: (clip: IPlaylistClip) => void;
    onDownloadClip: (clip: IPlaylistClip) => void;
};

export default function SongTableSection(props: Props) {
    const { clips, hasPlaylist, isDownloading, tableRef, onDeleteClip, onDownloadClip } = props;
    const { showContextMenu } = useContextMenu();

    return (
        <>
            <SectionHeading number="2" title="Review songs" />
            <Flex
                bg="dark.8"
                mb={20}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    flexFlow: "column",
                }}
            >
                <Table verticalSpacing="sm" ref={tableRef}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Img</Table.Th>
                            <Table.Th>Title</Table.Th>
                            <Table.Th style={{ textAlign: "right" }}>Length</Table.Th>
                            <Table.Th />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {hasPlaylist &&
                            clips.map((clip) => (
                                <SongRow
                                    key={clip.id}
                                    clip={clip}
                                    onContextMenu={showContextMenu([
                                        {
                                            key: "open",
                                            title: "Open in Suno",
                                            icon: <IconLink size={16} />,
                                            disabled: isDownloading,
                                            onClick: () => openUrl(`${SUNO_SONG_URL}/${clip.id}`),
                                        },
                                        {
                                            key: "download",
                                            title: "Download",
                                            icon: <IconDownload size={16} />,
                                            disabled: isDownloading,
                                            onClick: () => onDownloadClip(clip),
                                        },
                                        { key: "divider" },
                                        {
                                            key: "remove",
                                            color: "red",
                                            title: "Remove from list",
                                            icon: <IconTrash size={16} />,
                                            disabled: isDownloading,
                                            onClick: () => onDeleteClip(clip),
                                        },
                                    ])}
                                />
                            ))}
                    </Table.Tbody>
                </Table>
            </Flex>
        </>
    );
}