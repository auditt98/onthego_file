/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Flex, Section, Text } from "@radix-ui/themes";
import { useEffect, useMemo, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import BackgroundCanvas from "../components/BackgroundCanvas";

const WS_URL = "ws://localhost:8080/ws/_default";

const CONN_STATUSES = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Open",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
};

function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL);
  const [selfName, setSelfName] = useState("" as string);
  const [selfId, setSelfId] = useState("" as string);
  const [messageHistory, setMessageHistory] = useState([] as any[]);
  const connectionStatus = useMemo(
    () => CONN_STATUSES[readyState],
    [readyState]
  );

  useEffect(() => {
    if (lastMessage !== null) {
      console.log("lastMessage", lastMessage);
      const parsedData = JSON.parse(lastMessage.data);
      if (parsedData.type === "noti_self_client") {
        setSelfName(parsedData.data.name);
        setSelfId(parsedData.data.id);
      }
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage, setMessageHistory]);

  return (
    <Box
      px={"2"}
      style={{
        backgroundColor: "transparent",
        borderRadius: "var(--radius-3)",
        height: "100%",
      }}
    >
      <BackgroundCanvas loading={true}></BackgroundCanvas>
      <Section size="1">
        <Flex align={"end"} justify={"end"} gap="3">
          <Text>Status: {connectionStatus}</Text>
        </Flex>
      </Section>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{message ? message.data : null}</span>
        ))}
      </ul>
      <Section
        size="1"
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Flex direction={"column"} justify={"center"} align={"center"} pb={"5"}>
          <img width={80} height={80} src={"/assets/logo.png"}></img>
					{selfName && <div>You are known as <span style={{
						color: "#2870BD"
					}}>{selfName}</span></div>}
        </Flex>
      </Section>
    </Box>
  );
}

export default Home;