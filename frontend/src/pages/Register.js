import React, { useState } from "react";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5001/register", {
        username, email, password
      });
      setMsg(res.data.message);
    } catch (err) {
      setMsg(err.response.data.error);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister}>Register</button>
      <p>{msg}</p>
    </div>
  );
}
