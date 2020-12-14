import React, { useEffect, useReducer, useState } from "react";
import {
  connectToRelay,
  createGuestService,
  createHostService,
  joinRoom,
  leaveRoom,
  notifyAllTextChanged,
  deleteServices,
} from "./fluence/.";
import "./App.scss";
import Fluence from "fluence";
import { peerIdToSeed } from "fluence/dist/seed";
import { reducer, initialState, State, Action } from "./appState";

const connect = async (state: State, dispatch: React.Dispatch<Action>) => {
  if (!state.form.relay || !state.peer) {
    return;
  }

  const client = await connectToRelay(state.form.relay, state.peer!);
  console.log("conencted, ", client);
  dispatch({
    type: "connected",
    client: client,
  });
};

const start = async (state: State, dispatch: React.Dispatch<Action>) => {
  const hostService = await createHostService(state, dispatch);
  dispatch({
    type: "setServices",
    hostService: hostService,
  });

  dispatch({
    type: "changeMode",
    value: "host",
  });
};

const doJoinRoom = async (state: State, dispatch: React.Dispatch<Action>) => {
  if (!state.fluenceClient || !state.form.remotePeer || !state.form.name) {
    return;
  }

  const guestService = await createGuestService(state, dispatch);
  dispatch({
    type: "setServices",
    guestService: guestService,
  });

  await joinRoom(state, dispatch);

  dispatch({
    type: "changeMode",
    value: "guest",
  });
};

const back = async (state: State, dispatch: React.Dispatch<Action>) => {
  if (state.mode !== "host" && state.fluenceClient && state.form.remotePeer) {
    await leaveRoom(state.fluenceClient!, state.form.remotePeer);
  }

  deleteServices(state.guestService, state.hostService);

  dispatch({
    type: "changeText",
    value: "",
    isRemote: true,
  });

  dispatch({
    type: "changeMode",
    value: "login",
  });
};

const changeText = (
  state: State,
  dispatch: React.Dispatch<Action>,
  newTextValue: string
) => {
  dispatch({
    type: "changeText",
    value: newTextValue,
    isRemote: false,
  });

  if (state.mode === "host") {
    notifyAllTextChanged(state, newTextValue);
  }
};

const usePeer = (disptch: (peerId) => void) => {
  const [peerId, setPeerId] = useState<string | null>(null);

  useEffect(() => {
    if (peerId) {
      return;
    }

    Fluence.generatePeerId()
      .then((x) => {
        const p = peerIdToSeed(x);
        setPeerId(p);
        disptch(p);
      })
      .catch((err) => {
        console.log("Couldn't get peer id", err);
      });

    return () => {};
  });

  return peerId;
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  usePeer((x) => {
    dispatch({
      type: "setPeer",
      peer: x,
    });
  });

  const hasPeer = state.peer !== null;
  const isConnected = hasPeer && state.fluenceClient !== undefined;
  const canClickConnect = hasPeer && state.form.relay.length > 0;
  const canCreateRoom = isConnected;
  const canJoinRoom =
    isConnected &&
    state.form.remotePeer.length > 0 &&
    state.form.name.length > 0;

  const loginJsx = (
    <div className="Login">
      <h1>Server (relay)</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          connect(state, dispatch);
        }}
      >
        <label>Relay:</label>
        <input
          type="text"
          value={state.form.relay}
          onChange={(e) =>
            dispatch({
              type: "set",
              field: "relay",
              value: e.target.value,
            })
          }
        />
        <div>
          <input type="submit" value="Connect" disabled={!canClickConnect} />
        </div>
      </form>
      <h1>Create new room</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(state, dispatch);
        }}
      >
        <div>
          <input type="submit" value="Create" disabled={!canCreateRoom} />
        </div>
      </form>
      <br />
      <h1>Join an existing room</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doJoinRoom(state, dispatch);
        }}
      >
        <div>
          <label>Room peer id: </label>
          <input
            type="text"
            value={state.form.remotePeer}
            onChange={(e) =>
              dispatch({
                type: "set",
                field: "remotePeer",
                value: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={state.form.name}
            onChange={(e) =>
              dispatch({
                type: "set",
                field: "name",
                value: e.target.value,
              })
            }
          />
        </div>
        <div>
          <input type="submit" value="Join" disabled={!canJoinRoom} />
        </div>
      </form>
    </div>
  );

  const appJsx = (
    <>
      <input
        type="button"
        value="Back"
        onClick={(e) => back(state, dispatch)}
      />
      <div className="Container">
        <div className="Code">
          <textarea
            value={state.roomContent.text}
            onChange={(e) => changeText(state, dispatch, e.target.value)}
          />
        </div>
        <div className="Right-pane">
          <h1>People in the chat:</h1>
          <ul>
            {state.roomContent.people.map((person, index) => (
              <li key={index}>
                {person.name} ({person.peerId})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  return (
    <div className="App">
      <div className="Peer-id">Your peerId: {state.peer || ""}</div>
      {state.mode === "login" ? loginJsx : appJsx}
    </div>
  );
};

export default App;
