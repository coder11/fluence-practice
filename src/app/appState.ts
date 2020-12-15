import { FluenceClient } from "fluence/dist/fluenceClient";
import produce from "immer";

export type Route = "create" | "join" | "settings" | "app";

type Mode = "host" | "guest";

export type State = {
  route: Route;
  mode: Mode;
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

export type Person = {
  name: string;
  peerId: string;
};

export type Action =
  | { type: "connected"; client: FluenceClient }
  | { type: "setServices"; hostService?; guestService? }
  | { type: "changeMode"; value: Mode }
  | { type: "changeRoute"; value: Route }
  | { type: "set"; field: string; value: string }
  | { type: "setPeer"; peer: string }
  | { type: "changeText"; value: string; isRemote: boolean }
  | {
      type: "changeRoomState";
      mode?: Mode;
      text?: string;
      people?: Array<Person>;
    }
  | { type: "newUser"; payload: { name: string; peer: string } }
  | { type: "userLeft"; payload: { peer: string } };

export const initialState: State = {
  route: "join",
  mode: "host",
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

  if (action.type === "changeRoute") {
    return {
      ...state,
      route: action.value,
    };
  }

  if (action.type === "userLeft") {
    return produce(state, (draft) => {
      const newPeople = draft.roomContent.people.filter(
        (x) => x.peerId !== action.payload.peer
      );

      draft.roomContent.people = newPeople;
    });
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

  if (action.type === "setServices") {
    return {
      ...state,
      hostService: action.hostService,
      guestService: action.guestService,
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

  if (action.type === "changeRoomState") {
    return produce(state, (draft) => {
      if (action.people) {
        draft.roomContent.people = action.people;
      }

      if (action.mode) {
        draft.mode = action.mode;
      }

      if (action.text) {
        draft.roomContent.text = action.text;
      }
    });
  }

  return state;
};
