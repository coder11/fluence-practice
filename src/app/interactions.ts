import {
  connectToRelay,
  createGuestService,
  createHostService,
  joinRoom,
  leaveRoom,
  notifyAllTextChanged,
  deleteServices,
} from "../fluence";
import "./App.scss";

import { State, Action } from "./appState";

export const connect = async (
  relay: string,
  peer: string,
  dispatch: React.Dispatch<Action>
) => {
  const client = await connectToRelay(relay, peer);
  console.log("conencted, ", client);
  dispatch({
    type: "connected",
    client: client,
  });
};

export const createRoom = async (
  state: State,
  dispatch: React.Dispatch<Action>
) => {
  const hostService = await createHostService(state, dispatch);
  dispatch({
    type: "setServices",
    hostService: hostService,
  });

  dispatch({
    type: "changeMode",
    value: "host",
  });

  dispatch({
    type: "changeRoute",
    value: "app",
  });
};

export const doJoinRoom = async (
  state: State,
  dispatch: React.Dispatch<Action>
) => {
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

  dispatch({
    type: "changeRoute",
    value: "app",
  });
};

export const back = async (state: State, dispatch: React.Dispatch<Action>) => {
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
    type: "changeRoute",
    value: "join",
  });
};

export const changeText = (
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
