import { Flex } from "@radix-ui/themes";
import "./Peer.css";
import IconDesktop from "../IconDesktop";

const Peer = ({ client }) => {
  return (
    <Flex
      direction={"column"}
      justify={"center"}
      align={"center"}
      key={client.id}
      className="peer"
    >
      <div
        className="peer-img"
      >
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
  );
};

export default Peer;
