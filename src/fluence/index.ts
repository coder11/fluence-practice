import Fluence from "fluence";
import { build } from "fluence/dist/particle";
import { ServiceMultiple } from "fluence/dist/service";
import { registerService, deleteService } from "fluence/dist/globalState";
import { peerIdToSeed, seedToPeerId } from "fluence/dist/seed";
import { Action, Person, State } from "src/app/appState";
import { FluenceClient } from "fluence/dist/fluenceClient";

export const hostServiceId = "collabServiceHost";
export const guestServiceId = "collabServiceGuest";

export const connectToRelay = async (relay: string, peer: string) => {
  const peerId = await seedToPeerId(peer);
  const client = await Fluence.connect(relay, peerId);
  return client;
};

export const createHostService = async (
  state: State,
  dispatch: React.Dispatch<Action>
) => {
  const service = new ServiceMultiple(hostServiceId);

  service.registerFunction("join", (args: any[]) => {
    const [userName, peer] = args;
    dispatch({
      type: "newUser",
      payload: {
        name: userName,
        peer: peer,
      },
    });

    return {
      peopleInChat: state.roomContent.people,
      initialText: state.roomContent.text,
    };
  });

  service.registerFunction("leave", (args: any[]) => {
    const [peer] = args;
    dispatch({
      type: "userLeft",
      payload: {
        peer: peer,
      },
    });

    return {
      peopleInChat: state.roomContent.people,
    };
  });

  registerService(service);

  return service;
};

export const createGuestService = async (
  state: State,
  dispatch: React.Dispatch<Action>
) => {
  const service = new ServiceMultiple(guestServiceId);

  service.registerFunction("notifyTextChanged", (args: any[]) => {
    const [text] = args;
    dispatch({
      type: "changeText",
      value: text,
      isRemote: true,
    });

    return {};
  });

  service.registerFunction("notifyPeopleListChanged", (args: any[]) => {
    const [people] = args;
    dispatch({
      type: "changeRoomState",
      people: people,
    });

    return {};
  });

  registerService(service);

  return service;
};

export const joinRoom = async (
  state: State,
  dispatch: React.Dispatch<Action>
) => {
  const { name, remotePeer } = state.form;
  const client = state.fluenceClient;

  if (!name || !remotePeer || !client) {
    return;
  }

  const remotePeerId = await seedToPeerId(state.form.remotePeer);
  const myPeer = peerIdToSeed(state.fluenceClient!.selfPeerId);

  let script = `
  (seq 
    (call relay ("op" "identity") [])
    (call remotePeerId (serviceId "join") [name peer] result))`;

  const data = new Map();
  data.set("name", name);
  data.set("peer", myPeer);
  data.set("serviceId", hostServiceId);
  data.set("relay", client.connection.nodePeerId.toB58String());
  data.set("remotePeerId", remotePeerId.toB58String());

  let particle = await build(client.selfPeerId, script, data);
  await client.executeParticle(particle);
};

export const deleteServices = (...services) => {
  for (let service of services) {
    if (service) {
      deleteService(service);
    }
  }
};

export const leaveRoom = async (client: FluenceClient, remotePeer: string) => {
  const remotePeerId = await seedToPeerId(remotePeer);
  const myPeer = peerIdToSeed(client.selfPeerId);

  let script = `
  (seq 
    (call relay ("op" "identity") [])
    (call remotePeerId (serviceId "leave") [peer] result))`;

  const data = new Map();
  data.set("peer", myPeer);
  data.set("serviceId", hostServiceId);
  data.set("relay", client.connection.nodePeerId.toB58String());
  data.set("remotePeerId", remotePeerId.toB58String());

  let particle = await build(client.selfPeerId, script, data);
  await client.executeParticle(particle);
};

export const notifyAllTextChanged = (state: State, text: string) => {
  if (!state.fluenceClient) {
    return;
  }

  for (let p of state.roomContent.people) {
    notifyTextChanged(state.fluenceClient, p.peerId, text);
  }
};

export const notifyTextChanged = async (
  client: FluenceClient,
  peer: string,
  text: string
) => {
  const remotePeerId = await seedToPeerId(peer);

  let script = `
  (seq 
    (call relay ("op" "identity") [])
    (call remotePeerId (serviceId "notifyTextChanged") [text]))`;

  const data = new Map();
  data.set("text", text);
  data.set("serviceId", guestServiceId);
  data.set("relay", client.connection.nodePeerId.toB58String());
  data.set("remotePeerId", remotePeerId.toB58String());

  let particle = await build(client.selfPeerId, script, data);
  await client.executeParticle(particle);
};

export const notifyAllPeopleChanged = (state: State, people: Array<Person>) => {
  if (!state.fluenceClient) {
    return;
  }

  for (let p of state.roomContent.people) {
    notifyPeopleChanged(state.fluenceClient, p.peerId, people);
  }
};

export const notifyPeopleChanged = async (
  client: FluenceClient,
  peer: string,
  people: Array<Person>
) => {
  const remotePeerId = await seedToPeerId(peer);

  let script = `
  (seq 
    (call relay ("op" "identity") [])
    (call remotePeerId (serviceId "notifyTextChanged") [people]))`;

  const data = new Map();
  data.set("people", people);
  data.set("serviceId", guestServiceId);
  data.set("relay", client.connection.nodePeerId.toB58String());
  data.set("remotePeerId", remotePeerId.toB58String());

  let particle = await build(client.selfPeerId, script, data);
  await client.executeParticle(particle);
};
