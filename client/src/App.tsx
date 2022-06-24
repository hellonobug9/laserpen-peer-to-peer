import { useState, useRef, useEffect } from "react";
import "./App.css";
import Canvas from "./reuseable/Canvas";

function App() {
  const wsRef = useRef<WebSocket | null>(null);
  const [localId, setLocalId] = useState(null);
  const [myPeer, setMyPeer] = useState<any>(null);
  const [peerIds, setPeerIds] = useState<string[]>([]);
  const peerConnections = useRef<any>({});
  const laserRef = useRef<any>(null);

  const onPeerData = (id: any, data: any) => {
    // console.log(`${data} from `, id);
    // console.log('laserRef', laserRef.current);
    const {x, y}= JSON.parse(data)
    laserRef.current.addPointFromMsg(x, y)
  };

  const connect = () => {
    // cleanup peer connections not in peer ids
    Object.keys(peerConnections.current).forEach((id) => {
      if (!peerIds.includes(id)) {
        peerConnections.current[id]?.close();
        delete peerConnections.current[id];
      }
    });

    peerIds.forEach((id) => {
      if (id === localId || peerConnections.current[id]) {
        return;
      }
      let conn = myPeer.connect(id);
      // console.log('tao moi connection', conn);
      conn.on("data", (data: any) => {
        onPeerData(conn.peer, data);
      });
      peerConnections.current[id] = conn;
      // console.log('luu connection', peerConnections.current);
    });
  };

  const broadcast = (data: any) => {
    Object.values(peerConnections.current).forEach((peer: any) => {
      // console.log("broadcast peer", peer);
      if (peer) {
        peer.send(JSON.stringify(data));
      }
    });
  };

  const connetcWs = () => {
    const ws = new WebSocket("ws://localhost:5000/ws");
    // websocket onopen event listener
    ws.onopen = () => {
      console.log("connected websocket main component");
      wsRef.current = ws;
    };

    ws.onmessage = (evt) => {
      // listen to data sent from the websocket server
      let data = JSON.parse(evt.data);
      switch (data.type) {
        case "connection":
          const peer = new window.Peer(data.id);
          peer.on("connection", function (conn: any) {
            // console.log('nhan duoc connection', conn);
            conn.on("data", (data: any) => {
              onPeerData(conn.peer, data);
            });
            if (!peerConnections.current[conn.peer]) {
              peerConnections.current[conn.peer] = conn;
              // console.log('luu connection', peerConnections.current);
            }
          });
          setMyPeer(peer);
          setLocalId(data.id);
          break;
        case "ids":
          setPeerIds(data.ids);
          break;
      }
    };

    // websocket onclose event listener
    ws.onclose = (e) => {
      console.log(
        `Socket is closed. Reconnect will be attempted in
        e.reason`
      );
    };
    // websocket onerror event listener
    ws.onerror = (err) => {
      console.error("Socket encountered error: ", err, "Closing socket");
      ws.close();
    };
  };

  useEffect(() => {
    connetcWs();
    // console.log('laserRef', laserRef.current);
  }, []);

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
   
  }, [peerIds]);
  
  return (
    <div style={{ width: "100vw", height: "100vh" }} className="App">
      <button onClick={() => broadcast("hello ae")}>Press me</button>
      <Canvas ref={laserRef} broadcast={broadcast}/>
    </div>
  );
}

export default App;