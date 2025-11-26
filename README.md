<p align="center">
  <img src="https://github.com/user-attachments/assets/392d4794-9fdc-4797-8ce2-5a7a89b1d407" width="200">
</p>
# 🚀 GeoCargo: Global Logistics Pilot - Game Design Document

**LIVE WEBSITE URL:** https://gmt-458-web-gis.github.io/geogame-yusragundogdu/

This document outlines the fundamental design and technical architecture for the **GeoCargo** project, a web-based simulation game that blends logistics planning with GIS principles.

---

## I. Frontend Requirements and Layout Design

The frontend utilizes a custom split-screen layout framed by a cohesive **Dark/Futuristic** theme.

* **Theme:** Dark (Black) background with **Yellow LED (Glow)** accents and a dynamic video background on the main menu.
* **Left Area (75%):** **The Map Viewer.** This is the primary OpenLayers interface where real-time flight tracking, route plotting, and hazard visualizations occur.
* **Right Area (25%):** **The Dashboard.** A dedicated status panel for displaying real-time metrics like Score, Fuel, Speed, and the user's current mission objective.

---

## II. Game Progression and Mechanics

The game follows a task-based structure, testing the player's spatial decision-making and risk assessment skills.

### 1. Gameplay Rules

| Rule | Description |
| :--- | :--- |
| **Goal** | Complete **5 Missions** to achieve victory. |
| **Progression** | **Time-Bound Tasks:** Players must deliver cargo to random global airports within a strict time limit. |
| **Lives System** | The player starts with **3 Lives**. Failing a mission (running out of fuel, time, or crashing) results in the loss of **1 Life**. |
| **Hazards** | **Storm Zones:** Red circular zones appear randomly. Entering them drastically increases fuel consumption. |
| **Fuel System** | Fuel does not reset between missions. Players must manage their resources carefully. |

### 2. Game Modes

* **Single Player (Strategic Mode):** Use the **Mouse** to plot safe waypoints around storms. The plane follows your drawn path automatically.
* **Single Player (Arcade Mode):** Use **WASD** keys to manually pilot the plane and dodge storms in real-time.
* **2-Player Mode (Co-op/Race):** Split controls on the same screen. **Player 1 (Blue Plane)** uses WASD, **Player 2 (Red Plane)** uses Arrow Keys. The first to reach the destination wins the round.

---

## III. Technical Architecture & Libraries

The project utilizes a powerful combination of geospatial and web technologies:

### 1. Libraries Used
* **OpenLayers (v7.3.0):** Used for the core mapping engine, coordinate transformations, vector layers (planes, storms, routes), and interaction handling.
* **Native HTML5 Audio/Video:** Used for the immersive background video and dynamic sound effects (engine sound, victory music).

### 2. System Logic (The 3-Tier Flow)
1.  **Data Layer:** Manages geographic data arrays (Airport coordinates) and game state (Fuel, Score, Lives).
2.  **Visualization Layer:** Renders the map via OpenLayers and updates the DOM for the Dashboard and Modal interfaces.
3.  **Calculation Layer:**
    * Calculates distances using Euclidean geometry on projected coordinates.
    * Detects collisions between the Plane (Point) and Storms (Polygon/Circle).
    * Manages flight animations using `requestAnimationFrame`.

---

## IV. How to Play

1.  **Select Mode:** Choose between Single Player or 2-Player mode on the main menu.
2.  **Start Mission:** Click START. A destination (Goal) will be assigned.
3.  **Navigate:**
    * **Mouse Mode:** Click on the map to place yellow waypoints to avoid storms. Click the Green Target circle to launch.
    * **Keyboard Mode:** Use WASD or Arrow keys to fly manually.
4.  **Manage Risks:** Avoid Red Storm zones to save fuel. Watch the timer!
5.  **Win:** Complete 5 missions to win the game.

---
*Developed by Yüsra Gündoğdu for GMT-458 Web-GIS Course.*
