import { ChangeEvent, useRef, useState, useEffect } from "react";
import { FiSend, FiPaperclip } from "react-icons/fi";
import { TypingIndicator } from "@chatscope/chat-ui-kit-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import logo from "./assets/img/cybergoat.png";
import React from "react";

const Chat = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<
    { message: string; sender: string; direction: string; error: boolean }[]
  >([]);
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleAttachClick = () => {
    if (hiddenFileInput.current) {
      hiddenFileInput.current.click();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileUploaded = event.target.files?.[0];
    if (fileUploaded) {
      handleFile(fileUploaded);
    }
  };

  const handleFile = (file: File) => {
    console.log("File uploaded name:" + file.name);
  };

  const handleUserMessage = async (userMessage: string) => {
    const newUserMessage = {
      message: userMessage,
      sender: "user",
      direction: "outgoing",
      error: false,
    };

    const updatedChatMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedChatMessages);
    setIsChatbotTyping(true);

    await processUserMessageForGoogle(updatedChatMessages);
  };

  async function processUserMessageForGoogle(messages: any[]) {
    let contents = messages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "user") {
        role = "user";
      } else {
        role = "model";
      }
      let msg = messageObject.message;
      return { role: role, parts: [{ text: msg }] };
    });

    const apiRequestBody = {
      contents,
    };

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?alt=sse&key=" +
          process.env.REACT_APP_GOOGLE_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiRequestBody),
        }
      );
      if (!response.ok || !response.body) {
        throw response.statusText;
      }

      const newStreamMessage = {
        message: "",
        sender: "model",
        direction: "incoming",
        error: false,
      };
      const chatMessagesWithResponse = [...messages, newStreamMessage];
      const latestModelMessageIndex = chatMessagesWithResponse.length - 1;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let loopRunner = true;

      while (loopRunner) {
        const { value, done } = await reader.read();
        if (done) {
          setIsChatbotTyping(false);
          break;
        }

        const decodedChunk = decoder.decode(value, { stream: true });
        const cleanedDecodedChunk = decodedChunk.replace(/^data:\s*/, "");
        let messagePart = "";
        let errorFlag = false;

        try {
          messagePart = JSON.parse(cleanedDecodedChunk).candidates[0].content
            .parts[0].text;
        } catch {
          messagePart = "Error retrieving results";
          errorFlag = true;
        }

        chatMessagesWithResponse[
          latestModelMessageIndex
        ].message += messagePart;
        if (errorFlag) {
          chatMessagesWithResponse[latestModelMessageIndex].error = true;
        }
        setChatMessages([...chatMessagesWithResponse]);
      }
    } catch (error) {
      console.log(error);
      setChatMessages([
        ...messages,
        {
          message: "Error retrieving message",
          sender: "model",
          direction: "incoming",
          error: true,
        },
      ]);
      setIsChatbotTyping(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUserMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <>
      <section id="chat-section" className="chat-section">
       
      </section>
      <input
        type="file"
        onChange={handleFileChange}
        ref={hiddenFileInput}
        style={{ display: "none" }} // Make the file input element invisible
      />
    </>
  );
};

export default Chat;
