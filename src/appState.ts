import { FluenceClient } from "fluence/dist/fluenceClient";
import produce from "immer";

export type State = {
  mode: "login" | "host" | "guest";
  peer: string | null;
  form: {
    relay: string;
    name: string;
    remotePeer: string;
  };
  fluenceClient?: FluenceClient;
  hostService?;
  guestService?;
  roomContent: {
    text: string;
    people: Array<{
      name: string;
      peerId: string;
    }>;
  };
};

export type Action =
  | { type: "connected"; client: FluenceClient }
  | { type: "changeMode"; value: "login" | "host" | "guest" }
  | { type: "set"; field: string; value: string }
  | { type: "setPeer"; peer: string }
  | { type: "changeText"; value: string; isRemote: boolean }
  | {
      type: "changePeople";
      value: Array<{
        name: string;
        peerId: string;
      }>;
    }
  | { type: "newUser"; payload: { name: string; peer: string } };

export const initialState: State = {
  mode: "login",
  peer: null,
  form: {
    // relay: "",
    relay:
      "/dns4/stage.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9",
    // name: "",
    name: "test",
    remotePeer: "",
  },
  roomContent: {
    text: "",
    people: [],
  },
};

export const reducer = (state: State, action: Action): State => {
  if (action.type === "changeMode") {
    return {
      ...state,
      mode: action.value,
    };
  }

  if (action.type === "newUser") {
    return produce(state, (draft) => {
      draft.roomContent.people.push({
        name: action.payload.name,
        peerId: action.payload.peer,
      });
    });
  }

  if (action.type === "connected") {
    return {
      ...state,
      fluenceClient: action.client,
    };
  }

  if (action.type === "set") {
    return produce(state, (draft) => {
      draft.form[action.field] = action.value;
    });
  }

  if (action.type === "setPeer") {
    return {
      ...state,
      peer: action.peer,
    };
  }

  if (action.type === "changeText") {
    if (state.mode !== "host" && !action.isRemote) {
      return state;
    }

    return produce(state, (draft) => {
      draft.roomContent.text = action.value;
    });
  }

  if (action.type === "changePeople") {
    return produce(state, (draft) => {
      draft.roomContent.people = action.value;
    });
  }

  return state;
};
