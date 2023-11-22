const Websocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const wss = new Websocket.WebSocket.WebSocketServer({
  path: "/ws/_default",
  port: 8080,
});

const clients = {};

wss.on("connection", function connection(ws) {
  const clientId = uuidv4();
  const data = {
    id: clientId,
    name: generateClientName(),
    ws: ws,
  };
  clients[clientId] = data;
  const message = {
    type: "noti_all_client",
    data: [],
  };
  //loop through clients attribute, add each client to message.data, remove the ws attribute
  for (const key in clients) {
    if (Object.hasOwn(clients, key)) {
      const client = clients[key];
      message.data.push({
        id: client.id,
        name: client.name,
      });
    }
  }

  const selfMessage = {
    type: "noti_self_client",
    data: {
      id: data.id,
      name: data.name,
    },
  };

  wss.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
  ws.send(JSON.stringify(selfMessage));
});

wss.on("close", function close() {
  console.log("disconnected");
});

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
