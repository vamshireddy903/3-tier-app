import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const username = "testuser"; // Replace with login session

  useEffect(() => {
    axios.get(`http://localhost:5003/cart/view/${username}`).then(res => setCart(res.data));
  }, []);

  return (
    <div>
      <h2>Cart</h2>
      {cart.map(c => (
        <div key={c.id} style={{border:"1px solid gray", margin:"10px", padding:"10px"}}>
          <h3>{c.name}</h3>
          <p>Quantity: {c.quantity}</p>
          <p>Price: ${c.price}</p>
        </div>
      ))}
    </div>
  );
}
