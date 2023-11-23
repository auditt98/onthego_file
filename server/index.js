const Websocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const wss = new Websocket.WebSocket.WebSocketServer({
  path: "/ws/_default",
  port: 8080,
});

const clients = {};

const handleFileReceive = (buffer) => {
  // Convert the ArrayBuffer to a string
  const decoder = new TextDecoder("utf-8");
  const content = decoder.decode(buffer);

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
  const fileContent = buffer.slice(metaDataEndIndex + 4); // +4 for the length of "\r\n\r\n"
  if (metaData) {
    const recipient = metaData.recipient;
    //send a message to recipient
    const recipientClient = clients[recipient];
    if (!recipientClient) {
      return;
    } else {
      console.log("content", fileContent);
      const enc = new TextEncoder();
      const buf1 = enc.encode("!");
      const buf2 = enc.encode(JSON.stringify(metaData));
      const buf3 = enc.encode("\r\n\r\n");
      const sendData = new Uint8Array(
        buf1.byteLength + buf2.byteLength + buf3.byteLength + fileContent.byteLength
      );
      sendData.set(new Uint8Array(buf1), 0);
      sendData.set(new Uint8Array(buf2), buf1.byteLength);
      sendData.set(new Uint8Array(buf3), buf1.byteLength + buf2.byteLength);
      sendData.set(
        new Uint8Array(fileContent),
        buf1.byteLength + buf2.byteLength + buf3.byteLength
      );
      recipientClient.ws.send(sendData, {
        binary: true,
      });
    }
  }
  console.log("Metadata:", metaData);
};

const handleTextReceive = (data) => {
  // Convert ArrayBuffer to string
  const textData = Buffer.from(data).toString("utf8");

  // Parse string to object
  try {
    const object = JSON.parse(textData);
    const sender = object.data.sender;
    const recipient = object.data.recipient;
    const text = object.data.text;

    //find recipient
    const recipientClient = clients[recipient];
    if (!recipientClient) {
      return;
    } else {
      recipientClient.ws.send(
        JSON.stringify({
          type: "text",
          data: {
            sender: sender,
            recipient: recipient,
            text: text,
          },
        })
      );
    }
  } catch (e) {
    console.error("Error parsing text data:", e);
  }
};

const handleMessage = (data) => {
  const buffer = Buffer.from(data);

  if (buffer[0] === "!".charCodeAt(0)) {
    handleFileReceive(buffer);
  } else {
    handleTextReceive(buffer);
  }
};

wss.on("connection", function connection(ws) {
  const clientId = uuidv4();
  const clientName = generateClientName();
  ws.clientId = clientId;
  ws.clientName = clientName;
  ws.on("close", function close(code) {
    delete clients[clientId];
    const updateClientMessage = {
      type: "noti_all_client",
      data: [],
    };
    for (const key in clients) {
      if (Object.hasOwn(clients, key) && key !== clientId) {
        const client = clients[key];
        updateClientMessage.data.push({
          id: client.id,
          name: client.name,
        });
      }
    }
    wss.clients.forEach((client) => {
      if (client.readyState === Websocket.OPEN) {
        const newData = updateClientMessage.data.filter(
          (item) => item.id !== client.clientId
        );
        client.send(
          JSON.stringify({
            type: "noti_all_client",
            data: newData,
          })
        );
      }
    });
  });

  ws.on("message", handleMessage);

  const data = {
    id: clientId,
    name: clientName,
    ws: ws,
  };
  clients[clientId] = data;

  handleNotifyAllClients(clientId);
  handleNotifySelf(data.id, data.name, ws);
});

function handleNotifySelf(id, name, ws) {
  const selfMessage = {
    type: "noti_self_client",
    data: {
      id: id,
      name: name,
    },
  };
  ws.send(JSON.stringify(selfMessage));
}

function handleNotifyAllClients() {
  const message = {
    type: "noti_all_client",
    data: [],
  };
  for (const key in clients) {
    if (Object.hasOwn(clients, key)) {
      const client = clients[key];
      message.data.push({
        id: client.id,
        name: client.name,
      });
    }
  }
  wss.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      const newData = message.data.filter(
        (item) => item.id !== client.clientId
      );
      client.send(
        JSON.stringify({
          type: "noti_all_client",
          data: newData,
        })
      );
    }
  });
}

function generateClientName() {
  const adjectives = [
    "Swift",
    "Mighty",
    "Gentle",
    "Brave",
    "Calm",
    "Bright",
    "Tiny",
    "Massive",
    "Silent",
    "Loud",
    "Quick",
    "Lazy",
    "Wise",
    "Young",
    "Ancient",
    "Happy",
    "Sad",
    "Serene",
    "Fierce",
    "Bold",
    "Shy",
    "Friendly",
    "Hostile",
    "Warm",
    "Cold",
    "Sharp",
    "Soft",
    "Sleek",
    "Rough",
    "Tender",
    "Curious",
    "Clever",
    "Strong",
    "Weak",
    "Lively",
    "Graceful",
    "Clumsy",
    "Eager",
    "Weary",
    "Vibrant",
    "Honest",
    "Sly",
    "Loyal",
    "Rebel",
    "Proud",
    "Modest",
    "Fancy",
    "Plain",
    "Rustic",
    "Polished",
  ];

  const nouns = [
    "Tiger",
    "Eagle",
    "Panda",
    "Lion",
    "Falcon",
    "Wolf",
    "Fox",
    "Bear",
    "Shark",
    "Dolphin",
    "Owl",
    "Deer",
    "Rabbit",
    "Hawk",
    "Sparrow",
    "Python",
    "Panther",
    "Leopard",
    "Cheetah",
    "Gazelle",
    "Hippo",
    "Koala",
    "Kangaroo",
    "Giraffe",
    "Zebra",
    "Elephant",
    "Rhino",
    "Horse",
    "Donkey",
    "Camel",
    "Chameleon",
    "Alligator",
    "Turtle",
    "Frog",
    "Snail",
    "Butterfly",
    "Bee",
    "Ant",
    "Spider",
    "Beetle",
    "Squirrel",
    "Rat",
    "Mouse",
    "Hedgehog",
    "Raccoon",
    "Penguin",
    "Seal",
    "Walrus",
    "Whale",
    "Octopus",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${noun}`;
}
