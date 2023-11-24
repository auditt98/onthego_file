import { Flex, TextField } from "@radix-ui/themes";
import IconDesktop from "../IconDesktop";
import Modal from "react-modal";
import { useState } from "react";
import { useFilePicker } from "use-file-picker";
import { useLongPress } from "use-long-press";
import "./Peer.css";

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

const Peer = ({ client, onTextSend, onFileSend }) => {
  const [openTextModal, setOpenTextModal] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);

  const longPressBinder = useLongPress(() => {
    setOpenTextModal(true);
  });

  const { openFilePicker, clear } = useFilePicker({
    readAs: "DataURL",
    accept: "*",
    multiple: true,
    validators: [],
    readFilesContent: false,
    onFilesSelected: (data) => {
      console.log("data", data.plainFiles);
      setFiles(data?.plainFiles);
    },
  });

  const handlePeerClick = (e) => {
    if (e.type === "click") {
      openFilePicker();
    } else if (e.type === "contextmenu") {
      e.preventDefault();
      setOpenTextModal(true);
    }
  };

  return (
    <>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        key={client.id}
        className="peer"
        onClick={(e) => {
          handlePeerClick(e);
        }}
        {...longPressBinder}
        onContextMenu={(e) => {
          handlePeerClick(e);
        }}
      >
        <div className="peer-img">
          <IconDesktop width="48" height="48"></IconDesktop>
        </div>
        <div
          style={{
            marginTop: "10px",
            width: "120px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center",
          }}
        >
          {client.name}
        </div>
      </Flex>
      {/* File Modal */}
      <Modal
        isOpen={files.length > 0}
        onAfterOpen={() => {}}
        onRequestClose={() => {}}
        style={customStyles}
        overlayClassName="Overlay"
        contentLabel="File Modal"
      >
        <h2>Send files</h2>
        <Flex
          direction={"column"}
          wrap={"wrap"}
          style={{ height: "300px", overflow: "auto", minWidth: "320px" }}
        >
          {files.map((file, index) => (
            <div key={index} style={{ margin: "10px" }}>
              <div>{file.name}</div>
            </div>
          ))}
        </Flex>
        <Flex gap={"9"} direction={"row"} justify={"end"} align={"end"}>
          <div
            className="button__cancel"
            onClick={() => {
              setFiles([]);
              clear();
            }}
          >
            Cancel
          </div>
          <div
            className="button__send"
            onClick={() => {
              onFileSend(files, client);
              setFiles([]);
              clear();
            }}
          >
            Send
          </div>
        </Flex>
      </Modal>
      {/* Text modal */}
      <Modal
        isOpen={openTextModal}
        onAfterOpen={() => {}}
        onRequestClose={() => {}}
        style={customStyles}
        overlayClassName="Overlay"
        contentLabel="Example Modal"
      >
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
            onChange={(event) => {
              setText(event.target.value);
            }}
            value={text}
            placeholder="Text to send..."
            variant="classic"
          />
        </TextField.Root>
        <Flex gap={"9"} direction={"row"} justify={"end"} align={"end"}>
          <div
            className="button__cancel"
            onClick={() => {
              setOpenTextModal(false);
              setText("");
            }}
            onKeyDown={() => {}}
          >
            Cancel
          </div>
          <div
            className="button__send"
            onClick={() => {
              onTextSend(text, client);
              setText("");
              setOpenTextModal(false);
            }}
          >
            Send
          </div>
        </Flex>
      </Modal>
    </>
  );
};

export default Peer;
