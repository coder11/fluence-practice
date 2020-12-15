import "./App.scss";

import React, { useEffect, useReducer, useState } from "react";
import Fluence from "fluence";
import { peerIdToSeed } from "fluence/dist/seed";
import { reducer, initialState, Route, Action, State } from "./appState";
import {
  doJoinRoom,
  back,
  changeText,
  connect,
  createRoom,
} from "./interactions";

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

const Tab: React.FunctionComponent<{
  route: Route;
  currentRoute: Route;
  dispatch: React.Dispatch<Action>;
}> = (props) => {
  const className =
    props.route === props.currentRoute ? "Tab Tab--selected" : "Tab";

  return (
    <div
      className={className}
      onClick={() => {
        props.dispatch({
          type: "changeRoute",
          value: props.route,
        });
      }}
    >
      {props.children}
    </div>
  );
};

const TabNav: React.FunctionComponent<{
  state: State;
  dispatch: React.Dispatch<Action>;
}> = (props) => {
  return (
    <div className="Welcome-form">
      <div className="Tab-container">
        <Tab
          dispatch={props.dispatch}
          route={"create"}
          currentRoute={props.state.route}
        >
          Create room
        </Tab>
        <Tab
          dispatch={props.dispatch}
          route={"join"}
          currentRoute={props.state.route}
        >
          Join Room
        </Tab>
        <Tab
          dispatch={props.dispatch}
          route={"settings"}
          currentRoute={props.state.route}
        >
          Settings
        </Tab>
      </div>
      {props.children}
    </div>
  );
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

  const connectJsx = (
    <>
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
    </>
  );

  const createJsx = (
    <div>
      <h1>Create new room</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createRoom(state, dispatch);
        }}
      >
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
          <input type="submit" value="Create" disabled={!canCreateRoom} />
        </div>
      </form>
    </div>
  );

  const joinJsx = (
    <>
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
    </>
  );

  const appJsx = (
    <>
      <input
        type="button"
        value="Back"
        onClick={(e) => back(state, dispatch)}
      />
      <div className="Code-container">
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

  const routeMap: Record<Route, JSX.Element> = {
    create: createJsx,
    join: joinJsx,
    settings: connectJsx,
    app: appJsx,
  };

  return (
    <>
      <div className="Header">
        <div>Back button</div>
        <div>Your peerId: {state.peer || ""}</div>
        <div>online status</div>
      </div>
      <div className="Main-content">
        {state.route === "app" ? (
          appJsx
        ) : (
          <TabNav state={state} dispatch={dispatch}>
            {routeMap[state.route]}
          </TabNav>
        )}
      </div>
    </>
  );
};

export default App;
