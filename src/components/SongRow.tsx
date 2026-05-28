import { MouseEventHandler } from "react";
import { IPlaylistClip } from "../services/Suno";
import { Table, Image, Text, Stack, Group, Badge } from "@mantine/core";
import StatusIcon from "./StatusIcon";

type Props = {
    clip: IPlaylistClip;
    onContextMenu: MouseEventHandler<HTMLTableRowElement>;
};

const formatSecondsToTime = (seconds: number) => {
    const roundedSeconds = Math.round(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function SongRow({ clip, onContextMenu }: Props) {

    return (
        <Table.Tr data-id={`row-${clip.id}`} onContextMenu={onContextMenu}>
            <Table.Td w={50}>
                <Image radius="sm" w={40} fit="contain" src={clip.image_url} />
            </Table.Td>
            <Table.Td>
                <Stack gap={0}>
                    <Group gap={0}>
                        <Text fw={800} size="md">
                            {clip.title}
                        </Text>
                        {clip.model_version && (
                            <Badge
                                size="xs"
                                variant="gradient"
                                gradient={{ from: "blue", to: "cyan", deg: 90 }}
                                ml={6}
                            >
                                {clip.model_version}
                            </Badge>
                        )}
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                        {clip.tags}
                    </Text>
                </Stack>
            </Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
                <Text ff="monospace">{formatSecondsToTime(clip.duration)}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: "center" }}>
                <StatusIcon status={clip.status} />
            </Table.Td>
        </Table.Tr>
    );
}