"use client";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { useState, useEffect } from "react";

// List of available company covers (from public/covers)
const COMPANY_COVERS = [
  { label: "Adobe", value: "adobe" },
  { label: "Amazon", value: "amazon" },
  { label: "Facebook", value: "facebook" },
  { label: "Hostinger", value: "hostinger" },
  { label: "Pinterest", value: "pinterest" },
  { label: "Quora", value: "quora" },
  { label: "Reddit", value: "reddit" },
  { label: "Skype", value: "skype" },
  { label: "Spotify", value: "spotify" },
  { label: "Telegram", value: "telegram" },
  { label: "Tiktok", value: "tiktok" },
  { label: "Yahoo", value: "yahoo" },
];

const INTERVIEW_TYPES = [
  { label: "Technical", value: "technical" },
  { label: "Behavioral", value: "behavioral" },
  { label: "Mixed", value: "mixed" },
];

const Page = () => {
  const [userId, setUserId] = useState<any>(null);
  const [form, setForm] = useState({
    role: "",
    type: "",
    level: "",
    techstack: "",
    amount: "5",
    companyName: "", // New field for company name
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError("Failed to generate interview.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-gray-500/30 backdrop-blur-lg rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        Interview Generation
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            What role would you like to train for?
          </label>
          <input
            type="text"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Frontend Developer"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            Are you aiming for a technical, behavioral, or mixed interview?
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type</option>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            The job experience level
          </label>
          <input
            type="text"
            name="level"
            value={form.level}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Junior, Mid, Senior"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            A list of technologies to cover during the job interview.
          </label>
          <input
            type="text"
            name="techstack"
            value={form.techstack}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. React, Node.js, SQL"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            How many questions would you like me to prepare for you?
          </label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            min={1}
            max={10}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            Select a company for which you want to prepare (optional)
          </label>
          <select
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="generic">No company selected</option>
            {COMPANY_COVERS.map((cover) => (
              <option key={cover.value} value={cover.value}>
                {cover.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Interview"}
        </button>

        {success && (
          <p className="text-green-600 text-center font-medium mt-2">
            Interview generated successfully!
          </p>
        )}
        {error && (
          <p className="text-red-600 text-center font-medium mt-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default Page;
