import React, { useState } from "react";
import axios from "axios";

export default function Payment() {
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const username = "testuser"; // Replace with login session

  const handlePayment = async () => {
    try {
      const res = await axios.post("http://localhost:5004/payment", { username, amount });
      setMsg(res.data.message);
    } catch (err) {
      setMsg(err.response.data.error);
    }
  };

  return (
    <div>
      <h2>Payment</h2>
      <input placeholder="Amount" onChange={e => setAmount(e.target.value)} />
      <button onClick={handlePayment}>Pay</button>
      <p>{msg}</p>
    </div>
  );
}
