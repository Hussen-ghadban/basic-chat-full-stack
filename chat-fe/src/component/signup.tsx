import { useState } from "react";
import { arrayBufferToBase64, isValidBase64 } from "../utils/encryption";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("Generating RSA key pair...");
      
      // 1. Generate public/private RSA key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      console.log("Exporting keys...");

      // 2. Export public and private keys
      const exportedPublicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyBase64 = arrayBufferToBase64(exportedPublicKey);

      const exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const privateKeyBase64 = arrayBufferToBase64(exportedPrivateKey);

      // 3. Validate the generated keys
      if (!isValidBase64(publicKeyBase64)) {
        throw new Error("Generated public key is not valid base64");
      }
      
      if (!isValidBase64(privateKeyBase64)) {
        throw new Error("Generated private key is not valid base64");
      }

      console.log("Public key length:", publicKeyBase64.length);
      console.log("Private key length:", privateKeyBase64.length);
      console.log("Public key valid:", isValidBase64(publicKeyBase64));
      console.log("Private key valid:", isValidBase64(privateKeyBase64));

      // 4. Store both in localStorage
      localStorage.setItem("publicKey", publicKeyBase64);
      console.log("Stored public key");
      
      localStorage.setItem("privateKey", privateKeyBase64);
      console.log("Stored private key");

      // 5. Verify storage worked correctly
      const storedPublicKey = localStorage.getItem("publicKey");
      const storedPrivateKey = localStorage.getItem("privateKey");
      
      if (storedPublicKey !== publicKeyBase64) {
        throw new Error("Public key storage verification failed");
      }
      
      if (storedPrivateKey !== privateKeyBase64) {
        throw new Error("Private key storage verification failed");
      }

      console.log("Key storage verified successfully");

      // 6. Send public key + signup info to backend
      console.log("Sending signup request to backend...");
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          publicKey: publicKeyBase64,
        }),
      });

      const result = await response.json();
      console.log("Backend response:", result);

      if (!response.ok) throw new Error(result.message || "Signup failed");

      // 7. Store user ID for session use
      if (result.data && result.data.id) {
        localStorage.setItem("userId", result.data.id);
        console.log("Stored user ID:", result.data.id);
      }

      setMessage("Signup successful! Keys generated and stored.");
      console.log("Signup completed successfully");
    } catch (err: any) {
      console.error("Signup error:", err);
      setMessage(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 mx-auto mt-10">
        <h2 className="text-xl font-bold">Sign Up</h2>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        {message && <p className={message.includes("successful") ? "text-green-600" : "text-red-600"}>{message}</p>}
      </form>
      <h2>
        <a href="/users" className="text-blue-500 hover:underline">Go to Users</a>
      </h2>
    </div>
  );
}