import { Badge, Group, Title } from "@mantine/core"

import { FC } from "react"

interface Props {
    number: string
    title: string
    children?: React.ReactNode
}
const SectionHeading: FC<Props> = (props) => {
    const { number, title, children } = props
    return (
        <Group pb={8} gap={8}>
            <Badge
                circle
                size="lg"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            >{number}</Badge>
            <Title order={4}>{title}</Title>
            {children}
        </Group>
    )
}

export default SectionHeading