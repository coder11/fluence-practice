import Fluence from "fluence";
import { build } from "fluence/dist/particle";
import { ServiceMultiple } from "fluence/dist/service";
import { registerService } from "fluence/dist/globalState";
import { seedToPeerId } from "fluence/dist/seed";
import { FluenceClient } from "fluence/dist/fluenceClient";

export const collabServiceId = "collabService";

export const connectToRelay = async (relay: string, peer: string) => {
  const peerId = await seedToPeerId(peer);
  const client = await Fluence.connect(relay, peerId);
  return client;
};

interface roomState {
  host: string;
  people: string[];
}

export const createRoom = async () => {
  let roomState: roomState = {
    host: "host",
    people: [],
  };
  const service = new ServiceMultiple(collabServiceId);

  service.registerFunction("login", (args: any[]) => {
    const [userName] = args;
    roomState.people.push(userName);
    console.log(roomState);
    return {};
  });

  registerService(service);

  return [service, roomState] as const;
};

export const joinRoom = async (
  client: FluenceClient,
  remotePeer: string,
  name: string
) => {
  const remotePeerId = await seedToPeerId(remotePeer);

  let script = `
  (seq 
    (call relay ("op" "identity") [])
    (call remotePeerId (serviceId "login") [name]))`;

  const data = new Map();
  data.set("name", name);
  data.set("serviceId", collabServiceId);
  data.set("relay", client.connection.nodePeerId.toB58String());
  data.set("remotePeerId", remotePeerId.toB58String());

  let particle = await build(client.selfPeerId, script, data);
  await client.executeParticle(particle);
};

//}

export const exitRoom = () => {
  // hhhm close the server probably
};
