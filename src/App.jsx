import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import "./App.css";

// ==================== STORAGE ====================

const STORAGE_KEY = "foodRescueDonations";

const getDonations = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const saveDonations = (donations) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
};
// Convert pickup address into map coordinates
const getCoordinates = async (address) => {
  if (!address.trim()) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`
    );

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
    };
  } catch (error) {
    console.error("Location lookup failed:", error);
    return null;
  }
};

// ==================== AI MATCHING ENGINE ====================

const calculateMatchScore = (donation) => {
  let score = 60;

  const qty = Number(donation.quantity);
  if (qty >= 20) score += 10;
  else if (qty >= 10) score += 7;
  else score += 4;

  if (donation.category === "Cooked Food") score += 10;
  if (donation.category === "Packaged Food") score += 5;

  if (donation.expiryTime) {
    const hoursRemaining =
      (new Date(donation.expiryTime) - new Date()) / (1000 * 60 * 60);

    if (hoursRemaining <= 2) score += 15;
    else if (hoursRemaining <= 5) score += 10;
    else if (hoursRemaining <= 12) score += 5;
  }

  return Math.min(score, 99);
};

const getUrgencyLevel = (expiryTime) => {
  if (!expiryTime) return { label: "Unknown", className: "urgency-normal" };

  const hoursRemaining =
    (new Date(expiryTime) - new Date()) / (1000 * 60 * 60);

  if (hoursRemaining <= 2) return { label: "Critical", className: "urgency-critical" };
  if (hoursRemaining <= 5) return { label: "High", className: "urgency-high" };
  if (hoursRemaining <= 12) return { label: "Medium", className: "urgency-medium" };
  return { label: "Normal", className: "urgency-normal" };
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

// ==================== SHARED HEADER ====================

function DashboardHeader() {
  return (
    <div className="dashboard-header">
      <Link to="/" className="dashboard-logo">
        🍱 FoodRescue <span>AI</span>
      </Link>
      <Link to="/login" className="logout-btn">
        Change Role
      </Link>
    </div>
  );
}

// ==================== NAVBAR ====================

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        🍱 FoodRescue <span>AI</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="/#how">How It Works</a>
        <a href="/#about">About</a>
        <Link to="/login" className="login-btn">
          Login
        </Link>
      </div>
    </nav>
  );
}

// ==================== LANDING PAGE ====================

function Home() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="tagline">AI-POWERED FOOD RESCUE PLATFORM</p>

            <h1>
              Turn Surplus Food
              <br />
              Into <span>Hope.</span>
            </h1>

            <p className="hero-text">
              FoodRescue AI connects food donors, NGOs and delivery drivers to
              make sure surplus food reaches people who need it.
            </p>

            <div className="hero-buttons">
              <Link to="/login?role=donor" className="primary-btn">
                Donate Food
              </Link>
              <Link to="/login?role=ngo" className="secondary-btn">
                Find Food
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="food-icon">🍱</div>
            <h3>Food Rescue Network</h3>
            <p>Donor → NGO → Driver → Pickup → Delivery</p>

            <div className="stats">
              <div>
                <strong>1,250+</strong>
                <small>Meals Rescued</small>
              </div>
              <div>
                <strong>85+</strong>
                <small>Active Donors</small>
              </div>
              <div>
                <strong>42</strong>
                <small>NGOs</small>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how" id="how">
          <p className="section-tag">SIMPLE PROCESS</p>
          <h2>How FoodRescue AI Works</h2>

          <div className="steps">
            <div className="step">
              <div className="step-icon">🍽️</div>
              <h3>1. Donor</h3>
              <p>Restaurants, hotels and individuals list their surplus food.</p>
            </div>
            <div className="step">
              <div className="step-icon">🏢</div>
              <h3>2. NGO</h3>
              <p>NGOs discover available donations and request the food.</p>
            </div>
            <div className="step">
              <div className="step-icon">🚚</div>
              <h3>3. Driver</h3>
              <p>A delivery driver receives the pickup request.</p>
            </div>
            <div className="step">
              <div className="step-icon">❤️</div>
              <h3>4. Delivery</h3>
              <p>Food is delivered to people who need it.</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>© 2026 FoodRescue AI — Reducing Food Waste, Feeding Communities.</p>
      </footer>
    </div>
  );
}

// ==================== LOGIN / ROLE SELECTION ====================

function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const suggestedRole = params.get("role");

  const selectRole = (role) => {
    if (["donor", "ngo", "driver"].includes(role)) navigate(`/${role}`);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Link to="/" className="back-home">
          ← Back to Home
        </Link>

        <div className="login-header">
          <div className="login-logo">🍱</div>
          <h1>Welcome to FoodRescue AI</h1>
          <p>Choose how you want to use the platform</p>
        </div>

        {suggestedRole && (
          <div className="suggestion">Please select your role to continue</div>
        )}

        <div className="role-grid">
          <button className="role-card" onClick={() => selectRole("donor")}>
            <div className="role-icon">🍽️</div>
            <h2>Donor</h2>
            <p>I have surplus food that I want to donate.</p>
            <span className="role-action">Continue as Donor →</span>
          </button>

          <button className="role-card" onClick={() => selectRole("ngo")}>
            <div className="role-icon">🏢</div>
            <h2>NGO / Receiver</h2>
            <p>I want to receive surplus food for people in need.</p>
            <span className="role-action">Continue as NGO →</span>
          </button>

          <button className="role-card" onClick={() => selectRole("driver")}>
            <div className="role-icon">🚚</div>
            <h2>Driver</h2>
            <p>I want to pick up and deliver donated food.</p>
            <span className="role-action">Continue as Driver →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== DONOR DASHBOARD ====================

const EMPTY_FORM = {
  foodName: "",
  quantity: "",
  unit: "kg",
  availableUntil: "",
  expiryTime: "",
  category: "Cooked Food",
  foodType: "Veg",
  pickupLocation: "",
};

function DonorDashboard() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [donations, setDonations] = useState(getDonations());

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const coordinates = await getCoordinates(formData.pickupLocation);

const newDonation = {
  id: Date.now(),
  ...formData,
  latitude: coordinates?.latitude || null,
  longitude: coordinates?.longitude || null,
  status: "Waiting for NGO",
};

    // Read fresh data so changes made by NGO/driver are not overwritten
    const updatedDonations = [newDonation, ...getDonations()];

    setDonations(updatedDonations);
    saveDonations(updatedDonations);
    setFormData(EMPTY_FORM);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <div className="donor-dashboard">
        {/* PAGE HEADER */}
        <div className="donor-heading">
          <div>
            <p className="section-tag">DONOR PORTAL</p>
            <h1>Donor Dashboard</h1>
            <p>Share your surplus food with people who need it.</p>
          </div>
          <div className="donor-welcome">👋 Welcome, Donor</div>
        </div>

        {/* STATISTICS */}
        <div className="donor-stats">
          <div className="donor-stat-card">
            <span>🍱</span>
            <div>
              <strong>{donations.length}</strong>
              <p>Total Donations</p>
            </div>
          </div>

          <div className="donor-stat-card">
            <span>❤️</span>
            <div>
              <strong>
                {donations.reduce((t, d) => t + Number(d.quantity || 0), 0)}
              </strong>
              <p>Food Units Donated</p>
            </div>
          </div>

          <div className="donor-stat-card">
            <span>🚚</span>
            <div>
              <strong>
                {donations.filter((d) => d.status !== "Delivered").length}
              </strong>
              <p>Active Donations</p>
            </div>
          </div>

          <div className="donor-stat-card">
            <span>♻️</span>
            <div>
              <strong>
                {donations.filter((d) => d.status === "Delivered").length}
              </strong>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* CREATE DONATION */}
        <div className="donation-section">
          <div className="section-heading">
            <div>
              <h2>🍱 Create Food Donation</h2>
              <p>Enter details about the surplus food you want to donate.</p>
            </div>
            <div className="ai-badge">✨ AI Powered</div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* FOOD NAME */}
            <div className="form-group">
              <label>
                Food Name <span>*</span>
              </label>
              <input
                type="text"
                name="foodName"
                placeholder="e.g. Vegetable Biryani"
                value={formData.foodName}
                onChange={handleChange}
                required
              />
            </div>

            {/* QUANTITY + UNIT */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  Quantity <span>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="e.g. 25"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Unit <span>*</span>
                </label>
                <select name="unit" value={formData.unit} onChange={handleChange}>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="grams">Grams (g)</option>
                  <option value="litres">Litres (L)</option>
                  <option value="packets">Packets</option>
                  <option value="boxes">Boxes</option>
                  <option value="plates">Plates</option>
                  <option value="meals">Meals</option>
                </select>
              </div>
            </div>

            {/* CATEGORY */}
            <div className="form-group">
              <label>
                Food Category <span>*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Cooked Food">Cooked Food</option>
                <option value="Bakery">Bakery</option>
                <option value="Fruits">Fruits</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Dairy">Dairy</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* FOOD TYPE */}
            <div className="form-group">
              <label>
                Food Type <span>*</span>
              </label>

              <div className="food-type-options">
                <label
                  className={`food-type ${
                    formData.foodType === "Veg" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="foodType"
                    value="Veg"
                    checked={formData.foodType === "Veg"}
                    onChange={handleChange}
                  />
                  <span className="veg-dot"></span>
                  🥬 Vegetarian
                </label>

                <label
                  className={`food-type ${
                    formData.foodType === "Non-Veg" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="foodType"
                    value="Non-Veg"
                    checked={formData.foodType === "Non-Veg"}
                    onChange={handleChange}
                  />
                  <span className="nonveg-dot"></span>
                  🍗 Non-Vegetarian
                </label>
              </div>
            </div>

            {/* TIME */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  Available Until <span>*</span>
                </label>
                <input
                  type="datetime-local"
                  name="availableUntil"
                  value={formData.availableUntil}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Expiry Time <span>*</span>
                </label>
                <input
                  type="datetime-local"
                  name="expiryTime"
                  value={formData.expiryTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* PICKUP LOCATION */}
            <div className="form-group">
              <label>
                Pickup Location <span>*</span>
              </label>
              <div className="location-input">
                <span>📍</span>
                <input
                  type="text"
                  name="pickupLocation"
                  placeholder="Enter pickup address"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* AI MATCHING */}
            <div className="ai-preview">
              <div className="ai-preview-icon">✨</div>
              <div>
                <h3>AI Matching</h3>
                <p>
                  FoodRescue AI will match this donation with suitable NGOs
                  based on food type, quantity, location and expiry time.
                </p>
              </div>
            </div>

            <button type="submit" className="create-donation-btn">
              🍱 Create Donation
            </button>
          </form>
        </div>

        {/* MY DONATIONS */}
        <div className="my-donations">
          <div className="section-heading">
            <div>
              <h2>📦 My Donations</h2>
              <p>Track the food donations you have created.</p>
            </div>
          </div>

          {donations.length === 0 ? (
            <div className="empty-donations">
              <div>📦</div>
              <h3>No donations yet</h3>
              <p>Create your first food donation using the form above.</p>
            </div>
          ) : (
            <div className="donation-list">
              {donations.map((donation) => (
                <div className="donation-card" key={donation.id}>
                  <div className="donation-card-top">
                    <div>
                      <h3>{donation.foodName}</h3>
                      <span className="category-label">{donation.category}</span>
                    </div>
                    <span className="status-badge">
                      {donation.status === "Delivered" ? "🟢" : "🟡"}{" "}
                      {donation.status}
                    </span>
                  </div>

                  <div className="donation-details">
                    <div>
                      <small>Quantity</small>
                      <strong>
                        {donation.quantity} {donation.unit}
                      </strong>
                    </div>
                    <div>
                      <small>Food Type</small>
                      <strong>
                        {donation.foodType === "Veg" ? "🥬 Veg" : "🍗 Non-Veg"}
                      </strong>
                    </div>
                    <div>
                      <small>Pickup</small>
                      <strong>📍 {donation.pickupLocation}</strong>
                    </div>
                    <div>
                      <small>Expiry</small>
                      <strong>{formatDate(donation.expiryTime)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== NGO DASHBOARD ====================

const IN_PICKUP_STATUSES = ["Driver Assigned", "Picked Up", "Out for Delivery"];
const ACCEPTED_STATUSES = ["NGO Accepted", ...IN_PICKUP_STATUSES, "Delivered"];

function NgoDashboard() {
  const [donations, setDonations] = useState(getDonations());

  const acceptDonation = (id) => {
    // Read fresh data so changes made in other tabs are not overwritten
    const updatedDonations = getDonations().map((donation) =>
      donation.id === id
        ? { ...donation, status: "NGO Accepted", ngoName: "FoodCare NGO" }
        : donation
    );

    setDonations(updatedDonations);
    saveDonations(updatedDonations);
  };

  const availableDonations = donations.filter(
    (d) => d.status === "Waiting for NGO"
  );
  const acceptedDonations = donations.filter((d) =>
    ACCEPTED_STATUSES.includes(d.status)
  );
  const inPickupCount = donations.filter((d) =>
    IN_PICKUP_STATUSES.includes(d.status)
  ).length;

  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <div className="ngo-dashboard">
        {/* HEADER */}
        <div className="ngo-heading">
          <div>
            <p className="section-tag">NGO / RECEIVER PORTAL</p>
            <h1>NGO Dashboard</h1>
            <p>Find surplus food and help deliver it to people in need.</p>
          </div>
          <div className="ngo-welcome">🏢 FoodCare NGO</div>
        </div>

        {/* STATS */}
        <div className="ngo-stats">
          <div className="ngo-stat-card">
            <span>🍱</span>
            <div>
              <strong>{availableDonations.length}</strong>
              <p>Available Donations</p>
            </div>
          </div>

          <div className="ngo-stat-card">
            <span>❤️</span>
            <div>
              <strong>{acceptedDonations.length}</strong>
              <p>Accepted</p>
            </div>
          </div>

          <div className="ngo-stat-card">
            <span>🚚</span>
            <div>
              <strong>{inPickupCount}</strong>
              <p>In Pickup</p>
            </div>
          </div>

          <div className="ngo-stat-card">
            <span>🤝</span>
            <div>
              <strong>128</strong>
              <p>People Helped</p>
            </div>
          </div>
        </div>

        {/* AVAILABLE DONATIONS */}
        <div className="ngo-section">
          <div className="ngo-section-heading">
            <div>
              <h2>🍱 Available Food Donations</h2>
              <p>Donations waiting for an NGO to accept them.</p>
            </div>
            <div className="ai-badge">✨ AI Matched</div>
          </div>

          {availableDonations.length === 0 ? (
            <div className="ngo-empty">
              <div>🔍</div>
              <h3>No donations available</h3>
              <p>New donor donations will appear here automatically.</p>
            </div>
          ) : (
            <div className="ngo-donation-list">
              {availableDonations.map((donation) => {
                const urgency = getUrgencyLevel(donation.expiryTime);
                const matchScore = calculateMatchScore(donation);

                return (
                  <div className="ngo-donation-card" key={donation.id}>
                    {/* CARD HEADER */}
                    <div className="ngo-card-header">
                      <div>
                        <h3>{donation.foodName}</h3>
                        <span className="category-label">
                          {donation.category}
                        </span>
                      </div>

                      <div className="ngo-ai-result">
                        <span className="match-badge">✨ {matchScore}% Match</span>
                        <span className={`urgency-badge ${urgency.className}`}>
                          ⏰ {urgency.label} Urgency
                        </span>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="ngo-details">
                      <div>
                        <small>Quantity</small>
                        <strong>
                          {donation.quantity} {donation.unit}
                        </strong>
                      </div>
                      <div>
                        <small>Food Type</small>
                        <strong>
                          {donation.foodType === "Veg"
                            ? "🥬 Vegetarian"
                            : "🍗 Non-Vegetarian"}
                        </strong>
                      </div>
                      <div>
                        <small>Available Until</small>
                        <strong>{formatDate(donation.availableUntil)}</strong>
                      </div>
                      <div>
                        <small>Expiry</small>
                        <strong>{formatDate(donation.expiryTime)}</strong>
                      </div>
                    </div>

                    {/* LOCATION */}
                    <div className="ngo-location">
                      <span>📍</span>
                      <div>
                        <small>Pickup Location</small>
                        <strong>{donation.pickupLocation}</strong>
                      </div>
                    </div>

                    {/* ACTION */}
                    <button
                      className="accept-donation-btn"
                      onClick={() => acceptDonation(donation.id)}
                    >
                      ✅ Accept Donation
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ACCEPTED DONATIONS */}
        <div className="ngo-section">
          <div className="ngo-section-heading">
            <div>
              <h2>📦 My Accepted Donations</h2>
              <p>Food donations your NGO has accepted.</p>
            </div>
          </div>

          {acceptedDonations.length === 0 ? (
            <div className="ngo-empty small">
              <div>📦</div>
              <p>You haven't accepted any donations yet.</p>
            </div>
          ) : (
            <div className="accepted-list">
              {acceptedDonations.map((donation) => (
                <div className="accepted-card" key={donation.id}>
                  <div>
                    <h3>{donation.foodName}</h3>
                    <p>
                      {donation.quantity} {donation.unit} • {donation.foodType}
                    </p>
                    <small>📍 {donation.pickupLocation}</small>
                  </div>
                  <span className="accepted-status">🟢 {donation.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== DRIVER DASHBOARD ====================

function DriverDashboard() {
  const [donations, setDonations] = useState(getDonations());

  const updateStatus = (id, newStatus) => {
    const updatedDonations = getDonations().map((donation) =>
      donation.id === id
        ? {
            ...donation,
            status: newStatus,
            driverName: "Rahul Driver",
          }
        : donation
    );

    saveDonations(updatedDonations);
    setDonations(updatedDonations);
  };

  const skipPickup = (id) => {
    const updatedDonations = getDonations().map((donation) =>
      donation.id === id
        ? {
            ...donation,
            skippedBy: [
              ...(donation.skippedBy || []),
              "Rahul Driver",
            ],
          }
        : donation
    );

    saveDonations(updatedDonations);
    setDonations(updatedDonations);
  };


  const availablePickups = donations.filter(
  (d) =>
    d.status === "NGO Accepted" &&
    !(d.skippedBy || []).includes("Rahul Driver")
);
  const myPickups = donations.filter((d) =>
    IN_PICKUP_STATUSES.includes(d.status)
  );
  const completedDeliveries = donations.filter((d) => d.status === "Delivered");

  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <div className="driver-dashboard">
        {/* PAGE HEADER */}
        <div className="driver-heading">
          <div>
            <p className="section-tag">DELIVERY PARTNER PORTAL</p>
            <h1>Driver Dashboard</h1>
            <p>Pick up rescued food and deliver it to NGOs.</p>
          </div>
          <div className="driver-welcome">🚚 Rahul Driver</div>
        </div>

        {/* STATS */}
        <div className="driver-stats">
          <div className="driver-stat-card">
            <span>📦</span>
            <div>
              <strong>{availablePickups.length}</strong>
              <p>Available Pickups</p>
            </div>
          </div>

          <div className="driver-stat-card">
            <span>🚚</span>
            <div>
              <strong>{myPickups.length}</strong>
              <p>Active Deliveries</p>
            </div>
          </div>

          <div className="driver-stat-card">
            <span>❤️</span>
            <div>
              <strong>{completedDeliveries.length}</strong>
              <p>Completed</p>
            </div>
          </div>

          <div className="driver-stat-card">
            <span>🌱</span>
            <div>
              <strong>
                {completedDeliveries.reduce(
                  (t, d) => t + Number(d.quantity || 0),
                  0
                )}
              </strong>
              <p>Food Units Delivered</p>
            </div>
          </div>
        </div>

        {/* AVAILABLE PICKUPS */}
        <div className="driver-section">
          <div className="driver-section-heading">
            <div>
              <h2>📦 Available Pickup Requests</h2>
              <p>NGO-approved donations waiting for a driver.</p>
            </div>
            <div className="ai-badge">✨ Smart Route</div>
          </div>

          {availablePickups.length === 0 ? (
            <div className="driver-empty">
              <div>🚚</div>
              <h3>No pickup requests</h3>
              <p>NGO-approved donations will appear here.</p>
            </div>
          ) : (
            <div className="pickup-list">
              {availablePickups.map((donation) => (
                <div className="pickup-card" key={donation.id}>
                  <div className="pickup-header">
                    <div>
                      <h3>{donation.foodName}</h3>
                      <span className="category-label">{donation.category}</span>
                    </div>
                    <span className="driver-status ngo-approved">
                      🟢 NGO Accepted
                    </span>
                  </div>

                  <div className="pickup-details">
                    <div>
                      <small>Quantity</small>
                      <strong>
                        {donation.quantity} {donation.unit}
                      </strong>
                    </div>
                    <div>
                      <small>Food Type</small>
                      <strong>
                        {donation.foodType === "Veg"
                          ? "🥬 Vegetarian"
                          : "🍗 Non-Vegetarian"}
                      </strong>
                    </div>
                    <div>
                      <small>NGO</small>
                      <strong>{donation.ngoName || "FoodCare NGO"}</strong>
                    </div>
                  </div>

                  {/* ROUTE */}
                  <div className="route-box">
                    <div className="route-point">
                      <span className="route-icon pickup">📍</span>
                      <div>
                        <small>PICKUP FROM DONOR</small>
                        <strong>{donation.pickupLocation}</strong>
                      </div>
                    </div>

                    <div className="route-line">↓</div>

                    <div className="route-point">
                      <span className="route-icon ngo">🏢</span>
                      <div>
                        <small>DELIVER TO NGO</small>
                        <strong>{donation.ngoName || "FoodCare NGO"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="expiry-warning">
                    ⏰ Food expires at:{" "}
                    <strong>{formatDate(donation.expiryTime)}</strong>
                  </div>

                  <button
                    className="accept-pickup-btn"
                    onClick={() => updateStatus(donation.id, "Driver Assigned")}
                  >
                    🚚 Accept Pickup
                  </button>
                  <button
  className="skip-button"
  onClick={() => skipPickup(donation.id)}
>
  ⏭️ Skip
</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE DELIVERIES */}
        {myPickups.map((donation) => (
  <DeliveryMap
    key={`map-${donation.id}`}
    donation={donation}
  />
))}
        <div className="driver-section">
          <div className="driver-section-heading">
            <div>
              <h2>🚚 My Active Deliveries</h2>
              <p>Manage your current food pickups and deliveries.</p>
            </div>
          </div>

          {myPickups.length === 0 ? (
            <div className="driver-empty small">
              <div>📦</div>
              <p>You don't have any active deliveries.</p>
            </div>
          ) : (
            <div className="active-delivery-list">
              {myPickups.map((donation) => (
                <div className="active-delivery-card" key={donation.id}>
                  <div className="active-delivery-info">
                    <div className="delivery-icon">🚚</div>
                    <div>
                      <h3>{donation.foodName}</h3>
                      <p>
                        {donation.quantity} {donation.unit}
                      </p>
                      <small>📍 {donation.pickupLocation}</small>
                    </div>
                  </div>

                  <div className="delivery-actions">
                    <span className="driver-status">{donation.status}</span>

                    {donation.status === "Driver Assigned" && (
                      <button
                        className="delivery-btn"
                        onClick={() => updateStatus(donation.id, "Picked Up")}
                      >
                        📦 Mark Picked Up
                      </button>
                    )}

                    {donation.status === "Picked Up" && (
                      <button
                        className="delivery-btn"
                        onClick={() =>
                          updateStatus(donation.id, "Out for Delivery")
                        }
                      >
                        🚚 Start Delivery
                      </button>
                    )}

                    {donation.status === "Out for Delivery" && (
                      <button
                        className="delivery-btn delivered"
                        onClick={() => updateStatus(donation.id, "Delivered")}
                      >
                        ❤️ Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COMPLETED */}
        <div className="driver-section">
          <div className="driver-section-heading">
            <div>
              <h2>❤️ Completed Deliveries</h2>
              <p>Your successfully delivered food donations.</p>
            </div>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="driver-empty small">
              <div>❤️</div>
              <p>Completed deliveries will appear here.</p>
            </div>
          ) : (
            <div className="completed-list">
              {completedDeliveries.map((donation) => (
                <div className="completed-card" key={donation.id}>
                  <div>
                    <h3>{donation.foodName}</h3>
                    <p>
                      {donation.quantity} {donation.unit} • {donation.foodType}
                    </p>
                    <small>📍 {donation.pickupLocation}</small>
                  </div>
                  <span className="completed-status">✅ Delivered</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function DeliveryMap({ donation }) {
  const [driverLocation, setDriverLocation] = useState([
    26.8780,
    75.6750,
  ]);

  const pickupLocation =
    donation.latitude && donation.longitude
      ? [donation.latitude, donation.longitude]
      : [26.8436, 75.5650];

  const ngoLocation = [26.9124, 75.7873];
  // Calculate distance between two GPS coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
const driverToDonorDistance = calculateDistance(
  driverLocation[0],
  driverLocation[1],
  pickupLocation[0],
  pickupLocation[1]
);

const donorToNgoDistance = calculateDistance(
  pickupLocation[0],
  pickupLocation[1],
  ngoLocation[0],
  ngoLocation[1]
);

const totalDistance =
  driverToDonorDistance + donorToNgoDistance;

const driverToDonorTime = Math.max(
  5,
  Math.round((driverToDonorDistance / 30) * 60)
);

const donorToNgoTime = Math.max(
  5,
  Math.round((donorToNgoDistance / 30) * 60)
);

const totalEstimatedMinutes =
  driverToDonorTime + donorToNgoTime;
  const urgency = getUrgencyLevel(donation.expiryTime);

let driverRecommendation = "Good pickup option";

if (urgency.label === "Critical") {
  driverRecommendation = "🚨 Pickup urgently — food expires soon";
} else if (urgency.label === "High") {
  driverRecommendation = "⚡ Prioritize this pickup";
} else if (totalDistance <= 10) {
  driverRecommendation = "✅ Nearby delivery";
} else if (totalDistance >= 25) {
  driverRecommendation = "📍 Long route — consider availability";
}

  const [locationMessage, setLocationMessage] = useState(
    "Using demo driver location"
  );

  const getDriverLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("GPS is not supported by this browser");
      return;
    }

    setLocationMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setDriverLocation([latitude, longitude]);
        setLocationMessage("📍 Driver GPS location active");
      },
      (error) => {
        console.error("GPS error:", error);
        setLocationMessage(
          "Location permission denied. Using demo location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const route = [
    pickupLocation,
    driverLocation,
    ngoLocation,
  ];

  return (
    <div className="delivery-map-wrapper">
      <div className="map-header">
        <div>
          <h3>🗺️ Smart Delivery Route</h3>

          <p>
            {donation.foodName} • {donation.quantity} {donation.unit}
          </p>

          <p className="location-message">
            {locationMessage}
          </p>
        </div>

        <button
          type="button"
          className="gps-button"
          onClick={getDriverLocation}
        >
          📍 Use My Location
        </button>
      </div>

      <MapContainer
        center={driverLocation}
        zoom={12}
        className="delivery-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={pickupLocation}>
          <Popup>
            <strong>📦 Pickup Location</strong>
            <br />
            {donation.pickupLocation}
          </Popup>
        </Marker>

        <Marker position={driverLocation}>
          <Popup>
            <strong>🚚 Driver Location</strong>
            <br />
            Rahul Driver
          </Popup>
        </Marker>

        <Marker position={ngoLocation}>
          <Popup>
            <strong>🏢 NGO Destination</strong>
            <br />
            FoodCare NGO
          </Popup>
        </Marker>

        <Polyline positions={route} />
      </MapContainer>

      <div className="route-summary">
        <div className="route-metrics">

  <div>
    <span>🚚 → 📦</span>
    <strong>{driverToDonorDistance.toFixed(1)} km</strong>
    <small>Driver → Donor</small>
  </div>

  <div>
    <span>📦 → 🏢</span>
    <strong>{donorToNgoDistance.toFixed(1)} km</strong>
    <small>Donor → NGO</small>
  </div>

  <div>
    <span>🛣️</span>
    <strong>{totalDistance.toFixed(1)} km</strong>
    <small>Total Route</small>
  </div>

</div>

<div className="eta-card">
  <span>⏱️</span>

  <div>
    <div className="driver-ai-recommendation">
  <div className="ai-recommendation-icon">
    🤖
  </div>

  <div>
    <strong>Smart Driver Recommendation</strong>

    <p>{driverRecommendation}</p>

    <small>
      {urgency.label} urgency • {totalDistance.toFixed(1)} km total route
    </small>
  </div>
</div>
    <strong>{totalEstimatedMinutes} min</strong>
    <small>Estimated Total Delivery Time</small>
  </div>
</div>
        <div>
          <span>📦</span>
          <strong>Pickup</strong>
          <small>{donation.pickupLocation}</small>
        </div>

        <div>
          <span>🚚</span>
          <strong>Driver</strong>
          <small>{locationMessage}</small>
        </div>

        <div>
          <span>🏢</span>
          <strong>Destination</strong>
          <small>FoodCare NGO</small>
        </div>
      </div>
    </div>
  );
}

// ==================== APP ====================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/ngo" element={<NgoDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
