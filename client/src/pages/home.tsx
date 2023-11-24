/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Flex, Section, Text, TextField } from "@radix-ui/themes";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import BackgroundCanvas from "../components/BackgroundCanvas";
import Peer from "../components/Peer";
import Modal from "react-modal";
const WS_URL = "ws://localhost:8080/ws/_default";

const CONN_STATUSES = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Open",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
};

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    padding: "0px 20px",
    borderRadius: "10px",
    transform: "translate(-50%, -50%)",
  },
};

function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sendMessage, lastMessage, readyState, sendJsonMessage } =
    useWebSocket(WS_URL);
  const [selfName, setSelfName] = useState("" as string);
  const [selfId, setSelfId] = useState("" as string);
  const [clients, setClients] = useState([] as any[]);
  const [openReceiveTextModal, setOpenReceiveTextModal] = useState(
    false as boolean
  );
  const [openReceiveFileModal, setOpenReceiveFileModal] = useState(
    false as boolean
  );
  const [receivedFile, setReceivedFile] = useState({} as any);
  const [receivedFileSender, setReceivedFileSender] = useState({} as any);
  const [receivedFileMetadata, setReceivedFileMetadata] = useState({} as any);

  const [receivedText, setReceivedText] = useState("" as string);
  const [receivedTextSender, setReceivedTextSender] = useState({} as any);
  const [textCopied, setTextCopied] = useState(false as boolean);

  const [messageHistory, setMessageHistory] = useState([] as any[]);
  const connectionStatus = useMemo(
    () => CONN_STATUSES[readyState],
    [readyState]
  );

  const resolveFileAckRef = useRef(null);

  const handleFileAck = () => {
    if (resolveFileAckRef.current) {
      resolveFileAckRef.current();
      resolveFileAckRef.current = null; // Reset for the next file
    }
  };

  const handleWSMessages = useCallback(async () => {
    if (lastMessage !== null) {
      try {
        const parsedData = JSON.parse(lastMessage.data);
        switch (parsedData.type) {
          case "noti_self_client":
            setSelfName(parsedData.data.name);
            setSelfId(parsedData.data.id);
            break;
          case "noti_all_client":
            setClients(parsedData.data);
            break;
          case "text":
            setReceivedText(parsedData.data.text);
            setReceivedTextSender(parsedData.data.sender);
            setOpenReceiveTextModal(true);
            break;
          case "file_ack":
            handleFileAck();
            break;
          default:
            break;
        }
        setMessageHistory((prev) => prev.concat(lastMessage));
      } catch (error) {
        const receivedData = await lastMessage.data.arrayBuffer();
        const decoder = new TextDecoder("utf-8");
        const content = decoder.decode(receivedData);
        // Find the end of the metadata section
        const metaDataEndIndex = content.indexOf("\r\n\r\n");
        if (metaDataEndIndex === -1) {
          console.error("Invalid buffer format");
          return;
        }

        // Extract the metadata (excluding the initial "!")
        const metaDataString = content.substring(1, metaDataEndIndex);
        let metaData;
        try {
          metaData = JSON.parse(metaDataString);
        } catch (error) {
          console.error("Error parsing metadata:", error);
          return;
        }

        // Extract the file content (remaining part of the buffer)
        const fileContent = receivedData.slice(metaDataEndIndex + 4); // +4 for the length of "\r\n\r\n"
        if (metaData) {
          setReceivedFileSender(metaData.sender);
          setReceivedFileMetadata(metaData);
          setReceivedFile(fileContent);
          setOpenReceiveFileModal(true);
        }
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    handleWSMessages();
  }, [handleWSMessages]);

  const handleTextSend = (text: string, client: any) => {
    sendJsonMessage({
      type: "text",
      data: {
        text,
        sender: {
          id: selfId,
          name: selfName,
        },
        recipient: client.id,
      },
    });
  };

  const encodeData = async (file, metadata) => {
    const enc = new TextEncoder();
    const buf1 = enc.encode("!");
    const buf2 = enc.encode(JSON.stringify(metadata));
    const buf3 = enc.encode("\r\n\r\n");
    const fileBuffer = await file.arrayBuffer();
    const sendData = new Uint8Array(
      buf1.byteLength +
        buf2.byteLength +
        buf3.byteLength +
        fileBuffer.byteLength
    );
    sendData.set(buf1, 0);
    sendData.set(buf2, buf1.byteLength);
    sendData.set(buf3, buf1.byteLength + buf2.byteLength);
    sendData.set(
      new Uint8Array(fileBuffer),
      buf1.byteLength + buf2.byteLength + buf3.byteLength
    );
    return sendData;
  };

  const waitForFileAck = () =>
    new Promise((resolve) => {
      resolveFileAckRef.current = resolve;
    });

  const handleFileSend = async (files: File[], client: any) => {
    console.log("files", files);
    for (const file of files) {
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        sender: {
          id: selfId,
          name: selfName,
        },
        recipient: client.id,
      };
      const sendData = await encodeData(file, metadata);
      sendMessage(sendData);
      await waitForFileAck();
    }
  };

  return (
    <Box
      px={"2"}
      style={{
        backgroundColor: "transparent",
        borderRadius: "var(--radius-3)",
      }}
    >
      <BackgroundCanvas loading={true}></BackgroundCanvas>
      <Section size="1">
        <Flex align={"end"} justify={"end"} gap="3">
          <Text>Status: {connectionStatus}</Text>
        </Flex>
      </Section>

      <Section>
        <Flex justify={"center"} gap="9" wrap={"wrap"} width={"100%"}>
          {clients.map((client, index) => (
            <React.Fragment key={index}>
              <Peer
                client={client}
                onTextSend={handleTextSend}
                onFileSend={async (files) => {
                  await handleFileSend(files, client);
                }}
              ></Peer>
            </React.Fragment>
          ))}
        </Flex>
      </Section>
      {/* Receive file modal */}
      <Modal
        isOpen={openReceiveFileModal}
        onAfterOpen={() => {}}
        onRequestClose={() => {}}
        style={customStyles}
        overlayClassName="Overlay"
        contentLabel="Receive File Modal"
      >
        <h3>
          <span
            style={{
              color: "#2870BD",
            }}
          >
            {receivedFileSender?.name}
          </span>{" "}
          sent you a file
        </h3>
        <Flex
          direction={"column"}
          wrap={"wrap"}
          style={{ height: "300px", overflow: "auto", minWidth: "320px" }}
        >
          <div style={{ margin: "10px" }}>
            <div>{receivedFileMetadata.name}</div>
          </div>
        </Flex>
        <Flex gap={"9"} direction={"row"} justify={"end"} align={"end"}>
          <div
            className="button__cancel"
            onKeyDown={() => {}}
            onClick={() => {
              setOpenReceiveFileModal(false);
              sendJsonMessage({
                type: "file_ack",
                data: {
                  text: "ack",
                  sender: {
                    id: selfId,
                    name: selfName,
                  },
                  recipient: receivedFileSender.id,
                },
              });
            }}
          >
            Ignore
          </div>
          <div
            className="button__send"
            onKeyDown={() => {}}
            onClick={() => {
              const blob = new Blob([receivedFile], {
                type: receivedFileMetadata.type,
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = receivedFileMetadata.name;
              a.click();
              setOpenReceiveFileModal(false);
              sendJsonMessage({
                type: "file_ack",
                data: {
                  text: "ack",
                  sender: {
                    id: selfId,
                    name: selfName,
                  },
                  recipient: receivedFileSender.id,
                },
              });
            }}
          >
            Download
          </div>
        </Flex>
      </Modal>
      {/* Receive text modal */}
      <Modal
        isOpen={openReceiveTextModal}
        onAfterOpen={() => {}}
        onRequestClose={() => {}}
        style={customStyles}
        overlayClassName="Overlay"
        contentLabel="Receive Text Modal"
      >
        <h3>
          <span
            style={{
              color: "#2870BD",
            }}
          >
            {receivedTextSender?.name}
          </span>{" "}
          sent you a message
        </h3>
        <TextField.Root>
          <TextField.Input
            style={{
              fontSize: "20px",
              height: "60px",
              width: "100%",
              minWidth: "320px",
              marginTop: "10px",
              padding: "10px",
            }}
            disabled={true}
            value={receivedText}
            placeholder="Text to send..."
            variant="classic"
          />
        </TextField.Root>
        <Flex gap={"9"} direction={"row"} justify={"end"} align={"end"}>
          <div
            className="button__cancel"
            onClick={() => {
              setOpenReceiveTextModal(false);
            }}
          >
            Close
          </div>
          <div
            className="button__send"
            onClick={() => {
              navigator.clipboard
                .writeText(receivedText)
                .then(() => {
                  console.log("Text successfully copied to clipboard");
                  setTextCopied(true);
                  setTimeout(() => {
                    setTextCopied(false);
                  }, 1500);
                })
                .catch((err) => {
                  console.error("Error in copying text: ", err);
                  setOpenReceiveTextModal(false);
                });
            }}
          >
            {textCopied ? "Copied to clipboard" : "Copy"}
          </div>
        </Flex>
      </Modal>
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
          {selfName && (
            <div>
              You are known as{" "}
              <span
                style={{
                  color: "#2870BD",
                }}
              >
                {selfName}
              </span>
            </div>
          )}
        </Flex>
      </Section>
    </Box>
  );
}

export default Home;
