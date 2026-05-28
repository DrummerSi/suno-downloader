import { Box, Button, Group } from "@mantine/core";
import Logger from "../services/Logger";
import { getSettingsManager } from "../services/SettingsManager";

type Props = {
    footerView: 1 | 2;
    onToggleFooterView: (footerView: 1 | 2) => void;
};

export default function DebugPanel({ footerView, onToggleFooterView }: Props) {
    return (
        <Box mb={20} display="none">
            <hr />
            <Group>
                <h4>Debug commands:</h4>
                <Button
                    onClick={async () => {
                        await Logger.log({
                            noSongs: 12,
                            playlistUrl: "http://www.fred.com",
                        });
                        alert(await Logger.getUserId());
                    }}
                >
                    Send test log
                </Button>
                <Button
                    onClick={async () => {
                        alert(await Logger.getUserId());
                    }}
                >
                    Get user id
                </Button>
                <Button
                    onClick={async () => {
                        const settings = await (await getSettingsManager()).loadAll();
                        console.log(settings);
                    }}
                >
                    Settings test
                </Button>
                <Button onClick={() => onToggleFooterView(footerView === 1 ? 2 : 1)}>Toggle bar</Button>
            </Group>

            <hr />
        </Box>
    );
}