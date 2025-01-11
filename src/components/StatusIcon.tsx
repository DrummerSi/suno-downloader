import { IconCheck, IconSquareRoundedCheckFilled, IconSquareRoundedXFilled } from "@tabler/icons-react"
import { Loader, Text } from "@mantine/core"

import { FC } from "react"
import { IPlaylistClipStatus } from "../services/Suno"

interface Props {
    status: IPlaylistClipStatus
}

const StatusIcon: FC<Props> = (props) => {
    const { status } = props
    switch (status) {
        case IPlaylistClipStatus.None:
            return null

        case IPlaylistClipStatus.Processing:
            return <Loader size="xs" />

        case IPlaylistClipStatus.Success:
            return <Text c="green" mt={6}>
                <IconSquareRoundedCheckFilled />
            </Text>

        case IPlaylistClipStatus.Error:
            return <Text c="red" mt={6}>
                <IconSquareRoundedXFilled />
            </Text>

        default:
            return null
    }
}

export default StatusIcon