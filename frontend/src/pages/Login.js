import React, { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    try {
      await axios.post("http://localhost:5002/login", { username, password });
      setStep(2);
      setMsg("OTP sent to your email");
    } catch (err) {
      setMsg(err.response.data.error);
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post("http://localhost:5002/verify-otp", { username, otp });
      setMsg(res.data.message);
    } catch (err) {
      setMsg(err.response.data.error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {step === 1 ? (
        <>
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
        </>
      ) : (
        <>
          <input placeholder="OTP" onChange={e => setOtp(e.target.value)} />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}
      <p>{msg}</p>
    </div>
  );
}
