import React, { useEffect, useState } from "react";
import { connectToRelay, createRoom, joinRoom } from "./fluence/.";
import "./App.scss";
import Fluence from "fluence";
import { FluenceClient } from "fluence/dist/fluenceClient";
import { peerIdToSeed } from "fluence/dist/seed";

let state: any; //ReturnType<typeof createRoom> | undefined;

let client: FluenceClient;

const start = async () => {
  state = await createRoom();
  console.log(state);
};

const connect = async (relay, peerId: string) => {
  client = await connectToRelay(relay, peerId);
  console.log("conencted, ", client);
};

const doJoinRoom = async (remotePeerId, name) => {
  await joinRoom(client, remotePeerId, name);
};

const usePeer = () => {
  const [peerId, setPeerId] = useState<string | null>(null);

  useEffect(() => {
    if (peerId) {
      return;
    }

    Fluence.generatePeerId()
      .then((x) => setPeerId(peerIdToSeed(x)))
      .catch((err) => {
        console.log("Couldn't get peer id", err);
      });

    return () => {};
  });

  return peerId;
};

const App = () => {
  const [relay, setRelay] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [name, setName] = useState("");
  const peer = usePeer();

  return (
    <div className="App">
      <div className="App-content">
        <div>Your peerId: {peer || ""}</div>
        <h1>Server (relay)</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            connect(relay, peer!);
          }}
        >
          <label>Relay:</label>
          <input
            type="text"
            value={relay}
            onChange={(e) => setRelay(e.target.value)}
          />
          <div>
            <input type="submit" value="Connect" />
          </div>
        </form>
        <h1>Create new room</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <div>
            <input type="submit" value="Create" />
          </div>
        </form>
        <br />
        <h1>Join an existing room</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doJoinRoom(remotePeerId, name);
          }}
        >
          <div>
            <label>Room peer id: </label>
            <input
              type="text"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
            />
          </div>
          <div>
            <label>Name: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <input type="submit" value="Join" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
