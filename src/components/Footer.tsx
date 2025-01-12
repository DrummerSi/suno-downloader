import { Box, Button, Divider, Flex, Group, Stack } from "@mantine/core"
import { FC, useEffect, useRef, useState } from "react"
import { IconBrandGithub, IconCoffee } from "@tabler/icons-react"

import { useScrollIntoView } from "@mantine/hooks"

interface Props {
    firstComponent: JSX.Element
    secondComponent: JSX.Element
    currentView: 1 | 2
}
const Footer: FC<Props> = (props) => {

    const { firstComponent, secondComponent, currentView } = props

    // Scroll hook
    const { targetRef: containerRef } = useScrollIntoView<HTMLDivElement>();


    // Handler to toggle scrolling
    // const toggleView = () => {
    //     const container = containerRef.current;
    //     if (!container) return;

    //     if (isFirstVisible) {
    //         container.scrollTo({
    //             top: container.offsetHeight, // Scroll to second div
    //             behavior: 'smooth',
    //         });
    //     } else {
    //         container.scrollTo({
    //             top: 0, // Scroll back to first div
    //             behavior: 'smooth',
    //         });
    //     }

    //     setIsFirstVisible((prev) => !prev);
    // };

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const targetScrollTop = currentView === 1 ? 0 : container.offsetHeight
        //console.log("SCROLL TO", targetScrollTop)
        container.scrollTo({
            top: targetScrollTop,
            behavior: "smooth"
        })
    }, [currentView])


    return (
        <Box
            ref={containerRef}
            h={40}
            bg="dark.8"
            style={{
                overflow: "hidden", // Scrollable if content exceeds
                padding: "0.4rem", // Optional padding
                borderRadius: "0.5rem",
                flexFlow: "column"
            }}
        >
            <Stack>
                <Flex
                    //ref={firstDiv.targetRef}
                    justify="center"
                    wrap="nowrap"
                    align="center"
                >
                    {firstComponent}
                </Flex>
                <Flex
                    //ref={secondDiv.targetRef}
                    justify="center"
                    wrap="nowrap"
                    align="center"
                >
                    {secondComponent}
                </Flex>
            </Stack>
        </Box>
    )
}

export default Footer

