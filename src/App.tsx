import React, { useState } from "react";
import "./App.scss";

const start = (id: string) => {
  console.log(id);
};

const connect = (id: string) => {
  console.log(id);
};

const App = () => {
  const [createRoomId, setCreateRoomId] = useState("");
  const [connectRoomId, setConnectRoomId] = useState("");

  return (
    <div className="App">
      <div className="App-content">
        <h1>Create new room</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(createRoomId);
          }}
        >
          <div>
            <input
              type="text"
              value={createRoomId}
              onChange={(e) => setCreateRoomId(e.target.value)}
            />
          </div>
          <div>
            <input type="submit" value="Create" />
          </div>
        </form>
        <br />
        <h1>Connect to existing room</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            connect(connectRoomId);
          }}
        >
          <div>
            <input
              type="text"
              value={connectRoomId}
              onChange={(e) => setConnectRoomId(e.target.value)}
            />
          </div>
          <div>
            <input type="submit" value="Connect" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
