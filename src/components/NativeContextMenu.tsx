import { Menu } from "@tauri-apps/api/menu"
import { cloneElement, isValidElement, ReactElement } from "react"

type Props = {
    children: ReactElement<{
        onContextMenu?: React.MouseEventHandler
    }>,
    createMenu: () => Promise<Menu>
}

export function NativeContextMenu({ children, createMenu }: Props) {
    if (!isValidElement(children)) return children

    return cloneElement(children, {
        onContextMenu: async (event: React.MouseEvent) => {
            children.props.onContextMenu?.(event)

            if (event.defaultPrevented) return
            event.preventDefault()

            const menu = await createMenu()
            await menu.popup()
        }
    })
}