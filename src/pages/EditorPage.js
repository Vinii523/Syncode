import React, { useState, useRef, useEffect } from "react";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { cmtheme } from '../../src/atoms';
import { useRecoilState } from 'recoil';
import { initSocket } from "../socket";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const [them, setThem] = useRecoilState(cmtheme);
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      //Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      //Listeing for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      //Listening for message
      socketRef.current.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
        const chatWindow = document.getElementById("chatWindow");
        var currText = chatWindow.value;
        currText += message;
        chatWindow.value = currText;
        chatWindow.scrollTop = chatWindow.scrollHeight;
      });
    };
    init();
    return () => {
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.SEND_MESSAGE);
      socketRef.current.disconnect();
    };
 
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the room id");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const inputClicked = () => {
    const inputArea = document.getElementById("input");
    inputArea.placeholder = "Enter your input here";
    inputArea.value = "";
    inputArea.disabled = false;
    const inputLabel = document.getElementById("inputLabel");
    const outputLabel = document.getElementById("outputLabel");
    inputLabel.classList.remove("notClickedLabel");
    inputLabel.classList.add("clickedLabel");
    outputLabel.classList.remove("clickedLabel");
    outputLabel.classList.add("notClickedLabel");
  };

  const outputClicked = () => {
    const inputArea = document.getElementById("input");
    inputArea.placeholder =
      "You output will apear here, Click 'Run code' to see it";
    inputArea.value = "";
    inputArea.disabled = true;
    const inputLabel = document.getElementById("inputLabel");
    const outputLabel = document.getElementById("outputLabel");
    inputLabel.classList.remove("clickedLabel");
    inputLabel.classList.add("notClickedLabel");
    outputLabel.classList.remove("notClickedLabel");
    outputLabel.classList.add("clickedLabel");
  };

  const runCode = async () => {
    const lang = document.getElementById("languageOptions").value;
    const input = document.getElementById("input").value;
    const code = codeRef.current;

    toast.loading("Running Code....");

    const encodedParams = new URLSearchParams();
    encodedParams.append("LanguageChoice", lang);
    encodedParams.append("Program", code);
    encodedParams.append("Input", input);

    const apiKey = process.env.REACT_APP_API_KEY || '9e75e9fbecmsh2183d9229645eb4p178d32jsn29ae8bdc14e0';

    const options = {
      method: "POST",
      url: "https://code-compiler.p.rapidapi.com/v2",
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "code-compiler.p.rapidapi.com",
      },
      data: encodedParams, 
    };

    console.log(options);

    try {
      const response = await axios.request(options);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }

    axios
      .request(options)
      .then(function (response) {
        let message = response.data.Result;
        if (message === null) {
          message = response.data.Errors;
        }
        outputClicked();
        document.getElementById("input").value = message;
        toast.dismiss();
        toast.success("Code compilation complete");
      })
      .catch(function (error) {
        toast.dismiss();
        toast.error("Code compilation unsuccessful");
        document.getElementById("input").value =
          "Something went wrong, Please check your code and input.";
      });
  };

  const sendMessage = () => {
    if (document.getElementById("inputBox").value === "") return;
    var message = `> ${location.state?.username}  : ${
      document.getElementById("inputBox").value
    }\n`;
    const chatWindow = document.getElementById("chatWindow");
    var currText = chatWindow.value;
    currText += message;
    chatWindow.value = currText;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    document.getElementById("inputBox").value = "";
    socketRef.current.emit(ACTIONS.SEND_MESSAGE, { roomId, message });
  };

  const handleInputEnter = (key) => {
    if (key.code === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="mainWrap">
      <nav>
          <div className="LOGO">
            SYNCODE COMPILER SUITE
          </div>
          <ul>
            <li>
              <label>
                  <select value={them} onChange={(e) => { setThem(e.target.value); window.location.reload(); }} className="seL1">
                    <option value="default">default</option>
                    <option value="3024-day">3024-day</option>
                    <option value="3024-night">3024-night</option>
                    <option value="abbott">abbott</option>
                    <option value="abcdef">abcdef</option>
                    <option value="ambiance">ambiance</option>
                    <option value="ayu-dark">ayu-dark</option>
                    <option value="ayu-mirage">ayu-mirage</option>
                    <option value="base16-dark">base16-dark</option>
                    <option value="base16-light">base16-light</option>
                    <option value="bespin">bespin</option>
                    <option value="blackboard">blackboard</option>
                    <option value="cobalt">cobalt</option>
                    <option value="colorforth">colorforth</option>
                    <option value="darcula">darcula</option>
                    <option value="duotone-dark">duotone-dark</option>
                    <option value="duotone-light">duotone-light</option>
                    <option value="eclipse">eclipse</option>
                    <option value="elegant">elegant</option>
                    <option value="erlang-dark">erlang-dark</option>
                    <option value="gruvbox-dark">gruvbox-dark</option>
                    <option value="hopscotch">hopscotch</option>
                    <option value="icecoder">icecoder</option>
                    <option value="idea">idea</option>
                    <option value="isotope">isotope</option>
                    <option value="juejin">juejin</option>
                    <option value="lesser-dark">lesser-dark</option>
                    <option value="liquibyte">liquibyte</option>
                    <option value="lucario">lucario</option>
                    <option value="material">material</option>
                    <option value="material-darker">material-darker</option>
                    <option value="material-palenight">material-palenight</option>
                    <option value="material-ocean">material-ocean</option>
                    <option value="mbo">mbo</option>
                    <option value="mdn-like">mdn-like</option>
                    <option value="midnight">midnight</option>
                    <option value="monokai">monokai</option>
                    <option value="moxer">moxer</option>
                    <option value="neat">neat</option>
                    <option value="neo">neo</option>
                    <option value="night">night</option>
                    <option value="nord">nord</option>
                    <option value="oceanic-next">oceanic-next</option>
                    <option value="panda-syntax">panda-syntax</option>
                    <option value="paraiso-dark">paraiso-dark</option>
                    <option value="paraiso-light">paraiso-light</option>
                    <option value="pastel-on-dark">pastel-on-dark</option>
                    <option value="railscasts">railscasts</option>
                    <option value="rubyblue">rubyblue</option>
                    <option value="seti">seti</option>
                    <option value="shadowfox">shadowfox</option>
                    <option value="solarized">solarized</option>
                    <option value="the-matrix">the-matrix</option>
                    <option value="tomorrow-night-bright">tomorrow-night-bright</option>
                    <option value="tomorrow-night-eighties">tomorrow-night-eighties</option>
                    <option value="ttcn">ttcn</option>
                    <option value="twilight">twilight</option>
                    <option value="vibrant-ink">vibrant-ink</option>
                    <option value="xq-dark">xq-dark</option>
                    <option value="xq-light">xq-light</option>
                    <option value="yeti">yeti</option>
                    <option value="yonce">yonce</option>
                    <option value="zenburn">zenburn</option>
                  </select>
                </label>
            </li>
          <li>
            <label>
              <select id="languageOptions" className="seL"  defaultValue={1}>
                <option value="1">C#</option>
                <option value="4">Java</option>
                <option value="5">Python</option>
                <option value="6">C </option>
                <option value="7">C++</option>
                <option value="8">PHP</option>
                <option value="11">Haskell</option>
                <option value="12">Ruby</option>
                <option value="13">Perl</option>
                <option value="17">Javascript</option>
                <option value="20">Golang</option>
                <option value="21">Scala</option>
                <option value="37">Swift</option>
                <option value="38">Bash</option>
                <option value="43">Kotlin</option>
                <option value="60">TypeScript</option>
              </select>
            </label>
          </li>
          <li>
          <button className="btn runBtn" onClick={runCode}>
          Run Code
        </button>
          </li>
        </ul>
      </nav>
      <div className="Main">
      <div className="asideWrap">
        <div className="asideInner">
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>

      <div className="chatWrap">
        <textarea
          id="chatWindow"
          className="chatArea textarea-style"
          placeholder="Chat messages will appear here"
          disabled
        ></textarea>
        <div className="sendChatWrap">
          <input
            id="inputBox"
            type="text"
            placeholder="Type your message here"
            className="inputField"
            onKeyUp={handleInputEnter}
          ></input>
          <button className="btn sendBtn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>

      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
        <div className="IO-container">
          <label
            id="inputLabel"
            className="clickedLabel"
            onClick={inputClicked}
          >
            Input
          </label>
          
          <label
            id="outputLabel"
            className="notClickedLabel"
            onClick={outputClicked}
          >
            Output
          </label>
        </div>
        <textarea
          id="input"
          className="inputArea textarea-style"
          placeholder="Enter your input here"
        ></textarea>
      </div>

      
      </div>
      
    </div>
  );
};

export default EditorPage;
