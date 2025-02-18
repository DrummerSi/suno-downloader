import { ActionIcon, Button, ComboboxItem, Divider, Group, Modal, Select, Stack } from "@mantine/core"
import { useEffect, useState } from "react"

import { IconAdjustments } from "@tabler/icons-react"
import { Settings } from "../services/SettingsManager"
import { useDisclosure } from "@mantine/hooks"

const SettingsPanel = () => {

    const [opened, { open, close }] = useDisclosure(false)

    const [nameTemplate, setNameTemplate] = useState<ComboboxItem | null>(null)         //Name format
    const [overwriteFiles, setOverwriteFiles] = useState<ComboboxItem | null>(null)     //Do we overwrite existing files
    const [embedImages, setEmbedImages] = useState<ComboboxItem | null>(null)           //Do we embed images in mp3 files


    const closeModal = async () => {

        const settings = {
            name_templates: nameTemplate.value,
            overwrite_files: overwriteFiles.value,
            embed_images: embedImages.value
        }
        console.log(settings)
        await Settings.saveAll(settings)

        close()
    }

    useEffect(() => {
        (async () => {
            const settings = await Settings.loadAll()
            setNameTemplate({ value: settings.name_templates, label: settings.name_templates })
            setOverwriteFiles({ value: settings.overwrite_files, label: settings.overwrite_files })
            setEmbedImages({ value: settings.embed_images, label: settings.embed_images })
        })()
    }, [])

    return (
        <>
            <ActionIcon variant="subtle" onClick={open}>
                <IconAdjustments style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>

            <Modal
                variant="default" title="Settings" centered size="lg"
                opened={opened} onClose={closeModal}
                closeOnClickOutside={false} closeOnEscape={false}
            >

                <Stack gap={25}>

                    <Select
                        label="File name format"
                        data={[
                            { value: '{trackno} - {name}', label: '{trackno} - {name}' },
                            { value: '{trackno}. {name}', label: '{trackno}. {name}' },
                            { value: '{name}', label: '{name}' }
                        ]}
                        value={nameTemplate ? nameTemplate.value : null}
                        onChange={(_value, option) => setNameTemplate(option)}
                    />

                    <Select
                        label="Overwrite existing files"
                        data={[
                            { value: 'false', label: 'False - Skip existing files' },
                            { value: 'true', label: 'True - Overwrite existing files' },
                        ]}
                        value={overwriteFiles ? overwriteFiles.value : null}
                        onChange={(_value, option) => setOverwriteFiles(option)}
                    />

                    <Select
                        label="Embed song art in mp3 files"
                        data={[
                            { value: 'true', label: 'True - Download and embed artwork' },
                            { value: 'false', label: 'False - Ignore artwork' },
                        ]}
                        value={embedImages ? embedImages.value : null}
                        onChange={(_value, option) => setEmbedImages(option)}
                    />

                </Stack>

                <Divider my="lg" />
                <Group mt="lg" justify="flex-end">
                    <Button onClick={closeModal}>
                        Close
                    </Button>
                </Group>

            </Modal>
        </>
    )
}

export default SettingsPanel