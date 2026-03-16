import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:5003/products").then(res => setProducts(res.data));
  }, []);

  return (
    <div>
      <h2>Products</h2>
      {products.map(p => (
        <div key={p.id} style={{border:"1px solid gray", margin:"10px", padding:"10px"}}>
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <p>${p.price}</p>
          <button onClick={() => navigate("/cart")}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}
